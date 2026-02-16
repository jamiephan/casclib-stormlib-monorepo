// Native bindings for CascLib
import * as path from 'path';
const bindings = require('node-gyp-build')(path.join(__dirname, '..'));

// Storage info classes
export enum StorageInfoClass {
  LocalFileCount = 0,
  TotalFileCount = 1,
  Features = 2,
  InstalledLocales = 3,
  Product = 4,
  Tags = 5,
  PathProduct = 6
}

// File info classes
export enum FileInfoClass {
  ContentKey = 0,
  EncodedKey = 1,
  FullInfo = 2,
  SpanInfo = 3
}

// Find data structure
export interface FindData {
  fileName: string;
  fileSize: number;
  fileDataId: number;
  localeFlags: number;
  contentFlags: number;
  available: boolean;
}

// Storage product info
export interface StorageProduct {
  codeName: string;
  buildNumber: number;
}

// Storage info result
export interface StorageInfo {
  fileCount?: number;
  features?: number;
  codeName?: string;
  buildNumber?: number;
}

// File full info
export interface FileFullInfo {
  ckey: Buffer;
  ekey: Buffer;
  dataFileName: string;
  storageOffset: number;
  segmentOffset: number;
  tagBitMask: number;
  fileNameHash: number;
  contentSize: number;
  encodedSize: number;
  segmentIndex: number;
  spanCount: number;
  fileDataId: number;
  localeFlags: number;
  contentFlags: number;
}

// File info result
export interface FileInfoResult {
  ckey?: Buffer;
  ekey?: Buffer;
  dataFileName?: string;
  storageOffset?: number;
  segmentOffset?: number;
  tagBitMask?: number;
  fileNameHash?: number;
  contentSize?: number;
  encodedSize?: number;
  segmentIndex?: number;
  spanCount?: number;
  fileDataId?: number;
  localeFlags?: number;
  contentFlags?: number;
}

export interface Storage {
  // Basic operations
  open(path: string, flags: number): boolean;
  openOnline(path: string, flags: number): boolean;
  close(): boolean;
  
  // File operations
  openFile(filename: string, flags: number): File;
  getFileInfo(filename: string): { name: string; size: number } | null;
  fileExists(filename: string): boolean;
  
  // Storage info
  getStorageInfo(infoClass: number): StorageInfo;
  
  // Find operations
  findFirstFile(mask?: string, listFile?: string): FindData | null;
  findNextFile(): FindData | null;
  findClose(): boolean;
  
  // Encryption key operations
  addEncryptionKey(keyName: number, key: Buffer): boolean;
  addStringEncryptionKey(keyName: number, keyStr: string): boolean;
  importKeysFromString(keyList: string): boolean;
  importKeysFromFile(filePath: string): boolean;
  findEncryptionKey(keyName: number): Buffer | null;
  getNotFoundEncryptionKey(): number | null;
}

export interface File {
  // Basic read operations
  read(bytesToRead: number): Buffer;
  readAll(): Buffer;
  
  // Size operations
  getSize(): number;
  getSize64(): number;
  
  // Position operations
  getPosition(): number;
  getPosition64(): number;
  setPosition(position: number): number;
  setPosition64(position: number, moveMethod?: number): number;
  
  // File info and flags
  getFileInfo(infoClass: number): FileInfoResult;
  setFileFlags(flags: number): boolean;
  
  // Close
  close(): boolean;
}

export const Storage: new () => Storage = bindings.Storage;
export const File: new () => File = bindings.File;

// Utility functions
export const openLocalFile: (filename: string, flags?: number) => File = bindings.openLocalFile;
export const getError: () => number = bindings.getError;
export const setError: (error: number) => void = bindings.setError;

// Open flags
export const CASC_OPEN_BY_NAME: number = bindings.CASC_OPEN_BY_NAME;
export const CASC_OPEN_BY_CKEY: number = bindings.CASC_OPEN_BY_CKEY;
export const CASC_OPEN_BY_EKEY: number = bindings.CASC_OPEN_BY_EKEY;
export const CASC_OPEN_BY_FILEID: number = bindings.CASC_OPEN_BY_FILEID;
export const CASC_STRICT_DATA_CHECK: number = bindings.CASC_STRICT_DATA_CHECK;
export const CASC_OVERCOME_ENCRYPTED: number = bindings.CASC_OVERCOME_ENCRYPTED;

// Locale flags
export const CASC_LOCALE_ALL: number = bindings.CASC_LOCALE_ALL;
export const CASC_LOCALE_NONE: number = bindings.CASC_LOCALE_NONE;
export const CASC_LOCALE_ENUS: number = bindings.CASC_LOCALE_ENUS;
export const CASC_LOCALE_KOKR: number = bindings.CASC_LOCALE_KOKR;
export const CASC_LOCALE_FRFR: number = bindings.CASC_LOCALE_FRFR;
export const CASC_LOCALE_DEDE: number = bindings.CASC_LOCALE_DEDE;
export const CASC_LOCALE_ZHCN: number = bindings.CASC_LOCALE_ZHCN;
export const CASC_LOCALE_ESES: number = bindings.CASC_LOCALE_ESES;
export const CASC_LOCALE_ZHTW: number = bindings.CASC_LOCALE_ZHTW;
export const CASC_LOCALE_ENGB: number = bindings.CASC_LOCALE_ENGB;

// Content flags
export const CASC_CFLAG_INSTALL: number = bindings.CASC_CFLAG_INSTALL;
export const CASC_CFLAG_LOAD_ON_WINDOWS: number = bindings.CASC_CFLAG_LOAD_ON_WINDOWS;
export const CASC_CFLAG_LOAD_ON_MAC: number = bindings.CASC_CFLAG_LOAD_ON_MAC;
export const CASC_CFLAG_X86_32: number = bindings.CASC_CFLAG_X86_32;
export const CASC_CFLAG_X86_64: number = bindings.CASC_CFLAG_X86_64;
export const CASC_CFLAG_ENCRYPTED: number = bindings.CASC_CFLAG_ENCRYPTED;

// Storage info constants
export const CascStorageLocalFileCount: number = bindings.CascStorageLocalFileCount;
export const CascStorageTotalFileCount: number = bindings.CascStorageTotalFileCount;
export const CascStorageFeatures: number = bindings.CascStorageFeatures;
export const CascStorageProduct: number = bindings.CascStorageProduct;

// File info constants
export const CascFileContentKey: number = bindings.CascFileContentKey;
export const CascFileEncodedKey: number = bindings.CascFileEncodedKey;
export const CascFileFullInfo: number = bindings.CascFileFullInfo;

// Feature flags
export const CASC_FEATURE_FILE_NAMES: number = bindings.CASC_FEATURE_FILE_NAMES;
export const CASC_FEATURE_ROOT_CKEY: number = bindings.CASC_FEATURE_ROOT_CKEY;
export const CASC_FEATURE_TAGS: number = bindings.CASC_FEATURE_TAGS;
export const CASC_FEATURE_FILE_DATA_IDS: number = bindings.CASC_FEATURE_FILE_DATA_IDS;
export const CASC_FEATURE_LOCALE_FLAGS: number = bindings.CASC_FEATURE_LOCALE_FLAGS;
export const CASC_FEATURE_CONTENT_FLAGS: number = bindings.CASC_FEATURE_CONTENT_FLAGS;
export const CASC_FEATURE_ONLINE: number = bindings.CASC_FEATURE_ONLINE;

