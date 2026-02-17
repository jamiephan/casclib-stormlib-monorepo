import { Storage, File, FindData, StorageInfo, FileInfoResult, CascNameType, OpenStorageExOptions } from './bindings';

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
export class CascStorage {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
  }

  /**
   * Open a CASC storage at the specified path
   * @param path - Path to the CASC storage directory
   * @param options - Optional opening options
   */
  open(path: string, options?: StorageOpenOptions): void {
    this.storage.openStorage(path, options?.flags || 0);
  }

  /**
   * Open an online CASC storage
   * @param path - Connection string in the format: `local_cache_folder[*cdn_server_url]*code_name[*region]`
   *   - `local_cache_folder`: Local cache directory for downloaded game data (reusable)
   *     - Windows: `C:/Temp/CASC/Cache`
   *     - Linux/macOS: `/tmp/casc/cache`
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
   * // Linux/macOS - Basic usage
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
    this.storage.openStorageOnline(path, options?.flags || 0);
  }

  /**
   * Open a CASC storage with extended parameters (CascOpenStorageEx)
   * @param params - Path or parameter string
   * @param options - Extended opening options
   */
  openEx(params: string, options?: OpenStorageExOptions): void {
    this.storage.openStorageEx(params, options);
  }

  /**
   * Close the CASC storage
   */
  close(): boolean {
    return this.storage.closeStorage();
  }

  /**
   * Open a file from the storage
   * @param filename - Name of the file to open
   * @param options - Optional opening options
   * @returns A CascFile object
   */
  openFile(filename: string, options?: FileOpenOptions): CascFile {
    const file = this.storage.openFile(filename, options?.flags || 0);
    return new CascFile(file);
  }

  /**
   * Get information about a file
   * @param filename - Name of the file
   * @returns File information or null if file doesn't exist
   */
  getFileInfo(filename: string): FileInfo | null {
    return this.storage.getFileInfo(filename);
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
  getStorageInfo(infoClass: number): StorageInfo {
    return this.storage.getStorageInfo(infoClass);
  }

  /**
   * Find the first file matching the mask
   * @param mask - File mask (e.g., "*.txt")
   * @param listFile - Optional list file path
   * @returns Find data or null if no files found
   */
  findFirstFile(mask?: string, listFile?: string): FindData | null {
    return this.storage.findFirstFile(mask, listFile);
  }

  /**
   * Find the next file in the search
   * @returns Find data or null if no more files
   */
  findNextFile(): FindData | null {
    return this.storage.findNextFile();
  }

  /**
   * Close the current find operation
   * @returns true if closed successfully
   */
  findClose(): boolean {
    return this.storage.findClose();
  }

  /**
   * Add an encryption key to the storage
   * @param keyName - Name/ID of the key
   * @param key - Key data as Buffer
   * @returns true if added successfully
   */
  addEncryptionKey(keyName: number, key: Buffer): boolean {
    return this.storage.addEncryptionKey(keyName, key);
  }

  /**
   * Add an encryption key from a string
   * @param keyName - Name/ID of the key
   * @param keyStr - Key as string
   * @returns true if added successfully
   */
  addStringEncryptionKey(keyName: number, keyStr: string): boolean {
    return this.storage.addStringEncryptionKey(keyName, keyStr);
  }

  /**
   * Import encryption keys from a string
   * @param keyList - String containing key list
   * @returns true if imported successfully
   */
  importKeysFromString(keyList: string): boolean {
    return this.storage.importKeysFromString(keyList);
  }

  /**
   * Import encryption keys from a file
   * @param filePath - Path to the key file
   * @returns true if imported successfully
   */
  importKeysFromFile(filePath: string): boolean {
    return this.storage.importKeysFromFile(filePath);
  }

  /**
   * Find an encryption key by name
   * @param keyName - Name/ID of the key
   * @returns Key data or null if not found
   */
  findEncryptionKey(keyName: number): Buffer | null {
    return this.storage.findEncryptionKey(keyName);
  }

  /**
   * Get the name of an encryption key that was not found
   * @returns Key name or null
   */
  getNotFoundEncryptionKey(): number | null {
    return this.storage.getNotFoundEncryptionKey();
  }
}

/**
 * CascLib File wrapper class
 * Represents an open file in CASC storage
 */
export class CascFile {
  private file: File;

  constructor(file: File) {
    this.file = file;
  }

  /**
   * Read data from the file
   * @param bytesToRead - Number of bytes to read (default: 4096)
   * @returns Buffer containing the read data
   */
  read(bytesToRead?: number): Buffer {
    return this.file.readFile(bytesToRead || 4096);
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
    return this.file.getFileSize();
  }

  /**
   * Get the file size (64-bit)
   * @returns File size in bytes
   */
  getSize64(): number {
    return this.file.getFileSize64();
  }

  /**
   * Get the current file position (32-bit)
   * @returns Current position in bytes
   */
  getPosition(): number {
    return this.file.getFilePointer();
  }

  /**
   * Get the current file position (64-bit)
   * @returns Current position in bytes
   */
  getPosition64(): number {
    return this.file.getFilePointer64();
  }

  /**
   * Set the file position (32-bit)
   * @param position - New position in bytes
   * @returns The new position
   */
  setPosition(position: number): number {
    return this.file.setFilePointer(position);
  }

  /**
   * Set the file position (64-bit)
   * @param position - New position in bytes
   * @param moveMethod - Move method (FILE_BEGIN, FILE_CURRENT, FILE_END)
   * @returns The new position
   */
  setPosition64(position: number, moveMethod?: number): number {
    return this.file.setFilePointer64(position, moveMethod);
  }

  /**
   * Get detailed file information
   * @param infoClass - The type of information to retrieve
   * @returns File information object
   */
  getFileInfo(infoClass: number): FileInfoResult {
    return this.file.getFileInfo(infoClass);
  }

  /**
   * Set file flags
   * @param flags - Flags to set
   * @returns true if set successfully
   */
  setFileFlags(flags: number): boolean {
    return this.file.setFileFlags(flags);
  }

  /**
   * Close the file
   * @returns true if closed successfully
   */
  close(): boolean {
    return this.file.closeFile();
  }
}

// Re-export everything from bindings
export * from './bindings';

export { Storage, File, CascNameType };
export default {
  CascStorage,
  CascFile
};

