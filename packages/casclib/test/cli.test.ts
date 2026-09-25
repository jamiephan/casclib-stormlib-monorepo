import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createCli } from '../lib/cli';
import { Storage } from '../lib/storage';

jest.mock('../lib/storage', () => ({
  Storage: { openAsync: jest.fn(), openOnlineAsync: jest.fn() }
}));

const packageRoot = path.resolve(__dirname, '..');
const cliPath = path.join(packageRoot, 'dist', 'cli.js');
const run = (...args: string[]) => spawnSync(process.execPath, [cliPath, ...args]);
const parse = (...args: string[]) => createCli().parseAsync(args, { from: 'user' });
const payload = Buffer.from([0, 255, 128, 13, 10, 42, 0]);
const storage = {
  close: jest.fn(),
  getProductInfo: jest.fn(),
  getTotalFileCount: jest.fn(),
  files: jest.fn(),
  readFileAsync: jest.fn()
};
let output: Buffer[];
let directory: string;

beforeAll(() => {
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', packageRoot]);
});

beforeEach(() => {
  jest.resetAllMocks();
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'casclib-cli-'));
  output = [];
  jest.spyOn(process.stdout, 'write').mockImplementation((chunk, callback?: BufferEncoding | ((error?: Error | null) => void)) => {
    output.push(Buffer.from(chunk));
    if (typeof callback === 'function') callback();
    return true;
  });
  jest.mocked(Storage.openAsync).mockResolvedValue(storage as unknown as Storage);
  jest.mocked(Storage.openOnlineAsync).mockResolvedValue(storage as unknown as Storage);
  storage.getProductInfo.mockReturnValue({ codeName: 'hero', buildNumber: 123 });
  storage.getTotalFileCount.mockReturnValue(1);
  storage.files.mockReturnValue([{ fileName: 'folder/data.bin', fileSize: payload.length }]);
  storage.readFileAsync.mockResolvedValue(payload);
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(directory, { recursive: true, force: true });
});

describe('casclib CLI', () => {
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
    ['unknown'], ['extract', 'storage'], ['list', 'storage', '--unknown'], ['info', 'storage', 'extra']
  ])('rejects invalid arguments: %j', (...args) => {
    const result = run(...args);
    expect(result.status).toBe(1);
    expect(result.stdout.length).toBe(0);
    expect(result.stderr.toString()).toContain('error:');
  });

  it('reports native failures without a stack trace', () => {
    const result = run('info', path.join(directory, 'missing'));
    expect(result.status).toBe(1);
    expect(result.stdout.length).toBe(0);
    expect(result.stderr.toString()).toMatch(/^casclib: /);
    expect(result.stderr.toString()).not.toContain('    at ');
  });

  it('prints local storage metadata and closes the handle', async () => {
    await parse('info', 'local-storage');
    expect(Storage.openAsync).toHaveBeenCalledWith('local-storage');
    expect(Storage.openOnlineAsync).not.toHaveBeenCalled();
    expect(JSON.parse(Buffer.concat(output).toString())).toEqual({ codeName: 'hero', buildNumber: 123, fileCount: 1 });
    expect(storage.close).toHaveBeenCalledTimes(1);
  });

  it('passes the online connection, mask, and listfile unchanged', async () => {
    await parse('list', 'cache*hero*us', '--online', '--mask', '*.bin', '--listfile', 'names.txt', '--json');
    expect(Storage.openOnlineAsync).toHaveBeenCalledWith('cache*hero*us');
    expect(Storage.openAsync).not.toHaveBeenCalled();
    expect(storage.files).toHaveBeenCalledWith('*.bin', 'names.txt');
    expect(JSON.parse(Buffer.concat(output).toString())).toEqual([{ name: 'folder/data.bin', size: payload.length }]);
    expect(storage.close).toHaveBeenCalledTimes(1);
  });

  it('prints names one per line and handles no matches', async () => {
    await parse('list', 'storage');
    expect(Buffer.concat(output).toString()).toBe('folder/data.bin\n');
    output = [];
    storage.files.mockReturnValue([]);
    await parse('list', 'storage', '--json');
    expect(JSON.parse(Buffer.concat(output).toString())).toEqual([]);
  });

  it('writes raw bytes to stdout', async () => {
    await parse('cat', 'storage', 'folder/data.bin');
    expect(storage.readFileAsync).toHaveBeenCalledWith('folder/data.bin');
    expect(Buffer.concat(output)).toEqual(payload);
    expect(storage.close).toHaveBeenCalledTimes(1);
  });

  it('extracts only to the explicit destination and never overwrites', async () => {
    const destination = path.join(directory, 'output.bin');
    await parse('extract', 'storage', '../archive-name.bin', destination);
    expect(fs.readFileSync(destination)).toEqual(payload);
    storage.readFileAsync.mockResolvedValue(Buffer.from('replacement'));
    await expect(parse('extract', 'storage', 'file.bin', destination)).rejects.toMatchObject({ code: 'EEXIST' });
    expect(fs.readFileSync(destination)).toEqual(payload);
    expect(storage.close).toHaveBeenCalledTimes(2);
  });

  it('closes storage on a read failure without creating an output file', async () => {
    const destination = path.join(directory, 'output.bin');
    storage.readFileAsync.mockRejectedValue(new Error('Read failed'));
    await expect(parse('extract', 'storage', 'missing', destination)).rejects.toThrow('Read failed');
    expect(fs.existsSync(destination)).toBe(false);
    expect(storage.close).toHaveBeenCalledTimes(1);
  });

  it('propagates an open failure without attempting operations', async () => {
    jest.mocked(Storage.openOnlineAsync).mockRejectedValue(new Error('CDN unavailable'));
    await expect(parse('info', 'cache*hero', '--online')).rejects.toThrow('CDN unavailable');
    expect(storage.getProductInfo).not.toHaveBeenCalled();
    expect(storage.close).not.toHaveBeenCalled();
  });
});