#!/usr/bin/env node
import { Command, CommanderError } from 'commander';
import { open } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Archive } from './archive';

async function withArchive(source: string, writable: boolean, action: (archive: Archive) => Promise<void>): Promise<void> {
  const { Archive } = await import('./archive');
  const { MPQ_OPEN_READ_ONLY } = await import('./constants');
  const archive = await Archive.openAsync(source, { flags: writable ? 0 : MPQ_OPEN_READ_ONLY });
  try {
    await action(archive);
  } finally {
    archive.close();
  }
}

function writeOutput(data: string | Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stdout.write(data, error => error ? reject(error) : resolve());
  });
}

export function createCli(): Command {
  const program = new Command()
    .name('stormlib')
    .description('Inspect, extract, and modify MPQ archives')
    .version(require('../package.json').version)
    .exitOverride()
    .showHelpAfterError();

  const command = (name: string, description: string): Command => program.command(name)
    .description(description)
    .argument('<archive>', 'MPQ archive path')
    .allowExcessArguments(false);

  command('info', 'Print archive metadata as JSON')
    .action(async (source: string) => {
      await withArchive(source, false, async archive => {
        const entries = archive.listFiles();
        await writeOutput(`${JSON.stringify({
          fileCount: entries.length,
          totalSize: entries.reduce((total, entry) => total + entry.fileSize, 0),
          compressedSize: entries.reduce((total, entry) => total + entry.compSize, 0)
        }, null, 2)}\n`);
      });
    });

  command('list', 'List file names matching a wildcard mask')
    .option('-m, --mask <pattern>', 'File mask (quote wildcards)', '*')
    .option('--json', 'Print file names and sizes as a JSON array')
    .action(async (source: string, options: { mask: string; json?: boolean }) => {
      await withArchive(source, false, async archive => {
        const entries = archive.files(options.mask);
        if (options.json) {
          await writeOutput(`${JSON.stringify(Array.from(entries, entry => ({ name: entry.name, size: entry.fileSize })), null, 2)}\n`);
        } else {
          for (const entry of entries) await writeOutput(`${entry.name}\n`);
        }
      });
    });

  command('cat', 'Write a file to stdout without text conversion')
    .argument('<file>', 'File name within the archive')
    .action(async (source: string, filename: string) => {
      await withArchive(source, false, async archive => {
        await writeOutput(await archive.readFileAsync(filename));
      });
    });

  command('extract', 'Extract one file to a new output file (never overwrites)')
    .argument('<file>', 'File name within the archive')
    .argument('<destination>', 'Explicit output path; parent directory must exist')
    .action(async (source: string, filename: string, destination: string) => {
      await withArchive(source, false, async archive => {
        const data = await archive.readFileAsync(filename);
        const output = await open(destination, 'wx');
        try {
          await output.writeFile(data);
        } finally {
          await output.close();
        }
      });
    });

  command('create', 'Create a new empty MPQ archive')
    .action(async (destination: string) => {
      if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`);
      const { Archive } = await import('./archive');
      const { MPQ_CREATE_LISTFILE } = await import('./constants');
      const archive = Archive.create(destination, { flags: MPQ_CREATE_LISTFILE });
      archive.close();
    });

  command('add', 'Add a disk file to an existing archive with zlib compression')
    .argument('<source>', 'Source file on disk')
    .argument('<name>', 'File name within the archive')
    .option('--replace', 'Allow replacing an existing archive entry')
    .action(async (archivePath: string, source: string, name: string, options: { replace?: boolean }) => {
      await withArchive(archivePath, true, async archive => {
        const { MPQ_FILE_COMPRESS, MPQ_FILE_REPLACEEXISTING } = await import('./constants');
        archive.addFile(source, name, {
          flags: MPQ_FILE_COMPRESS | (options.replace ? MPQ_FILE_REPLACEEXISTING : 0)
        });
      });
    });

  command('remove', 'Remove a file from an existing archive')
    .argument('<file>', 'File name within the archive')
    .action(async (source: string, filename: string) => {
      await withArchive(source, true, async archive => { archive.removeFile(filename); });
    });

  return program;
}

if (require.main === module) {
  const program = createCli();
  if (process.argv.length === 2) {
    program.outputHelp();
  } else {
    void program.parseAsync().catch((error: unknown) => {
      if (error instanceof CommanderError) {
        process.exitCode = error.exitCode;
      } else {
        console.error(`stormlib: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
      }
    });
  }
}