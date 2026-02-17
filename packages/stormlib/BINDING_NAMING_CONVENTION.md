# StormLib Binding Naming Convention

This document describes the naming convention used for JavaScript bindings of StormLib C++ functions.

## Convention

The JavaScript binding names follow this pattern:
- **Remove the `SFile` prefix** from the C++ function name
- **Convert to camelCase**
- **Keep the rest of the function name** (including `Archive`, `File`, etc.)

## Archive Class Methods

| C++ Function | JS Binding | Description |
|---|---|---|
| `SFileOpenArchive` | `openArchive` | Open an MPQ archive |
| `SFileCreateArchive` | `createArchive` | Create a new MPQ archive |
| `SFileCloseArchive` | `closeArchive` | Close the archive |
| `SFileOpenFileEx` | `openFileEx` | Open a file from archive |
| `SFileHasFile` | `hasFile` | Check if file exists |
| `SFileExtractFile` | `extractFile` | Extract file to disk |
| `SFileAddFile` | `addFile` | Add file to archive |
| `SFileRemoveFile` | `removeFile` | Remove file from archive |
| `SFileRenameFile` | `renameFile` | Rename file in archive |
| `SFileCompactArchive` | `compactArchive` | Compact archive |
| `SFileGetMaxFileCount` | `getMaxFileCount` | Get max file count |

## File Class Methods

| C++ Function | JS Binding | Description |
|---|---|---|
| `SFileReadFile` | `readFile` | Read data from file |
| `SFileReadFile` | `readFileAll` | Read all file data |
| `SFileGetFileSize` | `getFileSize` | Get file size |
| `SFileSetFilePointer` | `getFilePointer` | Get current position |
| `SFileSetFilePointer` | `setFilePointer` | Set file position |
| `SFileCloseFile` | `closeFile` | Close the file |

## Examples

### Direct Binding Usage (Low-level API)

```typescript
import { Archive, File } from '@jamiephan/stormlib/bindings';

const archive = new Archive();
archive.openArchive('/path/to/archive.mpq', 0);

const file = archive.openFileEx('file.txt', 0);
const size = file.getFileSize();
const content = file.readFileAll();
file.closeFile();

archive.closeArchive();
```

### Wrapper Class Usage (High-level API - Recommended)

The high-level wrapper classes (`MpqArchive` and `MpqFile`) provide a cleaner API with simplified method names:

```typescript
import { MpqArchive } from '@jamiephan/stormlib';

const archive = new MpqArchive();
archive.open('/path/to/archive.mpq'); // Calls archive.openArchive internally

const file = archive.openFile('file.txt'); // Calls archive.openFileEx internally
const size = file.getSize(); // Calls file.getFileSize internally
const content = file.readAll(); // Calls file.readFileAll internally
file.close(); // Calls file.closeFile internally

archive.close(); // Calls archive.closeArchive internally
```

## Notes

- The low-level bindings (in `lib/bindings.ts`) follow the strict naming convention
- The high-level wrapper classes (in `lib/index.ts`) provide simplified method names for better developer experience
- Tests and documentation use the high-level API, so they don't need changes when updating binding names
- Constants and flags are exported with their original names (e.g., `MPQ_FILE_COMPRESS`, `MPQ_FILE_ENCRYPTED`)
