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
| `SFileGetLocale` | `SFileGetLocale` | Get locale (static) |
| `SFileSetLocale` | `SFileSetLocale` | Set locale (static) |

## File Class Methods (MPQFile)

| C++ Function | JS Binding | Description |
|---|---|---|
| `SFileReadFile` | `SFileReadFile` | Read data from file |
| `SFileGetFileSize` | `SFileGetFileSize` | Get file size |
| `SFileGetFilePointer` | `SFileGetFilePointer` | Get current position |
| `SFileSetFilePointer` | `SFileSetFilePointer` | Set file position |
| `SFileCloseFile` | `SFileCloseFile` | Close the file |

## Examples

### Direct Binding Usage (Low-level API)

```typescript
import { Archive, MPQArchive, MPQFile } from '@jamiephan/stormlib/bindings';

// Use type aliases to avoid confusion with wrapper classes
const archive: MPQArchive = new Archive();
archive.SFileOpenArchive('/path/to/archive.mpq', 0);

const file: MPQFile = archive.SFileOpenFileEx('file.txt', 0);
const size = file.SFileGetFileSize();
const content = file.SFileReadFile(size);
file.SFileCloseFile();

archive.SFileCloseArchive();
```

### Wrapper Class Usage (High-level API - Recommended)

The high-level wrapper classes (`MpqArchive` and `MpqFile`) provide a cleaner API with simplified method names:

```typescript
import { MpqArchive } from '@jamiephan/stormlib';

const archive = new MpqArchive();
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
- The high-level wrapper classes (`MpqArchive` and `MpqFile` in `lib/index.ts`) provide simplified method names for better developer experience
- Tests and documentation use the high-level API, so they don't need changes when updating binding names
- Constants and flags are exported with their original names (e.g., `MPQ_FILE_COMPRESS`, `MPQ_FILE_ENCRYPTED`)
