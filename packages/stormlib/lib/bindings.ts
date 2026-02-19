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
  SFileAddWave(sourcePath: string, archiveName: string, flags: number, quality: number): boolean;

  // Archive info
  SFileGetMaxFileCount(): number;
  SFileSetMaxFileCount(maxFileCount: number): boolean;
  SFileGetAttributes(): number;
  SFileSetAttributes(attributes: number): boolean;
  SFileUpdateFileAttributes(filename: string): boolean;
  SFileGetFileInfo(infoClass: number): Buffer | null;

  // Verification
  SFileVerifyFile(filename: string, flags: number): number;
  SFileVerifyArchive(): number;
  SFileSignArchive(signatureType: number): boolean;
  SFileGetFileChecksums(filename: string): { crc32: number; md5: string };

  // Listfile operations
  SFileAddListFile(listfilePath: string): number;

  // Patch archive operations
  SFileOpenPatchArchive(patchPath: string, patchPrefix: string | null, flags: number): boolean;
  SFileIsPatchedArchive(): boolean;

  // File finding operations
  SFileFindFirstFile(mask: string): FileInfo[] | null;
  SFileEnumLocales(filename: string, searchScope: number): number[];

  // Advanced file creation
  SFileCreateFile(filename: string, fileTime: number, fileSize: number, locale: number, flags: number): MPQFile;
}

/**
 * File information structure returned from SFileFindFirstFile
 */
export interface FileInfo {
  name: string;
  plainName: string;
  hashIndex: number;
  blockIndex: number;
  fileSize: number;
  fileFlags: number;
  compSize: number;
  fileTimeLo: number;
  fileTimeHi: number;
  locale: number;
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
  SFileWriteFile(data: Buffer, compression: number): boolean;
  SFileFinishFile(): boolean;
  SFileGetFileSize(): number;
  SFileGetFilePointer(): number;  // Helper function, uses SFileSetFilePointer
  SFileSetFilePointer(position: number): number;
  SFileGetFileName(): string;
  SFileSetFileLocale(locale: number): boolean;
  SFileGetFileInfo(infoClass: number): Buffer | null;
  SFileCloseFile(): boolean;
}

export const MPQArchiveBinding: MPQArchiveConstructor = bindings.Archive;
export const MPQFileBinding: new () => MPQFile = bindings.File;

