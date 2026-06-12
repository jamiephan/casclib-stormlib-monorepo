# StormLib Binding Naming Convention

This document describes the naming convention used for JavaScript bindings of StormLib C++ functions.

## Convention

The JavaScript binding names follow this pattern:
- **Use the exact function name from `StormLib.h`** (including `SFile` prefix)
- **Keep the original casing** (PascalCase for the main function name)
- **Interface names use `MPQ` prefix** (e.g., `MPQArchive`, `MPQFile`)

This ensures direct correspondence between the C++ API and JavaScript bindings for advanced users who need precise control.

## Archive Class Methods (MPQArchive)

| C++ Function | JS Binding | Description |
|---|---|---|
| `SFileOpenArchive` | `SFileOpenArchive` | Open an MPQ archive |
| `SFileCreateArchive` | `SFileCreateArchive` | Create a new MPQ archive |
| `SFileCloseArchive` | `SFileCloseArchive` | Close the archive |
| `SFileOpenFileEx` | `SFileOpenFileEx` | Open a file from archive |
| `SFileHasFile` | `SFileHasFile` | Check if file exists |
| `SFileExtractFile` | `SFileExtractFile` | Extract file to disk |
| `SFileAddFile` | `SFileAddFile` | Add file to archive |
| `SFileAddFileEx` | `SFileAddFileEx` | Add file with compression |
| `SFileRemoveFile` | `SFileRemoveFile` | Remove file from archive |
| `SFileRenameFile` | `SFileRenameFile` | Rename file in archive |
| `SFileCompactArchive` | `SFileCompactArchive` | Compact archive |
| `SFileFlushArchive` | `SFileFlushArchive` | Flush changes to disk |
| `SFileGetMaxFileCount` | `SFileGetMaxFileCount` | Get max file count |
| `SFileSetMaxFileCount` | `SFileSetMaxFileCount` | Set max file count |
| `SFileGetAttributes` | `SFileGetAttributes` | Get archive attributes |
| `SFileSetAttributes` | `SFileSetAttributes` | Set archive attributes |
| `SFileVerifyFile` | `SFileVerifyFile` | Verify file integrity |
| `SFileVerifyArchive` | `SFileVerifyArchive` | Verify archive integrity |
| `SFileSignArchive` | `SFileSignArchive` | Sign archive with signature |
| `SFileGetFileChecksums` | `SFileGetFileChecksums` | Get file CRC32 and MD5 |
| `SFileAddListFile` | `SFileAddListFile` | Add listfile to archive |
| `SFileOpenPatchArchive` | `SFileOpenPatchArchive` | Open patch archive |
| `SFileIsPatchedArchive` | `SFileIsPatchedArchive` | Check if patched |
| `SFileFindFirstFile` | `SFileFindFirstFile` | Find files in archive |
| `SFileEnumLocales` | `SFileEnumLocales` | Enumerate file locales |
| `SFileCreateFile` | `SFileCreateFile` | Create file in archive |
| `SFileAddWave` | `SFileAddWave` | Add wave file |
| `SFileUpdateFileAttributes` | `SFileUpdateFileAttributes` | Update file attributes |
| `SFileGetFileInfo` | `SFileGetFileInfo` | Get archive/file info |
| `SFileGetLocale` | `SFileGetLocale` | Get locale (static) |
| `SFileSetLocale` | `SFileSetLocale` | Set locale (static) |
| N/A (helper) | `openAsync` | Promise-based `SFileOpenArchive` on a libuv worker thread |
| N/A (helper) | `extractFileAsync` | Promise-based `SFileExtractFile` on a libuv worker thread |

## File Class Methods (MPQFile)

| C++ Function | JS Binding | Description |
|---|---|---|
| `SFileReadFile` | `SFileReadFile` | Read data from file |
| N/A (helper) | `readFileAll` | Read all file data (helper function) |
| N/A (helper) | `readAllAsync` | Promise-based `readFileAll` on a libuv worker thread |
| `SFileWriteFile` | `SFileWriteFile` | Write data to file |
| `SFileFinishFile` | `SFileFinishFile` | Finish writing file |
| `SFileGetFileSize` | `SFileGetFileSize` | Get file size |
| `SFileGetFilePointer` | `SFileGetFilePointer` | Get current position |
| `SFileSetFilePointer` | `SFileSetFilePointer` | Set file position |
| `SFileGetFileName` | `SFileGetFileName` | Get file name |
| `SFileSetFileLocale` | `SFileSetFileLocale` | Set file locale |
| `SFileGetFileInfo` | `SFileGetFileInfo` | Get file info |
| `SFileCloseFile` | `SFileCloseFile` | Close the file |

## Examples

### Direct Binding Usage (Low-level API)

```typescript
import { MPQArchiveBinding, MPQArchive, MPQFile } from '@jamiephan/stormlib/bindings';

// Use type aliases to avoid confusion with wrapper classes
const archive: MPQArchive = new MPQArchiveBinding();
archive.SFileOpenArchive('/path/to/archive.mpq', 0);

const file: MPQFile = archive.SFileOpenFileEx('file.txt', 0);
const size = file.SFileGetFileSize();
const content = file.SFileReadFile(size);
file.SFileCloseFile();

archive.SFileCloseArchive();
```

### Wrapper Class Usage (High-level API - Recommended)

The high-level wrapper classes (`Archive` and `File`) provide a cleaner API with simplified method names:

```typescript
import { Archive } from '@jamiephan/stormlib';

const archive = new Archive();
archive.open('/path/to/archive.mpq'); // Calls archive.SFileOpenArchive internally

const file = archive.openFile('file.txt'); // Calls archive.SFileOpenFileEx internally
const size = file.getSize(); // Calls file.SFileGetFileSize internally
const content = file.read(size); // Calls file.SFileReadFile internally
file.close(); // Calls file.SFileCloseFile internally

archive.close(); // Calls archive.SFileCloseArchive internally
```

## Notes

- The low-level bindings (in `lib/bindings.ts`) use exact StormLib.h function names
- Interfaces are prefixed with `MPQ` (e.g., `MPQArchive`, `MPQFile`) to indicate MPQ archive types
- The high-level wrapper classes (`lib/archive.ts`, `lib/file.ts`) provide simplified method names,
  Promise-based async variants, static factories (`Archive.open(...)`), and structured `StormError`s
- Errors thrown by the native layer carry `code` (numeric StormLib error code) and `codeName`
  (e.g. `"ERROR_FILE_NOT_FOUND"`) properties; the wrapper converts them to `StormError` instances
- Helper functions not in StormLib.h (like `readFileAll`, `openAsync`) use descriptive camelCase names
- Constants and flags are exported with their original names (e.g., `MPQ_FILE_COMPRESS`, `MPQ_FILE_ENCRYPTED`)

## TypeScript layer layout

| File | Contents |
|---|---|
| `lib/bindings.ts` | Native loader (`node-gyp-build`) + raw binding interfaces |
| `lib/constants.ts` | MPQ flags / locales / compression constants |
| `lib/errors.ts` | `StormError`, `StormErrorCode`, native error translation |
| `lib/archive.ts` | High-level `Archive` class + `withArchive(Async)` |
| `lib/file.ts` | High-level `File` class |
| `lib/dispose.ts` | `Symbol.dispose` polyfill for `using` support |
| `lib/index.ts` | Public entry point re-exporting both layers |
