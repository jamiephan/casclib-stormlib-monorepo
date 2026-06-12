/**
 * @jamiephan/casclib — Node.js native bindings for CascLib.
 *
 * Two API layers are exported:
 *  - High-level: `Storage` / `File` classes with camelCase methods,
 *    Promise-based async variants, iterators, and structured `CascError`s.
 *  - Low-level: raw native bindings in `./bindings` using exact upstream
 *    C function names (`CascOpenStorage`, `CascGetFileSize64`, ...).
 */

// High-level API
export { Storage, withStorage, withStorageAsync } from './storage';
export type { StorageOpenOptions, FileInfo, FileOpenOptions } from './storage';
export { File } from './file';
export { CascError, CascErrorCode } from './errors';

// Low-level bindings (types, raw classes, utility functions)
export * from './bindings';

// Constants (re-exported from the native addon)
export * from './constants';

// Default export
import { Storage, withStorage, withStorageAsync } from './storage';
import { File } from './file';
import { CascError } from './errors';

export default {
  Storage,
  File,
  CascError,
  withStorage,
  withStorageAsync
};
