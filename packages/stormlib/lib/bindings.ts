// Native bindings for StormLib
import * as path from 'path';
const bindings = require('node-gyp-build')(path.join(__dirname, '..'));

export interface Archive {
  open(path: string, flags: number): boolean;
  create(path: string, maxFileCount: number, flags: number): boolean;
  close(): boolean;
  openFile(filename: string, flags: number): File;
  hasFile(filename: string): boolean;
  extractFile(source: string, destination: string): boolean;
  addFile(sourcePath: string, archiveName: string, flags?: number): boolean;
  removeFile(filename: string): boolean;
  renameFile(oldName: string, newName: string): boolean;
  compact(): boolean;
  getMaxFileCount(): number;
}

export interface File {
  read(bytesToRead: number): Buffer;
  readAll(): Buffer;
  getSize(): number;
  getPosition(): number;
  setPosition(position: number): number;
  close(): boolean;
}

export const Archive: new () => Archive = bindings.Archive;
export const File: new () => File = bindings.File;
