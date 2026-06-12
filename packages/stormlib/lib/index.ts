/**
 * @jamiephan/stormlib — Node.js native bindings for StormLib.
 *
 * Two API layers are exported:
 *  - High-level: `Archive` / `File` classes with camelCase methods,
 *    Promise-based async variants, iterators, and structured `StormError`s.
 *  - Low-level: raw native bindings in `./bindings` using exact upstream
 *    C function names (`SFileOpenArchive`, `SFileReadFile`, ...).
 */

// High-level API
export { Archive, withArchive, withArchiveAsync } from './archive';
export type {
  ArchiveOpenOptions,
  ArchiveCreateOptions,
  FileOpenOptions,
  AddFileOptions
} from './archive';
export { File } from './file';
export { StormError, StormErrorCode } from './errors';

// Low-level bindings (types, raw classes, utility functions)
export * from './bindings';

// Constants (MPQ flags, locales, compression methods, ...)
export * from './constants';

// Default export
import { Archive, withArchive, withArchiveAsync } from './archive';
import { File } from './file';
import { StormError } from './errors';

export default {
  Archive,
  File,
  StormError,
  withArchive,
  withArchiveAsync
};
