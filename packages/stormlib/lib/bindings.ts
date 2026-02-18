// Native bindings for StormLib
import * as path from 'path';
const bindings = require('node-gyp-build')(path.join(__dirname, '..'));

/**
 * Native MPQArchive interface
 * Provides direct bindings to StormLib MPQ archive functions
 */
export interface MPQArchive {
  // Archive operations
  SFileOpenArchive(path: string, flags: number): boolean;
  SFileCreateArchive(path: string, maxFileCount: number, flags: number): boolean;
  SFileCloseArchive(): boolean;
  SFileFlushArchive(): boolean;
  SFileCompactArchive(): boolean;

  // File operations
  SFileOpenFileEx(filename: string, flags: number): MPQFile;
  SFileHasFile(filename: string): boolean;
  SFileExtractFile(source: string, destination: string): boolean;
  SFileAddFile(sourcePath: string, archiveName: string, flags?: number): boolean;
  SFileAddFileEx(sourcePath: string, archiveName: string, flags: number, compression: number, compressionNext: number): boolean;
  SFileRemoveFile(filename: string): boolean;
  SFileRenameFile(oldName: string, newName: string): boolean;

  // Archive info
  SFileGetMaxFileCount(): number;
  SFileSetMaxFileCount(maxFileCount: number): boolean;
  SFileGetAttributes(): number;
  SFileSetAttributes(attributes: number): boolean;

  // Verification
  SFileVerifyFile(filename: string, flags: number): number;
  SFileVerifyArchive(): number;
}

/**
 * Archive class constructor with static locale methods
 */
export interface MPQArchiveConstructor {
  new (): MPQArchive;
  SFileGetLocale(): number;
  SFileSetLocale(locale: number): number;
}

/**
 * Native MPQFile interface
 * Provides direct bindings to StormLib file functions
 */
export interface MPQFile {
  SFileReadFile(bytesToRead: number): Buffer;
  readFileAll(): Buffer;  // Helper function, not in StormLib.h
  SFileGetFileSize(): number;
  SFileGetFilePointer(): number;  // Helper function, uses SFileSetFilePointer
  SFileSetFilePointer(position: number): number;
  SFileCloseFile(): boolean;
}

export const MPQArchiveBinding: MPQArchiveConstructor = bindings.Archive;
export const MPQFileBinding: new () => MPQFile = bindings.File;

