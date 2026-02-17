// Native bindings for StormLib
import * as path from 'path';
const bindings = require('node-gyp-build')(path.join(__dirname, '..'));

/**
 * Native Archive interface
 * Provides direct bindings to StormLib MPQ archive functions
 */
export interface Archive {
  // Archive operations
  openArchive(path: string, flags: number): boolean;
  createArchive(path: string, maxFileCount: number, flags: number): boolean;
  closeArchive(): boolean;
  flushArchive(): boolean;
  compactArchive(): boolean;

  // File operations
  openFileEx(filename: string, flags: number): File;
  hasFile(filename: string): boolean;
  extractFile(source: string, destination: string): boolean;
  addFile(sourcePath: string, archiveName: string, flags?: number): boolean;
  addFileEx(sourcePath: string, archiveName: string, flags: number, compression: number, compressionNext: number): boolean;
  removeFile(filename: string): boolean;
  renameFile(oldName: string, newName: string): boolean;

  // Archive info
  getMaxFileCount(): number;
  setMaxFileCount(maxFileCount: number): boolean;
  getAttributes(): number;
  setAttributes(attributes: number): boolean;

  // Verification
  verifyFile(filename: string, flags: number): number;
  verifyArchive(): number;
}

/**
 * Archive class constructor with static locale methods
 */
export interface ArchiveConstructor {
  new (): Archive;
  getLocale(): number;
  setLocale(locale: number): number;
}

/**
 * Native File interface
 * Provides direct bindings to StormLib file functions
 */
export interface File {
  readFile(bytesToRead: number): Buffer;
  readFileAll(): Buffer;
  getFileSize(): number;
  getFilePointer(): number;
  setFilePointer(position: number): number;
  closeFile(): boolean;
}

export const Archive: ArchiveConstructor = bindings.Archive;
export const File: new () => File = bindings.File;

