import { 
  MPQArchiveBinding, 
  MPQArchive,
  MPQFile,
  FileInfo
} from './bindings';

// Re-export all constants
export * from './constants';
export { FileInfo } from './bindings';

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
  /** Compression method for first sector */
  compression?: number;
  /** Compression method for subsequent sectors */
  compressionNext?: number;
}

/**
 * StormLib Archive wrapper class
 * Provides methods to interact with MPQ archive files
 */
export class Archive {
  private archive: MPQArchive;

  constructor() {
    this.archive = new MPQArchiveBinding();
  }

  /**
   * Get the current locale setting
   * This is a static method that affects all archive operations
   */
  static getLocale(): number {
    return MPQArchiveBinding.SFileGetLocale();
  }

  /**
   * Set the locale for archive operations
   * This is a static method that affects all archive operations
   * @param locale - The locale ID to set
   * @returns The previous locale ID
   */
  static setLocale(locale: number): number {
    return MPQArchiveBinding.SFileSetLocale(locale);
  }

  /**
   * Open an MPQ archive at the specified path
   * @param path - Path to the MPQ archive file
   * @param options - Optional opening options
   */
  open(path: string, options?: ArchiveOpenOptions): void {
    this.archive.SFileOpenArchive(path, options?.flags || 0);
  }

  /**
   * Create a new MPQ archive
   * @param path - Path for the new archive
   * @param options - Optional creation options
   */
  create(path: string, options?: ArchiveCreateOptions): void {
    this.archive.SFileCreateArchive(path, options?.maxFileCount || 1000, options?.flags || 0);
  }

  /**
   * Close the MPQ archive
   */
  close(): boolean {
    return this.archive.SFileCloseArchive();
  }

  /**
   * Flush any pending changes to disk
   * @returns true if successful
   */
  flush(): boolean {
    return this.archive.SFileFlushArchive();
  }

  /**
   * Compact the archive to remove unused space
   * @returns true if successful
   */
  compact(): boolean {
    return this.archive.SFileCompactArchive();
  }

  /**
   * Open a file from the archive
   * @param filename - Name of the file to open
   * @param options - Optional opening options
   * @returns An File object
   */
  openFile(filename: string, options?: FileOpenOptions): File {
    const file = this.archive.SFileOpenFileEx(filename, options?.flags || 0);
    return new File(file);
  }

  /**
   * Check if a file exists in the archive
   * @param filename - Name of the file
   * @returns true if file exists, false otherwise
   */
  hasFile(filename: string): boolean {
    return this.archive.SFileHasFile(filename);
  }

  /**
   * Extract a file from the archive to disk
   * @param source - Source filename in archive
   * @param destination - Destination path on disk
   * @returns true if successful
   */
  extractFile(source: string, destination: string): boolean {
    return this.archive.SFileExtractFile(source, destination);
  }

  /**
   * Add a file to the archive with default compression
   * @param sourcePath - Path to the file on disk
   * @param archiveName - Name for the file in the archive
   * @param options - Optional add file options
   * @returns true if successful
   */
  addFile(sourcePath: string, archiveName: string, options?: AddFileOptions): boolean {
    if (options?.compression !== undefined || options?.compressionNext !== undefined) {
      return this.archive.SFileAddFileEx(
        sourcePath,
        archiveName,
        options.flags || 0,
        options.compression || 0,
        options.compressionNext || 0
      );
    }
    return this.archive.SFileAddFile(sourcePath, archiveName, options?.flags);
  }

  /**
   * Add a file to the archive with explicit compression settings
   * @param sourcePath - Path to the file on disk
   * @param archiveName - Name for the file in the archive
   * @param flags - File flags (compression, encryption, etc.)
   * @param compression - Compression method for first sector
   * @param compressionNext - Compression method for subsequent sectors
   * @returns true if successful
   */
  addFileEx(
    sourcePath: string,
    archiveName: string,
    flags: number,
    compression: number,
    compressionNext: number
  ): boolean {
    return this.archive.SFileAddFileEx(sourcePath, archiveName, flags, compression, compressionNext);
  }

  /**
   * Remove a file from the archive
   * @param filename - Name of the file to remove
   * @returns true if successful
   */
  removeFile(filename: string): boolean {
    return this.archive.SFileRemoveFile(filename);
  }

  /**
   * Rename a file in the archive
   * @param oldName - Current filename
   * @param newName - New filename
   * @returns true if successful
   */
  renameFile(oldName: string, newName: string): boolean {
    return this.archive.SFileRenameFile(oldName, newName);
  }

  /**
   * Get the maximum number of files the archive can contain
   * @returns Maximum file count
   */
  getMaxFileCount(): number {
    return this.archive.SFileGetMaxFileCount();
  }

  /**
   * Set the maximum number of files the archive can contain
   * @param maxFileCount - New maximum file count
   * @returns true if successful
   */
  setMaxFileCount(maxFileCount: number): boolean {
    return this.archive.SFileSetMaxFileCount(maxFileCount);
  }

  /**
   * Get the attributes flags for the archive
   * @returns Attributes flags
   */
  getAttributes(): number {
    return this.archive.SFileGetAttributes();
  }

  /**
   * Set the attributes flags for the archive
   * @param attributes - Attributes flags to set
   * @returns true if successful
   */
  setAttributes(attributes: number): boolean {
    return this.archive.SFileSetAttributes(attributes);
  }

  /**
   * Verify a file in the archive
   * @param filename - Name of the file to verify
   * @param flags - Verification flags (SFILE_VERIFY_*)
   * @returns Verification result flags
   */
  verifyFile(filename: string, flags: number): number {
    return this.archive.SFileVerifyFile(filename, flags);
  }

  /**
   * Verify the archive signature
   * @returns Verification result code (ERROR_NO_SIGNATURE, ERROR_WEAK_SIGNATURE_OK, etc.)
   */
  verifyArchive(): number {
    return this.archive.SFileVerifyArchive();
  }

  /**
   * Sign the archive with a digital signature
   * @param signatureType - Type of signature to apply
   * @returns true if successful
   */
  signArchive(signatureType: number = 0): boolean {
    return this.archive.SFileSignArchive(signatureType);
  }

  /**
   * Get checksums (CRC32 and MD5) for a file
   * @param filename - Name of the file
   * @returns Object containing crc32 and md5
   */
  getFileChecksums(filename: string): { crc32: number; md5: string } {
    return this.archive.SFileGetFileChecksums(filename);
  }

  /**
   * Add a listfile to the archive
   * @param listfilePath - Path to the listfile
   * @returns Number of entries added
   */
  addListFile(listfilePath: string): number {
    return this.archive.SFileAddListFile(listfilePath);
  }

  /**
   * Open a patch archive
   * @param patchPath - Path to the patch archive
   * @param patchPrefix - Optional patch path prefix
   * @param flags - Optional flags
   * @returns true if successful
   */
  openPatchArchive(patchPath: string, patchPrefix?: string, flags: number = 0): boolean {
    return this.archive.SFileOpenPatchArchive(patchPath, patchPrefix || null, flags);
  }

  /**
   * Check if the archive has patches applied
   * @returns true if patched
   */
  isPatchedArchive(): boolean {
    return this.archive.SFileIsPatchedArchive();
  }

  /**
   * Find all files matching a mask
   * @param mask - File mask (wildcards supported), default is "*"
   * @returns Array of file information or null if no files found
   */
  findFiles(mask: string = "*"): FileInfo[] | null {
    return this.archive.SFileFindFirstFile(mask);
  }

  /**
   * List all files in the archive
   * @returns Array of file information
   */
  listFiles(): FileInfo[] {
    return this.findFiles("*") || [];
  }

  /**
   * Enumerate available locales for a file
   * @param filename - Name of the file
   * @param searchScope - Search scope (default: 0)
   * @returns Array of locale IDs
   */
  enumLocales(filename: string, searchScope: number = 0): number[] {
    return this.archive.SFileEnumLocales(filename, searchScope);
  }

  /**
   * Create a new file in the archive for writing
   * @param filename - Name of the file to create
   * @param fileTime - File timestamp
   * @param fileSize - Size of the file
   * @param locale - Locale ID (default: 0)
   * @param flags - File flags (default: compressed and encrypted)
   * @returns File object for writing
   */
  createFile(filename: string, fileTime: number, fileSize: number, locale: number = 0, flags?: number): File {
    const file = this.archive.SFileCreateFile(filename, fileTime, fileSize, locale, flags || 0);
    return new File(file);
  }

  /**
   * Add a wave file to the archive with compression
   * @param sourcePath - Path to the wave file on disk
   * @param archiveName - Name for the file in the archive
   * @param flags - File flags (default: compressed and encrypted)
   * @param quality - Compression quality (default: 1)
   * @returns true if successful
   */
  addWave(sourcePath: string, archiveName: string, flags?: number, quality: number = 1): boolean {
    return this.archive.SFileAddWave(sourcePath, archiveName, flags || 0, quality);
  }

  /**
   * Update attributes for a specific file
   * @param filename - Name of the file
   * @returns true if successful
   */
  updateFileAttributes(filename: string): boolean {
    return this.archive.SFileUpdateFileAttributes(filename);
  }

  /**
   * Get archive/file information
   * @param infoClass - Information class to retrieve
   * @returns Buffer containing the info data or null
   */
  getFileInfo(infoClass: number): Buffer | null {
    return this.archive.SFileGetFileInfo(infoClass);
  }

  /**
   * Read a file from archive as a string
   * @param filename - Name of the file to read
   * @param encoding - Text encoding (default: 'utf-8')
   * @returns The file content as string
   */
  readFileAsString(filename: string, encoding: BufferEncoding = 'utf-8'): string {
    const file = this.openFile(filename);
    try {
      const buffer = file.readAll();
      return buffer.toString(encoding);
    } finally {
      file.close();
    }
  }

  /**
   * Read a file from archive and parse as JSON
   * @param filename - Name of the JSON file
   * @returns Parsed JSON object
   */
  readFileAsJson<T = any>(filename: string): T {
    const content = this.readFileAsString(filename, 'utf-8');
    return JSON.parse(content) as T;
  }

  /**
   * Extract all files from the archive to a directory
   * @param outputDir - Output directory path
   * @param mask - File mask to filter (default: "*")
   * @returns Number of files extracted
   */
  extractAllFiles(outputDir: string, mask: string = "*"): number {
    const files = this.findFiles(mask);
    if (!files) return 0;

    let extracted = 0;
    for (const fileInfo of files) {
      try {
        const outputPath = require('path').join(outputDir, fileInfo.plainName);
        this.extractFile(fileInfo.name, outputPath);
        extracted++;
      } catch (e) {
        // Skip files that can't be extracted
      }
    }
    return extracted;
  }

  /**
   * Get all file names in the archive
   * @param mask - File mask to filter (default: "*")
   * @returns Array of file names
   */
  getFileNames(mask: string = "*"): string[] {
    const files = this.findFiles(mask);
    return files ? files.map(f => f.name) : [];
  }

  /**
   * Check if a file exists and can be opened
   * @param filename - Name of the file
   * @returns true if file exists and is accessible
   */
  canOpenFile(filename: string): boolean {
    try {
      return this.hasFile(filename);
    } catch {
      return false;
    }
  }

  /**
   * Get the total size of all files in the archive
   * @returns Total size in bytes
   */
  getTotalSize(): number {
    const files = this.findFiles("*");
    if (!files) return 0;
    return files.reduce((total, file) => total + file.fileSize, 0);
  }

  /**
   * Get the total compressed size of all files
   * @returns Total compressed size in bytes
   */
  getTotalCompressedSize(): number {
    const files = this.findFiles("*");
    if (!files) return 0;
    return files.reduce((total, file) => total + file.compSize, 0);
  }

  /**
   * Get compression ratio for the archive
   * @returns Compression ratio (0.0 to 1.0, where 0.5 means 50% compressed)
   */
  getCompressionRatio(): number {
    const totalSize = this.getTotalSize();
    if (totalSize === 0) return 0;
    const compressedSize = this.getTotalCompressedSize();
    return compressedSize / totalSize;
  }
}

/**
 * StormLib File wrapper class
 * Represents an open file in an MPQ archive
 */
export class File {
  private file: MPQFile;

  constructor(file: MPQFile) {
    this.file = file;
  }

  /**
   * Read data from the file
   * @param bytesToRead - Number of bytes to read (default: 4096)
   * @returns Buffer containing the read data
   */
  read(bytesToRead?: number): Buffer {
    return this.file.SFileReadFile(bytesToRead || 4096);
  }

  /**
   * Read all data from the file
   * @returns Buffer containing all file data
   */
  readAll(): Buffer {
    return this.file.readFileAll();
  }

  /**
   * Get the file size
   * @returns File size in bytes
   */
  getSize(): number {
    return this.file.SFileGetFileSize();
  }

  /**
   * Get the current file position
   * @returns Current position in bytes
   */
  getPosition(): number {
    return this.file.SFileGetFilePointer();
  }

  /**
   * Set the file position
   * @param position - New position in bytes
   * @returns The new position
   */
  setPosition(position: number): number {
    return this.file.SFileSetFilePointer(position);
  }

  /**
   * Close the file
   * @returns true if closed successfully
   */
  close(): boolean {
    return this.file.SFileCloseFile();
  }

  /**
   * Write data to the file
   * @param data - Buffer containing data to write
   * @param compression - Compression method (default: ZLIB)
   * @returns true if successful
   */
  write(data: Buffer, compression?: number): boolean {
    return this.file.SFileWriteFile(data, compression || 0x02); // MPQ_COMPRESSION_ZLIB
  }

  /**
   * Finish writing to the file and close it
   * @returns true if successful
   */
  finish(): boolean {
    return this.file.SFileFinishFile();
  }

  /**
   * Get the filename
   * @returns The filename
   */
  getFileName(): string {
    return this.file.SFileGetFileName();
  }

  /**
   * Set the locale for the file
   * @param locale - Locale ID to set
   * @returns true if successful
   */
  setLocale(locale: number): boolean {
    return this.file.SFileSetFileLocale(locale);
  }

  /**
   * Get file information
   * @param infoClass - Information class to retrieve
   * @returns Buffer containing the info data or null
   */
  getFileInfo(infoClass: number): Buffer | null {
    return this.file.SFileGetFileInfo(infoClass);
  }
}

// Export low-level bindings for advanced usage
export * from './bindings';

// Default export
export default {
  Archive,
  File
};


