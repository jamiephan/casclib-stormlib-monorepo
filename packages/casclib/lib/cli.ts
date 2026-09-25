#!/usr/bin/env node
import { Command, CommanderError } from 'commander';
import { open } from 'node:fs/promises';
import type { Storage } from './storage';

type OpenOptions = { online?: boolean };

async function withStorage(source: string, options: OpenOptions, action: (storage: Storage) => Promise<void>): Promise<void> {
  const { Storage } = await import('./storage');
  const storage = options.online
    ? await Storage.openOnlineAsync(source)
    : await Storage.openAsync(source);
  try {
    await action(storage);
  } finally {
    storage.close();
  }
}

function writeOutput(data: string | Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stdout.write(data, error => error ? reject(error) : resolve());
  });
}

export function createCli(): Command {
  const program = new Command()
    .name('casclib')
    .description('Inspect and extract local or online CASC storage')
    .version(require('../package.json').version)
    .exitOverride()
    .showHelpAfterError();

  const command = (name: string, description: string): Command => program.command(name)
    .description(description)
    .argument('<storage>', 'Local storage path or online connection string')
    .option('--online', 'Open online storage: cache*product[*region]')
    .allowExcessArguments(false);

  command('info', 'Print storage metadata as JSON')
    .action(async (source: string, options: OpenOptions) => {
      await withStorage(source, options, async storage => {
        await writeOutput(`${JSON.stringify({
          ...storage.getProductInfo(),
          fileCount: storage.getTotalFileCount()
        }, null, 2)}\n`);
      });
    });

  command('list', 'List file names matching a wildcard mask')
    .option('-m, --mask <pattern>', 'File mask (quote wildcards)', '*')
    .option('--listfile <path>', 'External listfile used to resolve file names')
    .option('--json', 'Print file names and sizes as a JSON array')
    .action(async (source: string, options: OpenOptions & { mask: string; listfile?: string; json?: boolean }) => {
      await withStorage(source, options, async storage => {
        const entries = storage.files(options.mask, options.listfile);
        if (options.json) {
          await writeOutput(`${JSON.stringify(Array.from(entries, entry => ({ name: entry.fileName, size: entry.fileSize })), null, 2)}\n`);
        } else {
          for (const entry of entries) await writeOutput(`${entry.fileName}\n`);
        }
      });
    });

  command('cat', 'Write a file to stdout without text conversion')
    .argument('<file>', 'File name within storage')
    .action(async (source: string, filename: string, options: OpenOptions) => {
      await withStorage(source, options, async storage => {
        await writeOutput(await storage.readFileAsync(filename));
      });
    });

  command('extract', 'Extract one file to a new output file (never overwrites)')
    .argument('<file>', 'File name within storage')
    .argument('<destination>', 'Explicit output path; parent directory must exist')
    .action(async (source: string, filename: string, destination: string, options: OpenOptions) => {
      await withStorage(source, options, async storage => {
        const data = await storage.readFileAsync(filename);
        const output = await open(destination, 'wx');
        try {
          await output.writeFile(data);
        } finally {
          await output.close();
        }
      });
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
        console.error(`casclib: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 1;
      }
    });
  }
}