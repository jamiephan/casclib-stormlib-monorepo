import { Archive, File } from './bindings';

/**
 * Options for opening an MPQ archive
 */
export interface ArchiveOpenOptions {
  /** Flags for opening the archive */
  flags?: number;
}

/**
 * Options for creating an MPQ archive
 */
export interface ArchiveCreateOptions {
  /** Maximum number of files the archive can contain */
  maxFileCount?: number;
  /** Creation flags */
  flags?: number;
}

/**
 * Options for opening a file from archive
 */
export interface FileOpenOptions {
  /** Open flags */
  flags?: number;
}

/**
 * Options for adding a file to archive
 */
export interface AddFileOptions {
  /** File flags (compression, encryption, etc.) */
  flags?: number;
}

/**
 * StormLib Archive wrapper class
 * Provides methods to interact with MPQ archive files
 */
export class MpqArchive {
  private archive: Archive;

  constructor() {
    this.archive = new Archive();
  }

  /**
   * Open an MPQ archive at the specified path
   * @param path - Path to the MPQ archive file
   * @param options - Optional opening options
   */
  open(path: string, options?: ArchiveOpenOptions): void {
    this.archive.open(path, options?.flags || 0);
  }

  /**
   * Create a new MPQ archive
   * @param path - Path for the new archive
   * @param options - Optional creation options
   */
  create(path: string, options?: ArchiveCreateOptions): void {
    this.archive.create(path, options?.maxFileCount || 1000, options?.flags || 0);
  }

  /**
   * Close the MPQ archive
   */
  close(): boolean {
    return this.archive.close();
  }

  /**
   * Open a file from the archive
   * @param filename - Name of the file to open
   * @param options - Optional opening options
   * @returns An MpqFile object
   */
  openFile(filename: string, options?: FileOpenOptions): MpqFile {
    const file = this.archive.openFile(filename, options?.flags || 0);
    return new MpqFile(file);
  }

  /**
   * Check if a file exists in the archive
   * @param filename - Name of the file
   * @returns true if file exists, false otherwise
   */
  hasFile(filename: string): boolean {
    return this.archive.hasFile(filename);
  }

  /**
   * Extract a file from the archive to disk
   * @param source - Source filename in archive
   * @param destination - Destination path on disk
   */
  extractFile(source: string, destination: string): boolean {
    return this.archive.extractFile(source, destination);
  }

  /**
   * Add a file to the archive
   * @param sourcePath - Path to the file on disk
   * @param archiveName - Name for the file in the archive
   * @param options - Optional add file options
   */
  addFile(sourcePath: string, archiveName: string, options?: AddFileOptions): boolean {
    return this.archive.addFile(sourcePath, archiveName, options?.flags);
  }

  /**
   * Remove a file from the archive
   * @param filename - Name of the file to remove
   */
  removeFile(filename: string): boolean {
    return this.archive.removeFile(filename);
  }

  /**
   * Rename a file in the archive
   * @param oldName - Current filename
   * @param newName - New filename
   */
  renameFile(oldName: string, newName: string): boolean {
    return this.archive.renameFile(oldName, newName);
  }

  /**
   * Compact the archive to remove unused space
   */
  compact(): boolean {
    return this.archive.compact();
  }

  /**
   * Get the maximum number of files the archive can contain
   * @returns Maximum file count
   */
  getMaxFileCount(): number {
    return this.archive.getMaxFileCount();
  }
}

/**
 * StormLib File wrapper class
 * Represents an open file in an MPQ archive
 */
export class MpqFile {
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

export { Archive, File };
export default {
  MpqArchive,
  MpqFile,
  Archive,
  File
};
