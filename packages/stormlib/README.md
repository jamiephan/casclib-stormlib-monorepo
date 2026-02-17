# @jamiephan/stormlib

Node.js native bindings for [StormLib](https://github.com/ladislav-zezula/StormLib) - A library to read and write MPQ (Mo'PaQ) archives from Blizzard games.

## Installation

```bash
npm install @jamiephan/stormlib
```

Or with pnpm:

```bash
pnpm add @jamiephan/stormlib
```

## Usage

### Import

The package supports both CommonJS and ES Module imports:

```javascript
// ES Module (recommended)
import { MpqArchive, MpqFile } from '@jamiephan/stormlib';

// CommonJS
const { MpqArchive, MpqFile } = require('@jamiephan/stormlib');
```

### Opening an MPQ Archive

```typescript
import { MpqArchive } from '@jamiephan/stormlib';

const archive = new MpqArchive();
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
import { MpqArchive } from '@jamiephan/stormlib';

// Create a new archive
const archive = new MpqArchive();
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
const archive = new MpqArchive();
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
import { MpqArchive } from '@jamiephan/stormlib';
import * as fs from 'fs';

async function processArchive() {
  const archive = new MpqArchive();
  
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

## API Reference

### MpqArchive

#### Constructor

##### `constructor()`
Creates a new MpqArchive instance.

```typescript
const archive = new MpqArchive();
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

#### File Operations

##### `openFile(filename: string, options?: FileOpenOptions): MpqFile`
Opens a file from the archive.

**Parameters:**
- `filename`: Name of the file to open
- `options`: Optional opening options
  - `flags`: Open flags (number)

**Returns:** An `MpqFile` object

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
Adds a file to the archive from disk.

**Parameters:**
- `sourcePath`: Path to the file on disk
- `archiveName`: Name for the file in the archive
- `options`: Optional add file options
  - `flags`: File flags (compression, encryption, etc.)

**Returns:** `true` if added successfully

**Example:**
```typescript
archive.addFile('/local/file.txt', 'archive-file.txt');
archive.addFile('/local/file.txt', 'archive-file.txt', { flags: 0x200 });
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

### MpqFile

#### Constructor

The `MpqFile` class is instantiated by calling `archive.openFile()`. Do not construct it directly.

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
}
```

## Common File Flags

When using `addFile()`, you can specify flags to control compression and other behaviors:

```typescript
// Common flags (refer to StormLib documentation for complete list)
const MPQ_FILE_COMPRESS = 0x00000200;
const MPQ_FILE_ENCRYPTED = 0x00010000;
const MPQ_FILE_FIX_KEY = 0x00020000;
const MPQ_FILE_SINGLE_UNIT = 0x01000000;
const MPQ_FILE_DELETE_MARKER = 0x02000000;

// Example: Add a compressed file
archive.addFile('/local/file.txt', 'file.txt', { 
  flags: MPQ_FILE_COMPRESS 
});
```

## Performance Tips

1. **Use `readAll()` for small files**: More efficient than multiple `read()` calls
2. **Use `read(size)` for large files**: Better memory management for streaming
3. **Call `compact()` after modifications**: Removes unused space and optimizes the archive
4. **Close files and archives**: Always close resources when done to prevent memory leaks

## Error Handling

```typescript
try {
  const archive = new MpqArchive();
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
