// Native bindings for CascLib
import * as path from 'path';
const bindings = require('node-gyp-build')(path.join(__dirname, '..'));

export interface Storage {
  open(path: string, flags: number): boolean;
  close(): boolean;
  openFile(filename: string, flags: number): File;
  getFileInfo(filename: string): { name: string; size: number } | null;
  fileExists(filename: string): boolean;
}

export interface File {
  read(bytesToRead: number): Buffer;
  readAll(): Buffer;
  getSize(): number;
  getPosition(): number;
  setPosition(position: number): number;
  close(): boolean;
}

export const Storage: new () => Storage = bindings.Storage;
export const File: new () => File = bindings.File;
