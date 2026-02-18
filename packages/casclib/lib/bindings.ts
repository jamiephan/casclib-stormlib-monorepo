// Native bindings for CascLib
import * as path from 'path';
const bindings = require('node-gyp-build')(path.join(__dirname, '..'));

// Storage info classes
export enum CascStorageInfoClass {
  LocalFileCount = 0,
  TotalFileCount = 1,
  Features = 2,
  InstalledLocales = 3,
  Product = 4,
  Tags = 5,
  PathProduct = 6
}

// File info classes
export enum CascFileInfoClass {
  ContentKey = 0,
  EncodedKey = 1,
  FullInfo = 2,
  SpanInfo = 3
}

// Name type enum
export enum CascNameType {
  Full = 0,
  DataId = 1,
  CKey = 2,
  EKey = 3
}

// Find data structure
export interface CascFindData {
  fileName: string;
  ckey: Buffer;
  ekey: Buffer;
  tagBitMask: number;
  fileSize: number;
  plainName: string | null;
  fileDataId: number;
  localeFlags: number;
  contentFlags: number;
  spanCount: number;
  available: boolean;
  nameType: CascNameType;
}

// Storage product info
export interface CascStorageProduct {
  codeName: string;
  buildNumber: number;
}

// Storage info result
export interface CascStorageInfo {
  fileCount?: number;
  features?: number;
  codeName?: string;
  buildNumber?: number;
}

// File full info
export interface CascFileFullInfo {
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

// File span info
export interface CascFileSpanInfo {
  ckey: Buffer;
  ekey: Buffer;
  startOffset: number;
  endOffset: number;
  archiveIndex: number;
  archiveOffs: number;
  headerSize: number;
  frameCount: number;
}

// File info result
export interface CascFileInfoResult {
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

export interface CascOpenStorageExOptions {
  localPath?: string;
  codeName?: string;
  region?: string;
  localeMask?: number;
  flags?: number;
  buildKey?: string;
  cdnHostUrl?: string;
  online?: boolean;
}

export interface CascStorage {
  // Basic operations
  CascOpenStorage(path: string, flags: number): boolean;
  CascOpenOnlineStorage(path: string, flags: number): boolean;
  CascOpenStorageEx(params: string, options?: CascOpenStorageExOptions): boolean;
  CascCloseStorage(): boolean;
  
  // File operations
  CascOpenFile(filename: string, flags: number): CascFile;
  CascGetFileInfo(filename: string): { name: string; size: number } | null;
  fileExists(filename: string): boolean;  // Helper function, not in CascLib.h
  
  // Storage info
  CascGetStorageInfo(infoClass: number): CascStorageInfo;
  
  // Find operations
  CascFindFirstFile(mask?: string, listFile?: string): CascFindData | null;
  CascFindNextFile(): CascFindData | null;
  CascFindClose(): boolean;
  
  // Encryption key operations
  CascAddEncryptionKey(keyName: number, key: Buffer): boolean;
  CascAddStringEncryptionKey(keyName: number, keyStr: string): boolean;
  CascImportKeysFromString(keyList: string): boolean;
  CascImportKeysFromFile(filePath: string): boolean;
  CascFindEncryptionKey(keyName: number): Buffer | null;
  CascGetNotFoundEncryptionKey(): number | null;
}

export interface CascFile {
  // Basic read operations
  CascReadFile(bytesToRead: number): Buffer;
  readFileAll(): Buffer;  // Helper function, not in CascLib.h
  
  // Size operations
  CascGetFileSize(): number;
  CascGetFileSize64(): number;
  
  // Position operations
  CascGetFilePointer(): number;  // Helper function, uses CascSetFilePointer
  CascGetFilePointer64(): number;  // Helper function, uses CascSetFilePointer64
  CascSetFilePointer(position: number): number;
  CascSetFilePointer64(position: number, moveMethod?: number): number;
  
  // File info and flags
  CascGetFileInfo(infoClass: number): CascFileInfoResult;
  CascSetFileFlags(flags: number): boolean;
  
  // Close
  CascCloseFile(): boolean;
}

export const CascStorageBinding: new () => CascStorage = bindings.Storage;
export const CascFileBinding: new () => CascFile = bindings.File;

// Utility functions
export const CascOpenLocalFile: (filename: string, flags?: number) => CascFile = bindings.CascOpenLocalFile;
export const GetCascError: () => number = bindings.GetCascError;
export const SetCascError: (error: number) => void = bindings.SetCascError;

// CDN functions
export const CascCdnGetDefault: () => string | null = bindings.CascCdnGetDefault;
export const CascCdnDownload: (cdnHostUrl: string, product: string, fileName: string) => Buffer | null = bindings.CascCdnDownload;

// Version constants
export const CASCLIB_VERSION: number = bindings.CASCLIB_VERSION || 0x0300;
export const CASCLIB_VERSION_STRING: string = "3.0";

// File positioning constants
export const FILE_BEGIN: number = bindings.FILE_BEGIN;
export const FILE_CURRENT: number = bindings.FILE_CURRENT;
export const FILE_END: number = bindings.FILE_END;

// Other useful constants
export const CASC_FILEID_FORMAT: string = bindings.CASC_FILEID_FORMAT;
export const CASC_PARAM_SEPARATOR: string = bindings.CASC_PARAM_SEPARATOR;

// Progress message constants
export const CascProgressLoadingFile: number = bindings.CascProgressLoadingFile;
export const CascProgressLoadingManifest: number = bindings.CascProgressLoadingManifest;
export const CascProgressDownloadingFile: number = bindings.CascProgressDownloadingFile;
export const CascProgressLoadingIndexes: number = bindings.CascProgressLoadingIndexes;
export const CascProgressDownloadingArchiveIndexes: number = bindings.CascProgressDownloadingArchiveIndexes;

// Open flags
export const CASC_OPEN_BY_NAME: number = bindings.CASC_OPEN_BY_NAME;
export const CASC_OPEN_BY_CKEY: number = bindings.CASC_OPEN_BY_CKEY;
export const CASC_OPEN_BY_EKEY: number = bindings.CASC_OPEN_BY_EKEY;
export const CASC_OPEN_BY_FILEID: number = bindings.CASC_OPEN_BY_FILEID;
export const CASC_OPEN_TYPE_MASK: number = bindings.CASC_OPEN_TYPE_MASK;
export const CASC_OPEN_FLAGS_MASK: number = bindings.CASC_OPEN_FLAGS_MASK;
export const CASC_STRICT_DATA_CHECK: number = bindings.CASC_STRICT_DATA_CHECK;
export const CASC_OVERCOME_ENCRYPTED: number = bindings.CASC_OVERCOME_ENCRYPTED;
export const CASC_OPEN_CKEY_ONCE: number = bindings.CASC_OPEN_CKEY_ONCE;

// Locale flags
export const CASC_LOCALE_ALL: number = bindings.CASC_LOCALE_ALL;
export const CASC_LOCALE_ALL_WOW: number = bindings.CASC_LOCALE_ALL_WOW;
export const CASC_LOCALE_NONE: number = bindings.CASC_LOCALE_NONE;
export const CASC_LOCALE_UNKNOWN1: number = bindings.CASC_LOCALE_UNKNOWN1;
export const CASC_LOCALE_ENUS: number = bindings.CASC_LOCALE_ENUS;
export const CASC_LOCALE_KOKR: number = bindings.CASC_LOCALE_KOKR;
export const CASC_LOCALE_RESERVED: number = bindings.CASC_LOCALE_RESERVED;
export const CASC_LOCALE_FRFR: number = bindings.CASC_LOCALE_FRFR;
export const CASC_LOCALE_DEDE: number = bindings.CASC_LOCALE_DEDE;
export const CASC_LOCALE_ZHCN: number = bindings.CASC_LOCALE_ZHCN;
export const CASC_LOCALE_ESES: number = bindings.CASC_LOCALE_ESES;
export const CASC_LOCALE_ZHTW: number = bindings.CASC_LOCALE_ZHTW;
export const CASC_LOCALE_ENGB: number = bindings.CASC_LOCALE_ENGB;
export const CASC_LOCALE_ENCN: number = bindings.CASC_LOCALE_ENCN;
export const CASC_LOCALE_ENTW: number = bindings.CASC_LOCALE_ENTW;
export const CASC_LOCALE_ESMX: number = bindings.CASC_LOCALE_ESMX;
export const CASC_LOCALE_RURU: number = bindings.CASC_LOCALE_RURU;
export const CASC_LOCALE_PTBR: number = bindings.CASC_LOCALE_PTBR;
export const CASC_LOCALE_ITIT: number = bindings.CASC_LOCALE_ITIT;
export const CASC_LOCALE_PTPT: number = bindings.CASC_LOCALE_PTPT;

// Content flags
export const CASC_CFLAG_INSTALL: number = bindings.CASC_CFLAG_INSTALL;
export const CASC_CFLAG_LOAD_ON_WINDOWS: number = bindings.CASC_CFLAG_LOAD_ON_WINDOWS;
export const CASC_CFLAG_LOAD_ON_MAC: number = bindings.CASC_CFLAG_LOAD_ON_MAC;
export const CASC_CFLAG_X86_32: number = bindings.CASC_CFLAG_X86_32;
export const CASC_CFLAG_X86_64: number = bindings.CASC_CFLAG_X86_64;
export const CASC_CFLAG_LOW_VIOLENCE: number = bindings.CASC_CFLAG_LOW_VIOLENCE;
export const CASC_CFLAG_DONT_LOAD: number = bindings.CASC_CFLAG_DONT_LOAD;
export const CASC_CFLAG_UPDATE_PLUGIN: number = bindings.CASC_CFLAG_UPDATE_PLUGIN;
export const CASC_CFLAG_ARM64: number = bindings.CASC_CFLAG_ARM64;
export const CASC_CFLAG_ENCRYPTED: number = bindings.CASC_CFLAG_ENCRYPTED;
export const CASC_CFLAG_NO_NAME_HASH: number = bindings.CASC_CFLAG_NO_NAME_HASH;
export const CASC_CFLAG_UNCMN_RESOLUTION: number = bindings.CASC_CFLAG_UNCMN_RESOLUTION;
export const CASC_CFLAG_BUNDLE: number = bindings.CASC_CFLAG_BUNDLE;
export const CASC_CFLAG_NO_COMPRESSION: number = bindings.CASC_CFLAG_NO_COMPRESSION;

// Hash sizes
export const MD5_HASH_SIZE: number = bindings.MD5_HASH_SIZE;
export const MD5_STRING_SIZE: number = bindings.MD5_STRING_SIZE;
export const SHA1_HASH_SIZE: number = bindings.SHA1_HASH_SIZE;
export const SHA1_STRING_SIZE: number = bindings.SHA1_STRING_SIZE;

// Invalid values
export const CASC_INVALID_INDEX: number = bindings.CASC_INVALID_INDEX;
export const CASC_INVALID_SIZE: number = bindings.CASC_INVALID_SIZE;
export const CASC_INVALID_POS: number = bindings.CASC_INVALID_POS;
export const CASC_INVALID_ID: number = bindings.CASC_INVALID_ID;
export const CASC_INVALID_OFFS64: number = bindings.CASC_INVALID_OFFS64;
export const CASC_INVALID_SIZE64: number = bindings.CASC_INVALID_SIZE64;

// Storage info constants
export const CascStorageLocalFileCount: number = bindings.CascStorageLocalFileCount;
export const CascStorageTotalFileCount: number = bindings.CascStorageTotalFileCount;
export const CascStorageFeatures: number = bindings.CascStorageFeatures;
export const CascStorageInstalledLocales: number = bindings.CascStorageInstalledLocales;
export const CascStorageProduct: number = bindings.CascStorageProduct;
export const CascStorageTags: number = bindings.CascStorageTags;
export const CascStoragePathProduct: number = bindings.CascStoragePathProduct;

// File info constants
export const CascFileContentKey: number = bindings.CascFileContentKey;
export const CascFileEncodedKey: number = bindings.CascFileEncodedKey;
export const CascFileFullInfo: number = bindings.CascFileFullInfo;
export const CascFileSpanInfo: number = bindings.CascFileSpanInfo;

// Feature flags
export const CASC_FEATURE_FILE_NAMES: number = bindings.CASC_FEATURE_FILE_NAMES;
export const CASC_FEATURE_ROOT_CKEY: number = bindings.CASC_FEATURE_ROOT_CKEY;
export const CASC_FEATURE_TAGS: number = bindings.CASC_FEATURE_TAGS;
export const CASC_FEATURE_FNAME_HASHES: number = bindings.CASC_FEATURE_FNAME_HASHES;
export const CASC_FEATURE_FNAME_HASHES_OPTIONAL: number = bindings.CASC_FEATURE_FNAME_HASHES_OPTIONAL;
export const CASC_FEATURE_FILE_DATA_IDS: number = bindings.CASC_FEATURE_FILE_DATA_IDS;
export const CASC_FEATURE_LOCALE_FLAGS: number = bindings.CASC_FEATURE_LOCALE_FLAGS;
export const CASC_FEATURE_CONTENT_FLAGS: number = bindings.CASC_FEATURE_CONTENT_FLAGS;
export const CASC_FEATURE_DATA_ARCHIVES: number = bindings.CASC_FEATURE_DATA_ARCHIVES;
export const CASC_FEATURE_DATA_FILES: number = bindings.CASC_FEATURE_DATA_FILES;
export const CASC_FEATURE_ONLINE: number = bindings.CASC_FEATURE_ONLINE;
export const CASC_FEATURE_FORCE_DOWNLOAD: number = bindings.CASC_FEATURE_FORCE_DOWNLOAD;

// Key length
export const CASC_KEY_LENGTH: number = bindings.CASC_KEY_LENGTH;

