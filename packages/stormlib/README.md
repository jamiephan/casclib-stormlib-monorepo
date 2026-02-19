# @jamiephan/stormlib

Node.js native bindings for [StormLib](https://github.com/ladislav-zezula/StormLib) - A library to read and write MPQ (Mo'PaQ) archives from Blizzard games.

## Features

- Read and write MPQ archives
- Extract files from classic Blizzard games
- Create new archives and modify existing ones
- File compression and encryption support
- TypeScript support with full type definitions
- Cross-platform (Windows, Linux, MacOS)
- Both CommonJS and ES Module support
- High-level wrapper API for ease of use
- Low-level bindings for advanced usage

## Supported Games

Any game using MPQ archive format, including:
- Warcraft III (pre-Reforged)
- Starcraft & Starcraft: Brood War
- Starcraft II (legacy)
- Diablo II
- World of Warcraft (classic)

## Installation

```bash
npm install @jamiephan/stormlib
```

Or with pnpm:

```bash
pnpm add @jamiephan/stormlib
```

## Architecture

This package provides two layers of API:

1. **High-level Wrapper API** (Recommended) - `Archive` and `File` classes with simplified method names
2. **Low-level Bindings API** (Advanced) - Direct access to native bindings with exact StormLib.h naming (interfaces: `MPQArchive`, `MPQFile`)

Most users should use the high-level wrapper API as shown in all examples below. The low-level bindings use exact function names from StormLib.h (e.g., `SFileOpenArchive`, `SFileReadFile`).

For more details, see [BINDING_NAMING_CONVENTION.md](BINDING_NAMING_CONVENTION.md).

## Usage

### Import

The package supports both CommonJS and ES Module imports:

```javascript
// ES Module (recommended)
import { Archive, File } from '@jamiephan/stormlib';

// CommonJS
const { Archive, File } = require('@jamiephan/stormlib');

// Advanced: Direct binding access
import { MPQArchiveBinding, MPQArchive, MPQFile } from '@jamiephan/stormlib/bindings';
```

### Opening an MPQ Archive

```typescript
import { Archive } from '@jamiephan/stormlib';

const archive = new Archive();
archive.open('/path/to/archive.mpq');

// Check if a file exists
if (archive.hasFile('war3map.j')) {
  console.log('File exists!');
}

// Get maximum file count
console.log(`Max files: ${archive.getMaxFileCount()}`);
```

### Reading Files

```typescript
// Open and read a file
const file = archive.openFile('war3map.j');

// Read all content at once
const content = file.readAll();
console.log(content.toString());

// Or read in chunks
file.setPosition(0); // Reset to beginning
const chunk = file.read(1024); // Read 1024 bytes

// Check file size and position
console.log(`Size: ${file.getSize()}, Position: ${file.getPosition()}`);

// Close the file when done
file.close();
```

### Creating and Modifying Archives

```typescript
import { Archive } from '@jamiephan/stormlib';

// Create a new archive
const archive = new Archive();
archive.create('/path/to/new-archive.mpq', {
  maxFileCount: 1000,
  flags: 0
});

// Add a file from disk
archive.addFile('/path/to/local-file.txt', 'archive-file.txt');

// Rename a file
archive.renameFile('old-name.txt', 'new-name.txt');

// Remove a file
archive.removeFile('unwanted-file.txt');

// Compact the archive (remove unused space)
archive.compact();

// Close when done
archive.close();
```

### Extracting Files

```typescript
const archive = new Archive();
archive.open('/path/to/game.mpq');

// Extract a file to disk
const success = archive.extractFile('Scripts\\main.lua', '/output/main.lua');
if (success) {
  console.log('File extracted successfully!');
}

archive.close();
```

### Complete Example

```typescript
import { Archive } from '@jamiephan/stormlib';
import * as fs from 'fs';

async function processArchive() {
  const archive = new Archive();
  
  try {
    archive.open('/path/to/warcraft3.mpq');
    
    if (archive.hasFile('war3map.j')) {
      // Read the entire file
      const file = archive.openFile('war3map.j');
      const content = file.readAll();
      
      console.log(`File size: ${file.getSize()} bytes`);
      console.log(`Current position: ${file.getPosition()}`);
      
      // Save to disk
      fs.writeFileSync('/output/war3map.j', content);
      
      file.close();
    }
    
    // Add a new file
    archive.addFile('/local/custom.txt', 'custom.txt');
    
    // Compact to save space
    archive.compact();
  } finally {
    archive.close();
  }
}

processArchive();
```

### Advanced Examples

#### Listing All Files in an Archive

```typescript
import { Archive, ArchiveUtils } from '@jamiephan/stormlib';

const archive = new Archive();
archive.open('/path/to/game.mpq');

// List all files
const files = archive.listFiles();
console.log(`Archive contains ${files.length} files`);

files.forEach(fileInfo => {
  console.log(`${fileInfo.name}`);
  console.log(`  Size: ${fileInfo.fileSize} bytes`);
  console.log(`  Compressed: ${fileInfo.compSize} bytes`);
  console.log(`  Flags: 0x${fileInfo.fileFlags.toString(16)}`);
  console.log(`  Locale: ${fileInfo.locale}`);
});

// Or use utility function
const fileNames = ArchiveUtils.getFileNames(archive);
console.log('Files:', fileNames.join(', '));

archive.close();
```

#### Working with Patches

```typescript
import { Archive } from '@jamiephan/stormlib';

const archive = new Archive();
archive.open('/path/to/base.mpq');

// Open patch archive
archive.openPatchArchive('/path/to/patch-1.mpq');
archive.openPatchArchive('/path/to/patch-2.mpq');

// Check if patched
if (archive.isPatchedArchive()) {
  console.log('Archive has patches applied');
}

// Files will be read with patches applied
const file = archive.openFile('some-file.txt');
const content = file.readAll();
file.close();

archive.close();
```

#### Creating Files Programmatically

```typescript
import { Archive, MPQ_FILE_COMPRESS, MPQ_COMPRESSION_ZLIB } from '@jamiephan/stormlib';

const archive = new Archive();
archive.create('/path/to/new.mpq', { maxFileCount: 100 });

// Create a new file in the archive
const data = Buffer.from('Hello, World!', 'utf-8');
const file = archive.createFile('greeting.txt', Date.now(), data.length);

// Write data
file.write(data, MPQ_COMPRESSION_ZLIB);

// Finish and close the file
file.finish();

archive.close();
```

#### Archive Verification and Signing

```typescript
import { Archive, SFILE_VERIFY_ALL } from '@jamiephan/stormlib';

const archive = new Archive();
archive.open('/path/to/archive.mpq');

// Verify archive signature
const signatureResult = archive.verifyArchive();
console.log(`Signature verification: ${signatureResult}`);

// Verify a specific file
const fileResult = archive.verifyFile('war3map.j', SFILE_VERIFY_ALL);
console.log(`File verification: ${fileResult}`);

// Get file checksums
const checksums = archive.getFileChecksums('war3map.j');
console.log(`CRC32: 0x${checksums.crc32.toString(16)}`);
console.log(`MD5: ${checksums.md5}`);

// Sign the archive
archive.signArchive();

archive.close();
```

#### Using ArchiveUtils for Batch Operations

```typescript
import { Archive, ArchiveUtils } from '@jamiephan/stormlib';
import * as fs from 'fs';
import * as path from 'path';

const archive = new Archive();
archive.open('/path/to/game.mpq');

// Extract all Lua scripts
const extracted = ArchiveUtils.extractAllFiles(
  archive, 
  '/output/scripts', 
  '*.lua'
);
console.log(`Extracted ${extracted} Lua files`);

// Read configuration as JSON
try {
  const config = ArchiveUtils.readFileAsJson(archive, 'config.json');
  console.log('Configuration:', config);
} catch (e) {
  console.error('No config.json found');
}

// Get compression statistics
const totalSize = ArchiveUtils.getTotalSize(archive);
const compressedSize = ArchiveUtils.getTotalCompressedSize(archive);
const ratio = ArchiveUtils.getCompressionRatio(archive);

console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Compressed: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Compression: ${(ratio * 100).toFixed(1)}%`);
console.log(`Space saved: ${((1 - ratio) * 100).toFixed(1)}%`);

archive.close();
```

## API Reference

### Archive

#### Constructor

##### `constructor()`
Creates a new Archive instance.

```typescript
const archive = new Archive();
```

#### Archive Operations

##### `open(path: string, options?: ArchiveOpenOptions): void`
Opens an MPQ archive at the specified path.

**Parameters:**
- `path`: Path to the MPQ archive file
- `options`: Optional opening options
  - `flags`: Opening flags (number)

**Example:**
```typescript
archive.open('/path/to/archive.mpq');
archive.open('/path/to/archive.mpq', { flags: 0 });
```

##### `create(path: string, options?: ArchiveCreateOptions): void`
Creates a new MPQ archive.

**Parameters:**
- `path`: Path for the new archive
- `options`: Optional creation options
  - `maxFileCount`: Maximum number of files (default: 1000)
  - `flags`: Creation flags (number)

**Example:**
```typescript
archive.create('/path/to/new.mpq', {
  maxFileCount: 1000,
  flags: 0
});
```

##### `close(): boolean`
Closes the archive and releases resources.

**Returns:** `true` if closed successfully, `false` otherwise

**Example:**
```typescript
const closed = archive.close();
```

##### `flush(): boolean`
Flushes any pending changes to disk without closing the archive.

**Returns:** `true` if flushed successfully

**Example:**
```typescript
archive.flush();
```

##### `compact(): boolean`
Compacts the archive to remove unused space and optimize storage.

**Returns:** `true` if compacted successfully

**Example:**
```typescript
archive.compact();
```

##### `getMaxFileCount(): number`
Gets the maximum number of files the archive can contain.

**Returns:** Maximum file count

**Example:**
```typescript
const maxFiles = archive.getMaxFileCount();
console.log(`Archive can hold up to ${maxFiles} files`);
```

##### `setMaxFileCount(maxFileCount: number): boolean`
Sets the maximum number of files the archive can contain.

**Parameters:**
- `maxFileCount`: New maximum file count

**Returns:** `true` if set successfully

**Example:**
```typescript
archive.setMaxFileCount(2000);
```

##### `getAttributes(): number`
Gets the attributes flags for the archive.

**Returns:** Attributes flags (MPQ_ATTRIBUTE_*)

**Example:**
```typescript
const attrs = archive.getAttributes();
```

##### `setAttributes(attributes: number): boolean`
Sets the attributes flags for the archive.

**Parameters:**
- `attributes`: Attributes flags to set

**Returns:** `true` if set successfully

**Example:**
```typescript
import { MPQ_ATTRIBUTE_CRC32, MPQ_ATTRIBUTE_FILETIME } from '@jamiephan/stormlib';
archive.setAttributes(MPQ_ATTRIBUTE_CRC32 | MPQ_ATTRIBUTE_FILETIME);
```

##### `verifyFile(filename: string, flags: number): number`
Verifies a file in the archive against its checksums.

**Parameters:**
- `filename`: Name of the file to verify
- `flags`: Verification flags (SFILE_VERIFY_*)

**Returns:** Verification result flags

**Example:**
```typescript
import { SFILE_VERIFY_ALL } from '@jamiephan/stormlib';
const result = archive.verifyFile('war3map.j', SFILE_VERIFY_ALL);
```

##### `verifyArchive(): number`
Verifies the archive signature.

**Returns:** Verification result code:
- `ERROR_NO_SIGNATURE` (0): No signature
- `ERROR_WEAK_SIGNATURE_OK` (2): Weak signature valid
- `ERROR_WEAK_SIGNATURE_ERROR` (3): Weak signature invalid
- `ERROR_STRONG_SIGNATURE_OK` (4): Strong signature valid
- `ERROR_STRONG_SIGNATURE_ERROR` (5): Strong signature invalid

**Example:**
```typescript
const result = archive.verifyArchive();
console.log(`Verification result: ${result}`);
```

##### `signArchive(signatureType?: number): boolean`
Signs the archive with a digital signature.

**Parameters:**
- `signatureType`: Type of signature to apply (default: 0)

**Returns:** `true` if signed successfully

**Example:**
```typescript
archive.signArchive();
```

##### `getFileChecksums(filename: string): { crc32: number; md5: string }`
Gets the CRC32 checksum and MD5 hash for a file.

**Parameters:**
- `filename`: Name of the file

**Returns:** Object containing `crc32` (number) and `md5` (string)

**Example:**
```typescript
const checksums = archive.getFileChecksums('war3map.j');
console.log(`CRC32: ${checksums.crc32}, MD5: ${checksums.md5}`);
```

##### `addListFile(listfilePath: string): number`
Adds a listfile to the archive.

**Parameters:**
- `listfilePath`: Path to the listfile

**Returns:** Number of entries added

**Example:**
```typescript
const added = archive.addListFile('/path/to/listfile.txt');
console.log(`Added ${added} listfile entries`);
```

##### `openPatchArchive(patchPath: string, patchPrefix?: string, flags?: number): boolean`
Opens a patch archive for the current archive.

**Parameters:**
- `patchPath`: Path to the patch archive
- `patchPrefix`: Optional patch path prefix
- `flags`: Optional flags (default: 0)

**Returns:** `true` if patch opened successfully

**Example:**
```typescript
archive.openPatchArchive('/path/to/patch.mpq');
archive.openPatchArchive('/path/to/patch.mpq', 'base');
```

##### `isPatchedArchive(): boolean`
Checks if the archive has patches applied.

**Returns:** `true` if archive has patches

**Example:**
```typescript
if (archive.isPatchedArchive()) {
  console.log('This archive has patches');
}
```

##### `findFiles(mask?: string): FileInfo[] | null`
Finds all files in the archive matching a mask pattern.

**Parameters:**
- `mask`: File mask with wildcards (default: "*")

**Returns:** Array of file information objects, or `null` if no files found

**Example:**
```typescript
// Find all files
const allFiles = archive.findFiles();

// Find specific pattern
const jsFiles = archive.findFiles('*.j');

// Process results
allFiles?.forEach(file => {
  console.log(`${file.name} - ${file.fileSize} bytes`);
});
```

##### `listFiles(): FileInfo[]`
Lists all files in the archive.

**Returns:** Array of file information objects (empty array if no files)

**Example:**
```typescript
const files = archive.listFiles();
files.forEach(file => {
  console.log(`${file.name}: ${file.fileSize} bytes (compressed: ${file.compSize})`);
});
```

##### `enumLocales(filename: string, searchScope?: number): number[]`
Enumerates available locales for a specific file.

**Parameters:**
- `filename`: Name of the file
- `searchScope`: Search scope (default: 0)

**Returns:** Array of locale IDs

**Example:**
```typescript
const locales = archive.enumLocales('war3map.j');
console.log(`Available locales: ${locales.join(', ')}`);
```

##### `createFile(filename: string, fileTime: number, fileSize: number, locale?: number, flags?: number): File`
Creates a new file in the archive for writing.

**Parameters:**
- `filename`: Name of the file to create
- `fileTime`: File timestamp
- `fileSize`: Size of the file
- `locale`: Locale ID (default: 0)
- `flags`: File flags (default: 0)

**Returns:** File object for writing

**Example:**
```typescript
const file = archive.createFile('newfile.txt', Date.now(), 100);
file.write(Buffer.from('Hello, world!'));
file.finish();
```

##### `addWave(sourcePath: string, archiveName: string, flags?: number, quality?: number): boolean`
Adds a wave audio file to the archive with compression.

**Parameters:**
- `sourcePath`: Path to the wave file on disk
- `archiveName`: Name for the file in the archive
- `flags`: File flags (default: 0)
- `quality`: Compression quality (default: 1, range: 0-2)

**Returns:** `true` if added successfully

**Example:**
```typescript
import { MPQ_FILE_COMPRESS, MPQ_WAVE_QUALITY_HIGH } from '@jamiephan/stormlib';
archive.addWave('/audio/sound.wav', 'sound.wav', MPQ_FILE_COMPRESS, MPQ_WAVE_QUALITY_HIGH);
```

##### `updateFileAttributes(filename: string): boolean`
Updates attributes for a specific file in the archive.

**Parameters:**
- `filename`: Name of the file

**Returns:** `true` if updated successfully

**Example:**
```typescript
archive.updateFileAttributes('war3map.j');
```

##### `getFileInfo(infoClass: number): Buffer | null`
Gets archive or file information.

**Parameters:**
- `infoClass`: Information class to retrieve

**Returns:** Buffer containing the info data, or `null` if unavailable

**Example:**
```typescript
const info = archive.getFileInfo(0);
```

##### Static Methods

###### `Archive.getLocale(): number`
Gets the current locale setting for archive operations.

**Returns:** Current locale ID

**Example:**
```typescript
const locale = Archive.getLocale();
```

###### `Archive.setLocale(locale: number): number`
Sets the locale for archive operations.

**Parameters:**
- `locale`: Locale ID to set

**Returns:** Previous locale ID

**Example:**
```typescript
import { LANG_NEUTRAL } from '@jamiephan/stormlib';
const oldLocale = Archive.setLocale(LANG_NEUTRAL);
```

#### File Operations

##### `openFile(filename: string, options?: FileOpenOptions): File`
Opens a file from the archive.

**Parameters:**
- `filename`: Name of the file to open
- `options`: Optional opening options
  - `flags`: Open flags (number)

**Returns:** An `File` object

**Example:**
```typescript
const file = archive.openFile('war3map.j');
```

##### `hasFile(filename: string): boolean`
Checks if a file exists in the archive.

**Parameters:**
- `filename`: Name of the file to check

**Returns:** `true` if file exists, `false` otherwise

**Example:**
```typescript
if (archive.hasFile('war3map.j')) {
  console.log('File exists!');
}
```

##### `extractFile(source: string, destination: string): boolean`
Extracts a file from the archive to disk.

**Parameters:**
- `source`: Source filename in the archive
- `destination`: Destination path on disk

**Returns:** `true` if extracted successfully

**Example:**
```typescript
const success = archive.extractFile('war3map.j', '/output/war3map.j');
```

##### `addFile(sourcePath: string, archiveName: string, options?: AddFileOptions): boolean`
Adds a file to the archive from disk with default compression settings.

**Parameters:**
- `sourcePath`: Path to the file on disk
- `archiveName`: Name for the file in the archive
- `options`: Optional add file options
  - `flags`: File flags (compression, encryption, etc.)
  - `compression`: Compression method for first sector
  - `compressionNext`: Compression method for subsequent sectors

**Returns:** `true` if added successfully

**Example:**
```typescript
import { MPQ_FILE_COMPRESS, MPQ_COMPRESSION_ZLIB } from '@jamiephan/stormlib';

// Simple add with default settings
archive.addFile('/local/file.txt', 'archive-file.txt');

// With specific flags
archive.addFile('/local/file.txt', 'archive-file.txt', { 
  flags: MPQ_FILE_COMPRESS 
});

// With compression options
archive.addFile('/local/file.txt', 'archive-file.txt', {
  flags: MPQ_FILE_COMPRESS,
  compression: MPQ_COMPRESSION_ZLIB,
  compressionNext: MPQ_COMPRESSION_ZLIB
});
```

##### `addFileEx(sourcePath: string, archiveName: string, flags: number, compression: number, compressionNext: number): boolean`
Adds a file to the archive with explicit compression settings.

**Parameters:**
- `sourcePath`: Path to the file on disk
- `archiveName`: Name for the file in the archive
- `flags`: File flags (compression, encryption, etc.)
- `compression`: Compression method for first sector
- `compressionNext`: Compression method for subsequent sectors

**Returns:** `true` if added successfully

**Example:**
```typescript
import { 
  MPQ_FILE_COMPRESS, 
  MPQ_FILE_ENCRYPTED,
  MPQ_COMPRESSION_ZLIB 
} from '@jamiephan/stormlib';

archive.addFileEx(
  '/local/file.txt',
  'archive-file.txt',
  MPQ_FILE_COMPRESS | MPQ_FILE_ENCRYPTED,
  MPQ_COMPRESSION_ZLIB,
  MPQ_COMPRESSION_ZLIB
);
```

##### `removeFile(filename: string): boolean`
Removes a file from the archive.

**Parameters:**
- `filename`: Name of the file to remove

**Returns:** `true` if removed successfully

**Example:**
```typescript
const removed = archive.removeFile('unwanted-file.txt');
```

##### `renameFile(oldName: string, newName: string): boolean`
Renames a file in the archive.

**Parameters:**
- `oldName`: Current filename
- `newName`: New filename

**Returns:** `true` if renamed successfully

**Example:**
```typescript
archive.renameFile('old-name.txt', 'new-name.txt');
```

---

### File

#### Constructor

The `File` class is instantiated by calling `archive.openFile()`. Do not construct it directly.

#### File Reading

##### `read(bytesToRead?: number): Buffer`
Reads data from the file at the current position.

**Parameters:**
- `bytesToRead`: Number of bytes to read (default: 4096)

**Returns:** Buffer containing the read data

**Example:**
```typescript
const chunk = file.read(1024); // Read 1024 bytes
const defaultChunk = file.read(); // Read 4096 bytes
```

##### `readAll(): Buffer`
Reads all data from the file from the current position to the end.

**Returns:** Buffer containing all remaining file data

**Example:**
```typescript
const content = file.readAll();
console.log(content.toString());
```

#### File Information

##### `getSize(): number`
Gets the file size in bytes.

**Returns:** File size as a number

**Example:**
```typescript
const size = file.getSize();
console.log(`File size: ${size} bytes`);
```

#### File Position

##### `getPosition(): number`
Gets the current file position.

**Returns:** Current position in bytes

**Example:**
```typescript
const pos = file.getPosition();
console.log(`Current position: ${pos}`);
```

##### `setPosition(position: number): number`
Sets the file position (seek).

**Parameters:**
- `position`: New position in bytes (from the beginning of the file)

**Returns:** The new position

**Example:**
```typescript
file.setPosition(0); // Reset to beginning
file.setPosition(100); // Jump to byte 100
```

#### File Operations

##### `close(): boolean`
Closes the file and releases resources.

**Returns:** `true` if closed successfully, `false` otherwise

**Example:**
```typescript
file.close();
```

##### `write(data: Buffer, compression?: number): boolean`
Writes data to the file (for files created with `archive.createFile()`).

**Parameters:**
- `data`: Buffer containing data to write
- `compression`: Compression method (default: ZLIB)

**Returns:** `true` if written successfully

**Example:**
```typescript
import { MPQ_COMPRESSION_ZLIB } from '@jamiephan/stormlib';
const file = archive.createFile('newfile.txt', Date.now(), 13);
file.write(Buffer.from('Hello, world!'), MPQ_COMPRESSION_ZLIB);
file.finish();
```

##### `finish(): boolean`
Finishes writing to the file and closes it.

**Returns:** `true` if finished successfully

**Example:**
```typescript
file.write(Buffer.from('data'));
file.finish();
```

##### `getFileName(): string`
Gets the filename of the currently open file.

**Returns:** The filename as a string

**Example:**
```typescript
const name = file.getFileName();
console.log(`Current file: ${name}`);
```

##### `setLocale(locale: number): boolean`
Sets the locale for the file.

**Parameters:**
- `locale`: Locale ID to set

**Returns:** `true` if set successfully

**Example:**
```typescript
file.setLocale(0);
```

##### `getFileInfo(infoClass: number): Buffer | null`
Gets file information.

**Parameters:**
- `infoClass`: Information class to retrieve

**Returns:** Buffer containing the info data, or `null` if unavailable

**Example:**
```typescript
const info = file.getFileInfo(0);
```

---

## Utility Functions

### ArchiveUtils

The `ArchiveUtils` namespace provides utility functions for common archive operations:

#### `readFileAsString(archive: Archive, filename: string, encoding?: BufferEncoding): string`
Reads a file from the archive as a string.

**Parameters:**
- `archive`: Archive instance
- `filename`: Name of the file to read
- `encoding`: Text encoding (default: 'utf-8')

**Returns:** File content as string

**Example:**
```typescript
import { Archive, ArchiveUtils } from '@jamiephan/stormlib';

const archive = new Archive();
archive.open('/path/to/archive.mpq');

const content = ArchiveUtils.readFileAsString(archive, 'script.lua');
console.log(content);
```

#### `readFileAsJson<T>(archive: Archive, filename: string): T`
Reads a file from the archive and parses it as JSON.

**Parameters:**
- `archive`: Archive instance
- `filename`: Name of the JSON file

**Returns:** Parsed JSON object

**Example:**
```typescript
interface Config {
  version: string;
  settings: Record<string, any>;
}

const config = ArchiveUtils.readFileAsJson<Config>(archive, 'config.json');
console.log(`Version: ${config.version}`);
```

####` extractAllFiles(archive: Archive, outputDir: string, mask?: string): number`
Extracts all files matching a mask to a directory.

**Parameters:**
- `archive`: Archive instance
- `outputDir`: Output directory path
- `mask`: File mask to filter (default: "*")

**Returns:** Number of files extracted

**Example:**
```typescript
const extracted = ArchiveUtils.extractAllFiles(archive, '/output/dir');
console.log(`Extracted ${extracted} files`);

// Extract only .j files
const jFiles = ArchiveUtils.extractAllFiles(archive, '/output/dir', '*.j');
```

#### `getFileNames(archive: Archive, mask?: string): string[]`
Gets all file names in the archive.

**Parameters:**
- `archive`: Archive instance
- `mask`: File mask to filter (default: "*")

**Returns:** Array of file names

**Example:**
```typescript
const allFiles = ArchiveUtils.getFileNames(archive);
const scripts = ArchiveUtils.getFileNames(archive, '*.lua');
```

#### `canOpenFile(archive: Archive, filename: string): boolean`
Checks if a file exists and can be opened.

**Parameters:**
- `archive`: Archive instance
- `filename`: Name of the file

**Returns:** `true` if file can be opened

**Example:**
```typescript
if (ArchiveUtils.canOpenFile(archive, 'war3map.j')) {
  console.log('File is accessible');
}
```

#### `getTotalSize(archive: Archive): number`
Gets the total uncompressed size of all files.

**Parameters:**
- `archive`: Archive instance

**Returns:** Total size in bytes

**Example:**
```typescript
const totalSize = ArchiveUtils.getTotalSize(archive);
console.log(`Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
```

#### `getTotalCompressedSize(archive: Archive): number`
Gets the total compressed size of all files.

**Parameters:**
- `archive`: Archive instance

**Returns:** Total compressed size in bytes

**Example:**
```typescript
const compSize = ArchiveUtils.getTotalCompressedSize(archive);
console.log(`Compressed: ${(compSize / 1024 / 1024).toFixed(2)} MB`);
```

#### `getCompressionRatio(archive: Archive): number`
Calculates the compression ratio for the archive.

**Parameters:**
- `archive`: Archive instance

**Returns:** Compression ratio (0.0 to 1.0)

**Example:**
```typescript
const ratio = ArchiveUtils.getCompressionRatio(archive);
console.log(`Compression ratio: ${(ratio * 100).toFixed(1)}%`);
```

---

## TypeScript Interfaces

```typescript
interface ArchiveOpenOptions {
  /** Flags for opening the archive */
  flags?: number;
}

interface ArchiveCreateOptions {
  /** Maximum number of files the archive can contain */
  maxFileCount?: number;
  /** Creation flags */
  flags?: number;
}

interface FileOpenOptions {
  /** Open flags */
  flags?: number;
}

interface AddFileOptions {
  /** File flags (compression, encryption, etc.) */
  flags?: number;
  /** Compression method for first sector */
  compression?: number;
  /** Compression method for subsequent sectors */
  compressionNext?: number;
}

interface FileInfo {
  /** Full file name in the archive */
  name: string;
  /** Plain file name without path */
  plainName: string;
  /** Hash table index */
  hashIndex: number;
  /** Block table index */
  blockIndex: number;
  /** Uncompressed file size in bytes */
  fileSize: number;
  /** File flags (MPQ_FILE_*) */
  fileFlags: number;
  /** Compressed file size in bytes */
  compSize: number;
  /** File time (low 32 bits) */
  fileTimeLo: number;
  /** File time (high 32 bits) */
  fileTimeHi: number;
  /** Locale ID */
  locale: number;
}
```

The `FileInfo` interface is returned by `archive.findFiles()` and `archive.listFiles()` methods and contains comprehensive metadata about files in the archive.

## Exported Constants

The library exports all StormLib constants. Here are the most commonly used:

### StormLib Version
- `STORMLIB_VERSION`: Version number (0x091F)
- `STORMLIB_VERSION_STRING`: Version string ("9.31")

### Error Codes
- `ERROR_AVI_FILE`: File is AVI, not MPQ (10000)
- `ERROR_UNKNOWN_FILE_KEY`: Cannot find file key (10001)
- `ERROR_CHECKSUM_ERROR`: Checksum mismatch (10002)
- `ERROR_FILE_INCOMPLETE`: File part missing (10006)

### Hash Table Sizes
- `HASH_TABLE_SIZE_MIN`: Minimum hash table size (4)
- `HASH_TABLE_SIZE_DEFAULT`: Default hash table size (4096)
- `HASH_TABLE_SIZE_MAX`: Maximum hash table size (524288)

### File Open Flags
- `SFILE_OPEN_FROM_MPQ`: Open from MPQ (0x00000000)
- `SFILE_OPEN_CHECK_EXISTS`: Only check if exists (0xFFFFFFFC)
- `SFILE_OPEN_ANY_LOCALE`: Open any locale (0xFFFFFFFE)
- `SFILE_OPEN_LOCAL_FILE`: Open local file (0xFFFFFFFF)

### Invalid Return Values
- `SFILE_INVALID_SIZE`: Invalid file size (0xFFFFFFFF)
- `SFILE_INVALID_POS`: Invalid file position (0xFFFFFFFF)
- `SFILE_INVALID_ATTRIBUTES`: Invalid attributes (0xFFFFFFFF)

### Verification Result Flags
- `VERIFY_OPEN_ERROR`: Failed to open (0x0001)
- `VERIFY_READ_ERROR`: Failed to read (0x0002)
- `VERIFY_FILE_HAS_SECTOR_CRC`: Has sector CRC (0x0004)
- `VERIFY_FILE_SECTOR_CRC_ERROR`: Sector CRC error (0x0008)
- `VERIFY_FILE_HAS_CHECKSUM`: Has CRC32 (0x0010)
- `VERIFY_FILE_CHECKSUM_ERROR`: CRC32 error (0x0020)
- `VERIFY_FILE_HAS_MD5`: Has MD5 (0x0040)
- `VERIFY_FILE_MD5_ERROR`: MD5 error (0x0080)

### Signature Types
- `SIGNATURE_TYPE_NONE`: No signature (0x0000)
- `SIGNATURE_TYPE_WEAK`: Weak signature (0x0001)
- `SIGNATURE_TYPE_STRONG`: Strong signature (0x0002)

### Archive Verification Results
- `ERROR_NO_SIGNATURE`: No signature (0)
- `ERROR_VERIFY_FAILED`: Verification failed (1)
- `ERROR_WEAK_SIGNATURE_OK`: Weak signature OK (2)
- `ERROR_WEAK_SIGNATURE_ERROR`: Weak signature error (3)
- `ERROR_STRONG_SIGNATURE_OK`: Strong signature OK (4)
- `ERROR_STRONG_SIGNATURE_ERROR`: Strong signature error (5)

### Locale
- `LANG_NEUTRAL`: Neutral locale (0x00)

### File Seek Methods
- `FILE_BEGIN`: Seek from beginning (0)
- `FILE_CURRENT`: Seek from current position (1)
- `FILE_END`: Seek from end (2)

For a complete list of all constants, see [lib/constants.ts](lib/constants.ts).

## Common File Flags

The library exports all StormLib constants. Import them to use in your code:

```typescript
import {
  // File flags
  MPQ_FILE_IMPLODE,
  MPQ_FILE_COMPRESS,
  MPQ_FILE_ENCRYPTED,
  MPQ_FILE_FIX_KEY,
  MPQ_FILE_SINGLE_UNIT,
  MPQ_FILE_SECTOR_CRC,
  MPQ_FILE_REPLACEEXISTING,
  
  // Compression types
  MPQ_COMPRESSION_HUFFMANN,
  MPQ_COMPRESSION_ZLIB,
  MPQ_COMPRESSION_PKWARE,
  MPQ_COMPRESSION_BZIP2,
  MPQ_COMPRESSION_LZMA,
  
  // Archive open flags
  MPQ_OPEN_NO_LISTFILE,
  MPQ_OPEN_NO_ATTRIBUTES,
  MPQ_OPEN_CHECK_SECTOR_CRC,
  MPQ_OPEN_READ_ONLY,
  
  // Archive create flags
  MPQ_CREATE_LISTFILE,
  MPQ_CREATE_ATTRIBUTES,
  MPQ_CREATE_ARCHIVE_V1,
  MPQ_CREATE_ARCHIVE_V2,
  
  // Verification flags
  SFILE_VERIFY_SECTOR_CRC,
  SFILE_VERIFY_FILE_CRC,
  SFILE_VERIFY_FILE_MD5,
  SFILE_VERIFY_ALL,
  
  // And many more...
} from '@jamiephan/stormlib';
```

### File Flags

```typescript
// Compression and storage
const MPQ_FILE_IMPLODE = 0x00000100;        // Implode compression (old)
const MPQ_FILE_COMPRESS = 0x00000200;       // Compress using multiple methods
const MPQ_FILE_ENCRYPTED = 0x00010000;      // File is encrypted
const MPQ_FILE_FIX_KEY = 0x00020000;        // File encryption key is fixed
const MPQ_FILE_PATCH_FILE = 0x00100000;     // File is a patch file
const MPQ_FILE_SINGLE_UNIT = 0x01000000;    // File stored as single unit
const MPQ_FILE_DELETE_MARKER = 0x02000000;  // File is a deletion marker
const MPQ_FILE_SECTOR_CRC = 0x04000000;     // File has sector CRC
const MPQ_FILE_SIGNATURE = 0x10000000;      // File is a signature
const MPQ_FILE_EXISTS = 0x80000000;         // File exists
const MPQ_FILE_REPLACEEXISTING = 0x80000000;// Replace existing file

// Example: Add a compressed file
archive.addFile('/local/file.txt', 'file.txt', { 
  flags: MPQ_FILE_COMPRESS 
});

// Example: Add compressed and encrypted file
archive.addFile('/local/secret.txt', 'secret.txt', { 
  flags: MPQ_FILE_COMPRESS | MPQ_FILE_ENCRYPTED 
});
```

### Compression Types

```typescript
const MPQ_COMPRESSION_HUFFMANN = 0x01;      // Huffman compression
const MPQ_COMPRESSION_ZLIB = 0x02;          // ZLIB compression
const MPQ_COMPRESSION_PKWARE = 0x08;        // PKWARE DCL compression
const MPQ_COMPRESSION_BZIP2 = 0x10;         // BZIP2 compression
const MPQ_COMPRESSION_SPARSE = 0x20;        // Sparse compression
const MPQ_COMPRESSION_ADPCM_MONO = 0x40;    // ADPCM mono compression
const MPQ_COMPRESSION_ADPCM_STEREO = 0x80;  // ADPCM stereo compression
const MPQ_COMPRESSION_LZMA = 0x12;          // LZMA compression

// Example: Use ZLIB compression
archive.addFileEx(
  '/local/file.txt',
  'file.txt',
  MPQ_FILE_COMPRESS,
  MPQ_COMPRESSION_ZLIB,
  MPQ_COMPRESSION_ZLIB
);
```

### Archive Flags

```typescript
// Open flags
const MPQ_OPEN_NO_LISTFILE = 0x00010000;      // Don't load listfile
const MPQ_OPEN_NO_ATTRIBUTES = 0x00020000;    // Don't load attributes
const MPQ_OPEN_NO_HEADER_SEARCH = 0x00040000; // Don't search for header
const MPQ_OPEN_FORCE_MPQ_V1 = 0x00080000;     // Force MPQ v1 format
const MPQ_OPEN_CHECK_SECTOR_CRC = 0x00100000; // Check sector CRC
const MPQ_OPEN_READ_ONLY = 0x00000100;        // Read-only access

// Create flags
const MPQ_CREATE_LISTFILE = 0x00100000;       // Create listfile
const MPQ_CREATE_ATTRIBUTES = 0x00200000;     // Create attributes file
const MPQ_CREATE_SIGNATURE = 0x00400000;      // Create signature
const MPQ_CREATE_ARCHIVE_V1 = 0x00000000;     // MPQ v1 (up to 4GB)
const MPQ_CREATE_ARCHIVE_V2 = 0x01000000;     // MPQ v2 (larger than 4GB)
const MPQ_CREATE_ARCHIVE_V3 = 0x02000000;     // MPQ v3
const MPQ_CREATE_ARCHIVE_V4 = 0x03000000;     // MPQ v4

// Example: Create archive with listfile
archive.create('/path/to/archive.mpq', {
  maxFileCount: 1000,
  flags: MPQ_CREATE_LISTFILE | MPQ_CREATE_ATTRIBUTES
});
```

## Advanced Usage

### Direct Binding Access

For advanced users who need direct access to the native bindings:

```typescript
import { MPQArchiveBinding, MPQArchive, MPQFile } from '@jamiephan/stormlib/bindings';

const archive: MPQArchive = new MPQArchiveBinding();
archive.SFileOpenArchive('/path/to/archive.mpq', 0);

const file: MPQFile = archive.SFileOpenFileEx('filename.txt', 0);
const size = file.SFileGetFileSize();
const content = file.SFileReadFile(size);
file.SFileCloseFile();

archive.SFileCloseArchive();
```

### Binding Naming Convention

The low-level bindings use **exact names from StormLib.h**:
- C++ function: `SFileOpenArchive` → JS binding: `SFileOpenArchive`
- C++ function: `SFileGetFileSize` → JS binding: `SFileGetFileSize`
- Interfaces are prefixed with `MPQ`: `MPQArchive`, `MPQFile`, etc.

The high-level wrapper simplifies these names:
- Binding: `SFileOpenArchive` → Wrapper: `open()`
- Binding: `SFileGetFileSize` → Wrapper: `getSize()`

See [BINDING_NAMING_CONVENTION.md](BINDING_NAMING_CONVENTION.md) for complete details.

## Performance Tips

1. **Use `readAll()` for small files**: More efficient than multiple `read()` calls
2. **Use `read(size)` for large files**: Better memory management for streaming
3. **Call `compact()` after modifications**: Removes unused space and optimizes the archive
4. **Close files and archives**: Always close resources when done to prevent memory leaks
5. **Batch operations**: Make all modifications before compacting for better performance

## Error Handling

All methods that can fail will throw exceptions. Always use try-catch blocks:

```typescript
try {
  const archive = new Archive();
  archive.open('/path/to/archive.mpq');
  
  if (archive.hasFile('some-file.txt')) {
    const file = archive.openFile('some-file.txt');
    const content = file.readAll();
    file.close();
  }
  
  archive.close();
} catch (error) {
  console.error('Error processing archive:', error);
}
```

## License

MIT

## Credits

- [StormLib](https://github.com/ladislav-zezula/StormLib) by Ladislav Zezula
