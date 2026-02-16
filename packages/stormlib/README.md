# @jamiephan/stormlib

Node.js native bindings for [StormLib](https://github.com/ladislav-zezula/StormLib) - A library to read and write MPQ archives from Blizzard games.

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
if (archive.hasFile('some-file.txt')) {
  console.log('File exists!');
}

// Get maximum file count
console.log(`Max files: ${archive.getMaxFileCount()}`);
```

### Reading Files

```typescript
// Open and read a file
const file = archive.openFile('some-file.txt');

// Read all content at once
const content = file.readAll();
console.log(content.toString());

// Or read in chunks
file.setPosition(0); // Reset to beginning
const chunk = file.read(1024); // Read 1024 bytes

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

// Add a file
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
archive.extractFile('Scripts\\main.lua', '/output/main.lua');

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
      
      // Save to disk
      fs.writeFileSync('/output/war3map.j', content);
      
      file.close();
    }
  } finally {
    archive.close();
  }
}

processArchive();
```

## API

### MpqArchive

#### `constructor()`
Creates a new MpqArchive instance.

#### `open(path: string, options?: ArchiveOpenOptions): void`
Opens an MPQ archive at the specified path.

#### `create(path: string, options?: ArchiveCreateOptions): void`
Creates a new MPQ archive.

#### `close(): boolean`
Closes the archive.

#### `openFile(filename: string, options?: FileOpenOptions): MpqFile`
Opens a file from the archive.

#### `hasFile(filename: string): boolean`
Checks if a file exists in the archive.

#### `extractFile(source: string, destination: string): boolean`
Extracts a file from the archive to disk.

#### `addFile(sourcePath: string, archiveName: string, options?: AddFileOptions): boolean`
Adds a file to the archive.

#### `removeFile(filename: string): boolean`
Removes a file from the archive.

#### `renameFile(oldName: string, newName: string): boolean`
Renames a file in the archive.

#### `compact(): boolean`
Compacts the archive to remove unused space.

#### `getMaxFileCount(): number`
Gets the maximum number of files the archive can contain.

### MpqFile

#### `read(bytesToRead?: number): Buffer`
Reads data from the file. Default: 4096 bytes.

#### `readAll(): Buffer`
Reads all data from the file.

#### `getSize(): number`
Gets the file size in bytes.

#### `getPosition(): number`
Gets the current file position.

#### `setPosition(position: number): number`
Sets the file position.

#### `close(): boolean`
Closes the file.

## Supported Games

StormLib supports MPQ archives from various Blizzard games:
- Diablo I & II
- StarCraft & StarCraft: Brood War
- Warcraft II & III
- World of Warcraft
- StarCraft II
- Diablo III
- Heroes of the Storm

## License

MIT

## Credits

- [StormLib](https://github.com/ladislav-zezula/StormLib) by Ladislav Zezula
