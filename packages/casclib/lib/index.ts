import {
  CascStorageBinding,
  CascFileBinding,
  CascFindData,
  CascStorageInfo,
  CascFileInfoResult,
  CascNameType,
  CascOpenStorageExOptions,
  CascStorage,
  CascFile
} from './bindings';

// Polyfill Symbol.dispose for Node versions / TS targets without it (TS <5.2 / Node <20).
// This keeps `using` blocks working with newer toolchains while compiling cleanly under ES2020.
const kDispose: symbol = (Symbol as any).dispose ?? Symbol.for('nodejs.dispose');
if (!(Symbol as any).dispose) {
  (Symbol as any).dispose = kDispose;
}

/**
 * Options for opening a CASC storage
 */
export interface StorageOpenOptions {
  /** Flags for opening the storage */
  flags?: number;
}

/**
 * Information about a file in CASC storage
 */
export interface FileInfo {
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
}

/**
 * Options for opening a file from storage
 */
export interface FileOpenOptions {
  /** Open flags */
  flags?: number;
}

/**
 * CascLib Storage wrapper class
 * Provides methods to interact with CASC storage archives
 */
export class Storage {
  private storage: CascStorage;

  constructor() {
    this.storage = new CascStorageBinding();
  }

  /**
   * Open a CASC storage at the specified path
   * @param path - Path to the CASC storage directory
   * @param options - Optional opening options
   */
  open(path: string, options?: StorageOpenOptions): void {
    this.storage.CascOpenStorage(path, options?.flags || 0);
  }

  /**
   * Open an online CASC storage
   * @param path - Connection string in the format: `local_cache_folder[*cdn_server_url]*code_name[*region]`
   *   - `local_cache_folder`: Local cache directory for downloaded game data (reusable)
   *     - Windows: `C:/Temp/CASC/Cache`
   *     - Linux: `/tmp/casc/cache`
   *   - `cdn_server_url`: Optional CDN server URL (e.g., "http://us.patch.battle.net:1119")
   *   - `code_name`: TACT product code (e.g., "hero" for Heroes of the Storm, "wow" for World of Warcraft)
   *     See https://wowdev.wiki/TACT for available product codes
   *   - `region`: Optional server region (e.g., "us", "eu", "kr", "tw", "cn")
   * @param options - Optional opening options
   * @example
   * ```typescript
   * // Windows - Basic usage with minimal parameters
   * storage.openOnline('C:/Temp/CASC/Cache*hero');
   * 
   * // Linux - Basic usage
   * storage.openOnline('/tmp/casc/cache*hero');
   * 
   * // With CDN server specified
   * storage.openOnline('C:/Temp/CASC/Cache*http://us.patch.battle.net:1119*hero');
   * 
   * // With region specified
   * storage.openOnline('/tmp/casc/cache*hero*us');
   * 
   * // Full format with all parameters
   * storage.openOnline('C:/Temp/CASC/Cache*http://us.patch.battle.net:1119*hero*us');
   * ```
   */
  openOnline(path: string, options?: StorageOpenOptions): void {
    this.storage.CascOpenOnlineStorage(path, options?.flags || 0);
  }

  /**
   * Open a CASC storage with extended parameters (CascOpenStorageEx)
   * @param params - Path or parameter string
   * @param options - Extended opening options
   */
  openEx(params: string, options?: CascOpenStorageExOptions): void {
    this.storage.CascOpenStorageEx(params, options);
  }

  /**
   * Close the CASC storage
   */
  close(): boolean {
    return this.storage.CascCloseStorage();
  }

  /**
   * Open a file from the storage
   * @param filename - Name of the file to open
   * @param options - Optional opening options
   * @returns A File object
   */
  openFile(filename: string, options?: FileOpenOptions): File {
    const file = this.storage.CascOpenFile(filename, options?.flags || 0);
    return new File(file);
  }

  /**
   * Get information about a file
   * @param filename - Name of the file
   * @returns File information or null if file doesn't exist
   */
  getFileInfo(filename: string): FileInfo | null {
    return this.storage.CascGetFileInfo(filename);
  }

  /**
   * Check if a file exists in the storage
   * @param filename - Name of the file
   * @returns true if file exists, false otherwise
   */
  fileExists(filename: string): boolean {
    return this.storage.fileExists(filename);
  }

  /**
   * Get storage information
   * @param infoClass - The type of information to retrieve
   * @returns Storage information object
   */
  getStorageInfo(infoClass: number): CascStorageInfo {
    return this.storage.CascGetStorageInfo(infoClass);
  }

  /**
   * Find the first file matching the mask
   * @param mask - File mask (e.g., "*.txt")
   * @param listFile - Optional list file path
   * @returns Find data or null if no files found
   */
  findFirstFile(mask?: string, listFile?: string): CascFindData | null {
    return this.storage.CascFindFirstFile(mask, listFile);
  }

  /**
   * Find the next file in the search
   * @returns Find data or null if no more files
   */
  findNextFile(): CascFindData | null {
    return this.storage.CascFindNextFile();
  }

  /**
   * Close the current find operation
   * @returns true if closed successfully
   */
  findClose(): boolean {
    return this.storage.CascFindClose();
  }

  /**
   * Add an encryption key to the storage
   * @param keyName - Name/ID of the key
   * @param key - Key data as Buffer
   * @returns true if added successfully
   */
  addEncryptionKey(keyName: number, key: Buffer): boolean {
    return this.storage.CascAddEncryptionKey(keyName, key);
  }

  /**
   * Add an encryption key from a string
   * @param keyName - Name/ID of the key
   * @param keyStr - Key as string
   * @returns true if added successfully
   */
  addStringEncryptionKey(keyName: number, keyStr: string): boolean {
    return this.storage.CascAddStringEncryptionKey(keyName, keyStr);
  }

  /**
   * Import encryption keys from a string
   * @param keyList - String containing key list
   * @returns true if imported successfully
   */
  importKeysFromString(keyList: string): boolean {
    return this.storage.CascImportKeysFromString(keyList);
  }

  /**
   * Import encryption keys from a file
   * @param filePath - Path to the key file
   * @returns true if imported successfully
   */
  importKeysFromFile(filePath: string): boolean {
    return this.storage.CascImportKeysFromFile(filePath);
  }

  /**
   * Find an encryption key by name
   * @param keyName - Name/ID of the key
   * @returns Key data or null if not found
   */
  findEncryptionKey(keyName: number): Buffer | null {
    return this.storage.CascFindEncryptionKey(keyName);
  }

  /**
   * Get the name of an encryption key that was not found
   * @returns Key name or null
   */
  getNotFoundEncryptionKey(): number | null {
    return this.storage.CascGetNotFoundEncryptionKey();
  }

  // ---------------------------------------------------------------------------
  // High-level helpers
  // ---------------------------------------------------------------------------

  /**
   * Alias for fileExists — symmetry with stormlib's Archive.hasFile()
   */
  hasFile(filename: string): boolean {
    return this.fileExists(filename);
  }

  /**
   * Read a file from storage and return it as a Buffer.
   * Opens and closes the file internally.
   */
  readFile(filename: string, options?: FileOpenOptions): Buffer {
    const file = this.openFile(filename, options);
    try {
      return file.readAll();
    } finally {
      file.close();
    }
  }

  /**
   * Read a file from storage as a string.
   * @param encoding Buffer encoding (default 'utf-8').
   */
  readFileAsString(filename: string, encoding: BufferEncoding = 'utf-8'): string {
    return this.readFile(filename).toString(encoding);
  }

  /**
   * Read a file from storage and parse as JSON.
   */
  readFileAsJson<T = unknown>(filename: string): T {
    return JSON.parse(this.readFileAsString(filename, 'utf-8')) as T;
  }

  /**
   * Extract a file from storage to a path on disk.
   * Returns the number of bytes written.
   */
  extractFile(filename: string, destination: string): number {
    const fs = require('fs');
    const buf = this.readFile(filename);
    fs.writeFileSync(destination, buf);
    return buf.length;
  }

  /**
   * Find all files matching a mask, returning an array.
   * Wraps the stateful findFirstFile/findNextFile/findClose loop.
   */
  findAllFiles(mask: string = '*', listFile?: string): CascFindData[] {
    const results: CascFindData[] = [];
    let entry = this.findFirstFile(mask, listFile);
    if (!entry) return results;
    try {
      results.push(entry);
      while ((entry = this.findNextFile())) {
        results.push(entry);
      }
    } finally {
      this.findClose();
    }
    return results;
  }

  /**
   * Get all file names matching a mask.
   */
  getFileNames(mask: string = '*'): string[] {
    return this.findAllFiles(mask).map(f => f.fileName);
  }

  /**
   * Invoke a callback for each file matching a mask.
   * Iteration stops if the callback returns false.
   */
  forEachFile(mask: string, callback: (entry: CascFindData) => boolean | void): void {
    let entry = this.findFirstFile(mask);
    if (!entry) return;
    try {
      do {
        if (callback(entry) === false) return;
      } while ((entry = this.findNextFile()));
    } finally {
      this.findClose();
    }
  }

  /**
   * Get the total file count from the storage info.
   * Convenience wrapper over getStorageInfo(CascStorageTotalFileCount).
   */
  getTotalFileCount(): number {
    const info = this.getStorageInfo(1 /* CascStorageTotalFileCount */);
    return info.fileCount ?? 0;
  }

  /**
   * Symbol.dispose support for `using`/`await using` blocks (TS 5.2+).
   */
  [kDispose](): void {
    this.close();
  }
}

/**
 * Open a storage, run a callback, and guarantee close() — even on throw.
 * Mirrors the pattern of `using` blocks for environments without TC39 disposal.
 *
 * @example
 *   const buildId = withStorage(
 *     s => { s.openOnline('/tmp/cache*hero'); return s.readFileAsString('buildid.txt'); }
 *   );
 */
export function withStorage<T>(
  fn: (storage: Storage) => T
): T {
  const storage = new Storage();
  try {
    return fn(storage);
  } finally {
    try { storage.close(); } catch { /* already closed */ }
  }
}

/**
 * CascLib File wrapper class
 * Represents an open file in CASC storage
 */
export class File {
  private file: CascFile;

  constructor(file: CascFile) {
    this.file = file;
  }

  /**
   * Read data from the file
   * @param bytesToRead - Number of bytes to read (default: 4096)
   * @returns Buffer containing the read data
   */
  read(bytesToRead?: number): Buffer {
    return this.file.CascReadFile(bytesToRead || 4096);
  }

  /**
   * Read all data from the file
   * @returns Buffer containing all file data
   */
  readAll(): Buffer {
    return this.file.readFileAll();
  }

  /**
   * Get the file size (32-bit)
   * @returns File size in bytes
   */
  getSize(): number {
    return this.file.CascGetFileSize();
  }

  /**
   * Get the file size (64-bit)
   * @returns File size in bytes
   */
  getSize64(): number {
    return this.file.CascGetFileSize64();
  }

  /**
   * Get the current file position (32-bit)
   * @returns Current position in bytes
   */
  getPosition(): number {
    return this.file.CascGetFilePointer();
  }

  /**
   * Get the current file position (64-bit)
   * @returns Current position in bytes
   */
  getPosition64(): number {
    return this.file.CascGetFilePointer64();
  }

  /**
   * Set the file position (32-bit)
   * @param position - New position in bytes
   * @returns The new position
   */
  setPosition(position: number): number {
    return this.file.CascSetFilePointer(position);
  }

  /**
   * Set the file position (64-bit)
   * @param position - New position in bytes
   * @param moveMethod - Move method (FILE_BEGIN, FILE_CURRENT, FILE_END)
   * @returns The new position
   */
  setPosition64(position: number, moveMethod?: number): number {
    return this.file.CascSetFilePointer64(position, moveMethod);
  }

  /**
   * Get detailed file information
   * @param infoClass - The type of information to retrieve
   * @returns File information object
   */
  getFileInfo(infoClass: number): CascFileInfoResult {
    return this.file.CascGetFileInfo(infoClass);
  }

  /**
   * Set file flags
   * @param flags - Flags to set
   * @returns true if set successfully
   */
  setFileFlags(flags: number): boolean {
    return this.file.CascSetFileFlags(flags);
  }

  /**
   * Close the file
   * @returns true if closed successfully
   */
  close(): boolean {
    return this.file.CascCloseFile();
  }

  /**
   * Symbol.dispose support for `using`/`await using` blocks (TS 5.2+).
   */
  [kDispose](): void {
    this.close();
  }
}

// Re-export everything from bindings
export * from './bindings';

// High-level exports
export default {
  Storage,
  File
};

