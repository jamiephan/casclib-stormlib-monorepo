# @jamiephan/casclib

Node.js native bindings for [CascLib](https://github.com/ladislav-zezula/CascLib) - A library to read CASC storage from Blizzard games.

## Installation

```bash
npm install @jamiephan/casclib
```

Or with pnpm:

```bash
pnpm add @jamiephan/casclib
```

## Usage

### Import

The package supports both CommonJS and ES Module imports:

```javascript
// ES Module (recommended)
import { CascStorage, CascFile } from '@jamiephan/casclib';

// CommonJS
const { CascStorage, CascFile } = require('@jamiephan/casclib');
```

### Opening a CASC Storage

```typescript
import { CascStorage } from '@jamiephan/casclib';

const storage = new CascStorage();
storage.open('/path/to/game/Data');

// Check if a file exists
if (storage.fileExists('some-file.txt')) {
  console.log('File exists!');
}

// Get file information
const info = storage.getFileInfo('some-file.txt');
if (info) {
  console.log(`File: ${info.name}, Size: ${info.size} bytes`);
}
```

### Reading Files

```typescript
// Open and read a file
const file = storage.openFile('some-file.txt');

// Read all content at once
const content = file.readAll();
console.log(content.toString());

// Or read in chunks
file.setPosition(0); // Reset to beginning
const chunk = file.read(1024); // Read 1024 bytes

// Close the file when done
file.close();
```

### Complete Example

```typescript
import { CascStorage } from '@jamiephan/casclib';

async function readGameFile() {
  const storage = new CascStorage();
  
  try {
    storage.open('/path/to/wow/Data');
    
    if (storage.fileExists('Interface\\FrameXML\\UIParent.lua')) {
      const file = storage.openFile('Interface\\FrameXML\\UIParent.lua');
      const content = file.readAll();
      
      console.log(`File size: ${file.getSize()} bytes`);
      console.log('Content:', content.toString());
      
      file.close();
    }
  } finally {
    storage.close();
  }
}

readGameFile();
```

## API

### CascStorage

#### `constructor()`
Creates a new CascStorage instance.

#### `open(path: string, options?: StorageOpenOptions): void`
Opens a CASC storage at the specified path.

#### `close(): boolean`
Closes the storage.

#### `openFile(filename: string, options?: FileOpenOptions): CascFile`
Opens a file from the storage.

#### `getFileInfo(filename: string): FileInfo | null`
Gets information about a file.

#### `fileExists(filename: string): boolean`
Checks if a file exists in the storage.

### CascFile

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

## License

MIT

## Credits

- [CascLib](https://github.com/ladislav-zezula/CascLib) by Ladislav Zezula
