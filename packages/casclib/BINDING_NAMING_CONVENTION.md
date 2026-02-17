# CascLib Binding Naming Convention

This document describes the naming convention used for JavaScript bindings of CascLib C++ functions.

## Convention

The JavaScript binding names follow this pattern:
- **Remove the `Casc` prefix** from the C++ function name
- **Convert to camelCase**
- **Keep the rest of the function name** (including `Storage`, `File`, etc.)

## Storage Class Methods

| C++ Function | JS Binding | Description |
|---|---|---|
| `CascOpenStorage` | `openStorage` | Open local CASC storage |
| `CascOpenOnlineStorage` | `openStorageOnline` | Open online CASC storage |
| `CascOpenStorageEx` | `openStorageEx` | Open storage with extended parameters |
| `CascCloseStorage` | `closeStorage` | Close the storage |
| `CascOpenFile` | `openFile` | Open a file from storage |
| `CascGetFileInfo` | `getFileInfo` | Get file information |
| `CascGetStorageInfo` | `getStorageInfo` | Get storage information |
| `CascFindFirstFile` | `findFirstFile` | Find first file matching pattern |
| `CascFindNextFile` | `findNextFile` | Find next file in search |
| `CascFindClose` | `findClose` | Close find operation |
| `CascAddEncryptionKey` | `addEncryptionKey` | Add encryption key |
| `CascAddStringEncryptionKey` | `addStringEncryptionKey` | Add encryption key from string |
| `CascImportKeysFromString` | `importKeysFromString` | Import keys from string |
| `CascImportKeysFromFile` | `importKeysFromFile` | Import keys from file |
| `CascFindEncryptionKey` | `findEncryptionKey` | Find encryption key |
| `CascGetNotFoundEncryptionKey` | `getNotFoundEncryptionKey` | Get not found key name |

## File Class Methods

| C++ Function | JS Binding | Description |
|---|---|---|
| `CascReadFile` | `readFile` | Read data from file |
| `CascReadFile` | `readFileAll` | Read all file data |
| `CascGetFileSize` | `getFileSize` | Get file size (32-bit) |
| `CascGetFileSize64` | `getFileSize64` | Get file size (64-bit) |
| `CascSetFilePointer` | `getFilePointer` | Get current position (32-bit) |
| `CascSetFilePointer64` | `getFilePointer64` | Get current position (64-bit) |
| `CascSetFilePointer` | `setFilePointer` | Set file position (32-bit) |
| `CascSetFilePointer64` | `setFilePointer64` | Set file position (64-bit) |
| `CascGetFileInfo` | `getFileInfo` | Get detailed file information |
| `CascSetFileFlags` | `setFileFlags` | Set file flags |
| `CascCloseFile` | `closeFile` | Close the file |

## Global Functions

| C++ Function | JS Binding | Description |
|---|---|---|
| `CascOpenLocalFile` | `openLocalFile` | Open a local file directly |
| `GetCascError` | `getError` | Get last error code |
| `SetCascError` | `setError` | Set error code |
| `CascCdnGetDefault` | `cdnGetDefault` | Get default CDN URL |
| `CascCdnDownload` | `cdnDownload` | Download from CDN |

## Examples

### Direct Binding Usage (Low-level API)

```typescript
import { Storage, File } from '@jamiephan/casclib/bindings';

const storage = new Storage();
storage.openStorage('/path/to/storage', 0);

const file = storage.openFile('file.txt', 0);
const size = file.getFileSize64();
const content = file.readFileAll();
file.closeFile();

storage.closeStorage();
```

### Wrapper Class Usage (High-level API - Recommended)

The high-level wrapper classes (`CascStorage` and `CascFile`) provide a cleaner API with simplified method names:

```typescript
import { CascStorage } from '@jamiephan/casclib';

const storage = new CascStorage();
storage.open('/path/to/storage'); // Calls storage.openStorage internally

const file = storage.openFile('file.txt');
const size = file.getSize64(); // Calls file.getFileSize64 internally
const content = file.readAll(); // Calls file.readFileAll internally
file.close(); // Calls file.closeFile internally

storage.close(); // Calls storage.closeStorage internally
```

## Notes

- The low-level bindings (in `lib/bindings.ts`) follow the strict naming convention
- The high-level wrapper classes (in `lib/index.ts`) provide simplified method names for better developer experience
- Tests and documentation use the high-level API, so they don't need changes when updating binding names
- Constants and enums are exported with their original names (e.g., `CASC_OPEN_BY_NAME`, `CASC_LOCALE_ENUS`)
