# CascLib Binding Naming Convention

This document describes the naming convention used for JavaScript bindings of CascLib C++ functions.

## Convention

The JavaScript binding names follow this pattern:
- **Use the exact same name** as in CascLib.h
- **No prefix removal, no case changes**
- Helper functions (not in CascLib.h) use descriptive camelCase names

## Storage Class Methods

| C++ Function | JS Binding | Description |
|---|---|---|
| `CascOpenStorage` | `CascOpenStorage` | Open local CASC storage |
| `CascOpenOnlineStorage` | `CascOpenOnlineStorage` | Open online CASC storage |
| `CascOpenStorageEx` | `CascOpenStorageEx` | Open storage with extended parameters |
| `CascCloseStorage` | `CascCloseStorage` | Close the storage |
| `CascOpenFile` | `CascOpenFile` | Open a file from storage |
| `CascGetFileInfo` | `CascGetFileInfo` | Get file information |
| `CascGetStorageInfo` | `CascGetStorageInfo` | Get storage information |
| `CascFindFirstFile` | `CascFindFirstFile` | Find first file matching pattern |
| `CascFindNextFile` | `CascFindNextFile` | Find next file in search |
| `CascFindClose` | `CascFindClose` | Close find operation |
| `CascAddEncryptionKey` | `CascAddEncryptionKey` | Add encryption key |
| `CascAddStringEncryptionKey` | `CascAddStringEncryptionKey` | Add encryption key from string |
| `CascImportKeysFromString` | `CascImportKeysFromString` | Import keys from string |
| `CascImportKeysFromFile` | `CascImportKeysFromFile` | Import keys from file |
| `CascFindEncryptionKey` | `CascFindEncryptionKey` | Find encryption key |
| `CascGetNotFoundEncryptionKey` | `CascGetNotFoundEncryptionKey` | Get not found key name |
| N/A (helper) | `fileExists` | Check if file exists (helper function) |
| N/A (helper) | `openAsync` | Promise-based `CascOpenStorage` on a libuv worker thread |
| N/A (helper) | `openOnlineAsync` | Promise-based `CascOpenOnlineStorage` on a libuv worker thread |

## File Class Methods

| C++ Function | JS Binding | Description |
|---|---|---|
| `CascReadFile` | `CascReadFile` | Read data from file |
| N/A (helper) | `readFileAll` | Read all file data (helper function) |
| N/A (helper) | `readAllAsync` | Promise-based `readFileAll` on a libuv worker thread |
| `CascGetFileSize` | `CascGetFileSize` | Get file size (32-bit) |
| `CascGetFileSize64` | `CascGetFileSize64` | Get file size (64-bit) |
| `CascSetFilePointer` | `CascGetFilePointer` | Get current position (32-bit, helper) |
| `CascSetFilePointer64` | `CascGetFilePointer64` | Get current position (64-bit, helper) |
| `CascSetFilePointer` | `CascSetFilePointer` | Set file position (32-bit) |
| `CascSetFilePointer64` | `CascSetFilePointer64` | Set file position (64-bit) |
| `CascGetFileInfo` | `CascGetFileInfo` | Get detailed file information |
| `CascSetFileFlags` | `CascSetFileFlags` | Set file flags |
| `CascCloseFile` | `CascCloseFile` | Close the file |

## Global Functions

| C++ Function | JS Binding | Description |
|---|---|---|
| `CascOpenLocalFile` | `CascOpenLocalFile` | Open a local file directly |
| `GetCascError` | `GetCascError` | Get last error code |
| `SetCascError` | `SetCascError` | Set error code |
| `CascCdnGetDefault` | `CascCdnGetDefault` | Get default CDN URL |
| `CascCdnDownload` | `CascCdnDownload` | Download from CDN |

## Examples

### Direct Binding Usage (Low-level API)

```typescript
import { CascStorageBinding, CascStorage, CascFile } from '@jamiephan/casclib';

const storage: CascStorage = new CascStorageBinding();
storage.CascOpenStorage('/path/to/storage', 0);

const file: CascFile = storage.CascOpenFile('file.txt', 0);
const size = file.CascGetFileSize64();
const content = file.readFileAll();
file.CascCloseFile();

storage.CascCloseStorage();
```

### Wrapper Class Usage (High-level API - Recommended)

The high-level wrapper classes (`Storage` and `File`) provide a cleaner API with simplified method names:

```typescript
import { Storage } from '@jamiephan/casclib';

const storage = new Storage();
storage.open('/path/to/storage'); // Calls storage.CascOpenStorage internally

const file = storage.openFile('file.txt'); // Calls storage.CascOpenFile internally
const size = file.getSize64(); // Calls file.CascGetFileSize64 internally
const content = file.readAll(); // Calls file.readFileAll internally
file.close(); // Calls file.CascCloseFile internally

storage.close(); // Calls storage.CascCloseStorage internally
```

## Notes

- The low-level bindings (in `lib/bindings.ts`) use the **exact names from CascLib.h**
- **Interfaces and enums** are prefixed with `CASC` (e.g., `CascStorage`, `CascFile`, `CascFindData`)
- The high-level wrapper classes (`lib/storage.ts`, `lib/file.ts`) provide simplified method names,
  Promise-based async variants, static factories (`Storage.open(...)`), and structured `CascError`s
- Errors thrown by the native layer carry `code` (numeric CascLib error code) and `codeName`
  (e.g. `"ERROR_FILE_NOT_FOUND"`) properties; the wrapper converts them to `CascError` instances
- Helper functions not in CascLib.h (like `fileExists`, `readFileAll`, `openAsync`) use descriptive camelCase names
- Constants and enums are exported with their original names (e.g., `CASC_OPEN_BY_NAME`, `CASC_LOCALE_ENUS`)
  from `lib/constants.ts`

## TypeScript layer layout

| File | Contents |
|---|---|
| `lib/bindings.ts` | Native loader (`node-gyp-build`) + raw binding interfaces |
| `lib/constants.ts` | CascLib constants re-exported from the native addon |
| `lib/errors.ts` | `CascError`, `CascErrorCode`, native error translation |
| `lib/storage.ts` | High-level `Storage` class + `withStorage(Async)` |
| `lib/file.ts` | High-level `File` class |
| `lib/dispose.ts` | `Symbol.dispose` polyfill for `using` support |
| `lib/index.ts` | Public entry point re-exporting both layers |
