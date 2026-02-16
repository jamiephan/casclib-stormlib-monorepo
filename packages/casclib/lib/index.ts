import { Storage, File } from './bindings';

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
    this.storage.open(path, options?.flags || 0);
  }

  /**
   * Close the CASC storage
   */
  close(): boolean {
    return this.storage.close();
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
    return this.file.read(bytesToRead || 4096);
  }

  /**
   * Read all data from the file
   * @returns Buffer containing all file data
   */
  readAll(): Buffer {
    return this.file.readAll();
  }

  /**
   * Get the file size
   * @returns File size in bytes
   */
  getSize(): number {
    return this.file.getSize();
  }

  /**
   * Get the current file position
   * @returns Current position in bytes
   */
  getPosition(): number {
    return this.file.getPosition();
  }

  /**
   * Set the file position
   * @param position - New position in bytes
   * @returns The new position
   */
  setPosition(position: number): number {
    return this.file.setPosition(position);
  }

  /**
   * Close the file
   * @returns true if closed successfully
   */
  close(): boolean {
    return this.file.close();
  }
}

export { Storage, File };
export default {
  CascStorage,
  CascFile,
  Storage,
  File
};
