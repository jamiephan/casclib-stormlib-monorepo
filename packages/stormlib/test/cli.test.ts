import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const packageRoot = path.resolve(__dirname, '..');
const cliPath = path.join(packageRoot, 'dist', 'cli.js');
const run = (...args: string[]) => spawnSync(process.execPath, [cliPath, ...args]);
let directory: string;
let archivePath: string;
let sourcePath: string;
const payload = Buffer.from([0, 255, 128, 13, 10, 42, 0]);

beforeAll(() => {
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', packageRoot]);
});

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stormlib-cli-'));
  archivePath = path.join(directory, 'test archive.mpq');
  sourcePath = path.join(directory, 'source.bin');
  fs.writeFileSync(sourcePath, payload);
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

function createArchive(): void {
  const created = run('create', archivePath);
  expect(created.stderr.toString()).toBe('');
  expect(created.status).toBe(0);
  const added = run('add', archivePath, sourcePath, 'folder\\data.bin');
  expect(added.stderr.toString()).toBe('');
  expect(added.status).toBe(0);
}

describe('stormlib CLI', () => {
  it.each([[], ['--help'], ['list', '--help']])('prints help for %j', (...args) => {
    const result = run(...args);
    expect(result.status).toBe(0);
    expect(result.stdout.toString()).toContain('Usage:');
    expect(result.stderr.toString()).toBe('');
  });

  it('prints the package version', () => {
    const result = run('--version');
    expect(result.status).toBe(0);
    expect(result.stdout.toString().trim()).toBe(require('../package.json').version);
  });

  it.each([
    ['unknown'], ['cat'], ['list', 'missing.mpq', '--unknown'], ['info', 'missing.mpq', 'extra']
  ])('rejects invalid arguments: %j', (...args) => {
    const result = run(...args);
    expect(result.status).toBe(1);
    expect(result.stdout.length).toBe(0);
    expect(result.stderr.toString()).toContain('error:');
  });

  it('reports native failures on stderr without a stack trace', () => {
    const result = run('info', archivePath);
    expect(result.status).toBe(1);
    expect(result.stdout.length).toBe(0);
    expect(result.stderr.toString()).toMatch(/^stormlib: /);
    expect(result.stderr.toString()).not.toContain('    at ');
  });

  it('creates, lists, inspects, reads, extracts, and removes an entry', () => {
    createArchive();
    const original = fs.readFileSync(archivePath);
    const listed = run('list', archivePath, '--mask', '*.bin', '--json');
    expect(listed.status).toBe(0);
    expect(JSON.parse(listed.stdout.toString())).toEqual([{ name: 'folder\\data.bin', size: payload.length }]);
    expect(run('list', archivePath, '-m', '*.bin').stdout.toString()).toBe('folder\\data.bin\n');
    expect(JSON.parse(run('list', archivePath, '-m', '*.missing', '--json').stdout.toString())).toEqual([]);

    const info = run('info', archivePath);
    expect(info.status).toBe(0);
    expect(JSON.parse(info.stdout.toString())).toEqual({
      fileCount: expect.any(Number), totalSize: expect.any(Number), compressedSize: expect.any(Number)
    });
    const cat = run('cat', archivePath, 'folder\\data.bin');
    expect(cat.status).toBe(0);
    expect(cat.stdout).toEqual(payload);
    expect(cat.stderr.length).toBe(0);

    const destination = path.join(directory, 'output.bin');
    expect(run('extract', archivePath, 'folder\\data.bin', destination).status).toBe(0);
    expect(fs.readFileSync(destination)).toEqual(payload);
    expect(fs.readFileSync(archivePath)).toEqual(original);

    expect(run('remove', archivePath, 'folder\\data.bin').status).toBe(0);
    expect(run('cat', archivePath, 'folder\\data.bin').status).toBe(1);
  });

  it('protects existing archives, output files, and entries unless replacement is requested', () => {
    createArchive();
    const original = fs.readFileSync(archivePath);
    expect(run('create', archivePath).status).toBe(1);
    expect(fs.readFileSync(archivePath)).toEqual(original);

    const destination = path.join(directory, 'existing.bin');
    fs.writeFileSync(destination, 'keep');
    expect(run('extract', archivePath, 'folder\\data.bin', destination).status).toBe(1);
    expect(fs.readFileSync(destination, 'utf8')).toBe('keep');

    fs.writeFileSync(sourcePath, 'replacement');
    expect(run('add', archivePath, sourcePath, 'folder\\data.bin').status).toBe(1);
    expect(run('cat', archivePath, 'folder\\data.bin').stdout).toEqual(payload);
    expect(run('add', archivePath, sourcePath, 'folder\\data.bin', '--replace').status).toBe(0);
    expect(run('cat', archivePath, 'folder\\data.bin').stdout.toString()).toBe('replacement');
  });

  it('does not create output for missing entries', () => {
    createArchive();
    const destination = path.join(directory, 'output.bin');
    expect(run('extract', archivePath, 'missing', destination).status).toBe(1);
    expect(fs.existsSync(destination)).toBe(false);
  });
});