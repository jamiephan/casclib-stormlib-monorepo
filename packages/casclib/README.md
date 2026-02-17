# @jamiephan/casclib

Node.js native bindings for [CascLib](https://github.com/ladislav-zezula/CascLib) - A library to read CASC (Content Addressable Storage Container) from modern Blizzard games.

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
storage.open('/path/to/heroes/HeroesData');

// Check if a file exists
if (storage.fileExists('mods/heroesdata.stormmod/base.stormdata/GameData/HeroData.xml')) {
  console.log('File exists!');
}

// Get file information
const info = storage.getFileInfo('mods/heroesdata.stormmod/base.stormdata/GameData/HeroData.xml');
if (info) {
  console.log(`File: ${info.name}, Size: ${info.size} bytes`);
}
```

### Reading Files

```typescript
// Open and read a file
const file = storage.openFile('mods/heroesdata.stormmod/base.stormdata/GameData/HeroData.xml');

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

### Online Storage

```typescript
// Connect to online CASC storage
const storage = new CascStorage();
storage.openOnline('http://us.patch.battle.net:1119/hero');

if (storage.fileExists('mods/heroesdata.stormmod/base.stormdata/UI/Layout.xml')) {
  const file = storage.openFile('mods/heroesdata.stormmod/base.stormdata/UI/Layout.xml');
  const data = file.readAll();
  file.close();
}

storage.close();
```

### Finding Files

```typescript
// Find files matching a pattern
const findData = storage.findFirstFile('*.xml');
if (findData) {
  console.log(`Found: ${findData.fileName} (${findData.fileSize} bytes)`);
  
  // Continue finding
  let nextFile = storage.findNextFile();
  while (nextFile) {
    console.log(`Found: ${nextFile.fileName}`);
    nextFile = storage.findNextFile();
  }
  
  storage.findClose();
}
```

### Encryption Keys

```typescript
// Add encryption key (for encrypted files)
storage.addEncryptionKey(0x12345678, Buffer.from('your-key-data'));

// Or add from string
storage.addStringEncryptionKey(0x12345678, 'your-key-string');

// Import keys from file
storage.importKeysFromFile('/path/to/keys.txt');

// Find a key
const keyData = storage.findEncryptionKey(0x12345678);
if (keyData) {
  console.log('Key found:', keyData);
}
```

### Complete Example

```typescript
import { CascStorage } from '@jamiephan/casclib';

async function readGameFile() {
  const storage = new CascStorage();
  
  try {
    storage.open('/path/to/heroes/HeroesData');
    
    const heroDataPath = 'mods/heroesdata.stormmod/base.stormdata/GameData/HeroData.xml';
    if (storage.fileExists(heroDataPath)) {
      const file = storage.openFile(heroDataPath);
      const content = file.readAll();
      
      console.log(`File size: ${file.getSize()} bytes`);
      console.log(`Position: ${file.getPosition()}`);
      console.log('Content:', content.toString());
      
      file.close();
    }
  } finally {
    storage.close();
  }
}

readGameFile();
```

## API Reference

### CascStorage

#### Constructor

##### `constructor()`
Creates a new CascStorage instance.

```typescript
const storage = new CascStorage();
```

#### Storage Operations

##### `open(path: string, options?: StorageOpenOptions): void`
Opens a CASC storage at the specified path.

**Parameters:**
- `path`: Path to the CASC storage directory (e.g., `/path/to/game/Data`)
- `options`: Optional opening options
  - `flags`: Opening flags (number)

**Example:**
```typescript
storage.open('/path/to/heroes/HeroesData');
storage.open('/path/to/heroes/HeroesData', { flags: 0 });
```

##### `openOnline(path: string, options?: StorageOpenOptions): void`
Opens an online CASC storage.

**Parameters:**
- `path`: URL to the online storage
- `options`: Optional opening options

**Example:**
```typescript
storage.openOnline('http://us.patch.battle.net:1119/hero');
```

##### `close(): boolean`
Closes the storage and releases resources.

**Returns:** `true` if closed successfully, `false` otherwise.

```typescript
const closed = storage.close();
```

##### `getStorageInfo(infoClass: number): StorageInfo`
Gets storage information.

**Parameters:**
- `infoClass`: The type of information to retrieve

**Returns:** Storage information object

#### File Operations

##### `openFile(filename: string, options?: FileOpenOptions): CascFile`
Opens a file from the storage.

**Parameters:**
- `filename`: Name of the file to open (use backslashes for paths)
- `options`: Optional opening options
  - `flags`: Open flags (number)

**Returns:** A `CascFile` object

**Example:**
```typescript
const file = storage.openFile('mods/heroesdata.stormmod/base.stormdata/GameData/HeroData.xml');
```

##### `fileExists(filename: string): boolean`
Checks if a file exists in the storage.

**Parameters:**
- `filename`: Name of the file to check

**Returns:** `true` if file exists, `false` otherwise

**Example:**
```typescript
if (storage.fileExists('some-file.txt')) {
  console.log('File exists!');
}
```

##### `getFileInfo(filename: string): FileInfo | null`
Gets information about a file.

**Parameters:**
- `filename`: Name of the file

**Returns:** File information object or `null` if file doesn't exist

**TypeScript Interface:**
```typescript
interface FileInfo {
  name: string;
  size: number;
}
```

**Example:**
```typescript
const info = storage.getFileInfo('some-file.txt');
if (info) {
  console.log(`Name: ${info.name}, Size: ${info.size} bytes`);
}
```

#### File Finding

##### `findFirstFile(mask?: string, listFile?: string): FindData | null`
Finds the first file matching the mask.

**Parameters:**
- `mask`: File mask pattern (e.g., `*.lua`, `Interface\\*`)
- `listFile`: Optional list file path

**Returns:** Find data object or `null` if no files found

**Example:**
```typescript
const findData = storage.findFirstFile('*.xml');
if (findData) {
  console.log(`Found: ${findData.fileName}`);
}
```

##### `findNextFile(): FindData | null`
Finds the next file in the search.

**Returns:** Find data object or `null` if no more files

**Example:**
```typescript
let nextFile = storage.findNextFile();
while (nextFile) {
  console.log(`Found: ${nextFile.fileName}`);
  nextFile = storage.findNextFile();
}
```

##### `findClose(): boolean`
Closes the current find operation.

**Returns:** `true` if closed successfully

**Example:**
```typescript
storage.findClose();
```

#### Encryption Key Management

##### `addEncryptionKey(keyName: number, key: Buffer): boolean`
Adds an encryption key to the storage.

**Parameters:**
- `keyName`: Name/ID of the key
- `key`: Key data as Buffer

**Returns:** `true` if added successfully

**Example:**
```typescript
const keyData = Buffer.from('your-key-bytes');
storage.addEncryptionKey(0x12345678, keyData);
```

##### `addStringEncryptionKey(keyName: number, keyStr: string): boolean`
Adds an encryption key from a string.

**Parameters:**
- `keyName`: Name/ID of the key
- `keyStr`: Key as string

**Returns:** `true` if added successfully

**Example:**
```typescript
storage.addStringEncryptionKey(0x12345678, 'your-key-string');
```

##### `importKeysFromString(keyList: string): boolean`
Imports encryption keys from a string.

**Parameters:**
- `keyList`: String containing key list

**Returns:** `true` if imported successfully

##### `importKeysFromFile(filePath: string): boolean`
Imports encryption keys from a file.

**Parameters:**
- `filePath`: Path to the key file

**Returns:** `true` if imported successfully

**Example:**
```typescript
storage.importKeysFromFile('/path/to/keys.txt');
```

##### `findEncryptionKey(keyName: number): Buffer | null`
Finds an encryption key by name.

**Parameters:**
- `keyName`: Name/ID of the key

**Returns:** Key data or `null` if not found

**Example:**
```typescript
const key = storage.findEncryptionKey(0x12345678);
if (key) {
  console.log('Key found:', key);
}
```

##### `getNotFoundEncryptionKey(): number | null`
Gets the name of an encryption key that was not found.

**Returns:** Key name or `null`

---

### CascFile

#### Constructor

The `CascFile` class is instantiated by calling `storage.openFile()`. Do not construct it directly.

#### File Reading

##### `read(bytesToRead?: number): Buffer`
Reads data from the file at the current position.

**Parameters:**
- `bytesToRead`: Number of bytes to read (default: 4096)

**Returns:** Buffer containing the read data

**Example:**
```typescript
const chunk = file.read(1024); // Read 1024 bytes
```

##### `readAll(): Buffer`
Reads all data from the file.

**Returns:** Buffer containing all file data

**Example:**
```typescript
const content = file.readAll();
console.log(content.toString());
```

#### File Information

##### `getSize(): number`
Gets the file size in bytes (32-bit).

**Returns:** File size as a 32-bit number

**Example:**
```typescript
const size = file.getSize();
console.log(`File size: ${size} bytes`);
```

##### `getSize64(): number`
Gets the file size in bytes (64-bit).

**Returns:** File size as a 64-bit number

**Example:**
```typescript
const size = file.getSize64();
```

##### `getFileInfo(infoClass: number): FileInfoResult`
Gets detailed file information.

**Parameters:**
- `infoClass`: The type of information to retrieve

**Returns:** File information result object

#### File Position

##### `getPosition(): number`
Gets the current file position (32-bit).

**Returns:** Current position in bytes

**Example:**
```typescript
const pos = file.getPosition();
console.log(`Current position: ${pos}`);
```

##### `getPosition64(): number`
Gets the current file position (64-bit).

**Returns:** Current position in bytes

##### `setPosition(position: number): number`
Sets the file position (32-bit).

**Parameters:**
- `position`: New position in bytes

**Returns:** The new position

**Example:**
```typescript
file.setPosition(0); // Reset to beginning
file.setPosition(100); // Jump to byte 100
```

##### `setPosition64(position: number, moveMethod?: number): number`
Sets the file position (64-bit) with move method.

**Parameters:**
- `position`: New position in bytes
- `moveMethod`: Optional move method (FILE_BEGIN, FILE_CURRENT, FILE_END)

**Returns:** The new position

**Example:**
```typescript
file.setPosition64(0); // Reset to beginning
```

#### File Operations

##### `setFileFlags(flags: number): boolean`
Sets file flags.

**Parameters:**
- `flags`: Flags to set

**Returns:** `true` if set successfully

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
interface StorageOpenOptions {
  flags?: number;
}

interface FileOpenOptions {
  flags?: number;
}

interface FileInfo {
  name: string;
  size: number;
}

interface FindData {
  fileName: string;
  fileSize: number;
  // ... additional fields
}

interface StorageInfo {
  // Storage-specific information
}

interface FileInfoResult {
  // File-specific information
}
```

## License

MIT

## Credits

- [CascLib](https://github.com/ladislav-zezula/CascLib) by Ladislav Zezula
