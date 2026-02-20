# @jamiephan/casclib

Node.js native bindings for [CascLib](https://github.com/ladislav-zezula/CascLib) - A library to read CASC (Content Addressable Storage Container) from modern Blizzard games.

## Features

- Read CASC storage archives (local and online)
- Extract files from modern Blizzard games
- TypeScript support with full type definitions
- Cross-platform (Windows, Linux)
- Both CommonJS and ES Module support
- High-level wrapper API for ease of use
- Low-level bindings for advanced usage

## Supported Games

Any game using CASC storage format, including:
- Heroes of the Storm
- World of Warcraft
- Diablo III & IV
- Overwatch
- Starcraft II
- Warcraft III: Reforged

## Installation

```bash
npm install @jamiephan/casclib
```

Or with pnpm:

```bash
pnpm add @jamiephan/casclib
```

## Architecture

This package provides two layers of API:

1. **High-level Wrapper API** (Recommended) - `Storage` and `File` classes with simplified method names
2. **Low-level Bindings API** (Advanced) - Direct access to native bindings with CascLib.h names (interfaces: `CascStorage`, `CascFile`)

Most users should use the high-level wrapper API as shown in all examples below. The low-level bindings use exact function names from CascLib.h (e.g., `CascOpenStorage`, `CascOpenFile`).

For more details, see [BINDING_NAMING_CONVENTION.md](BINDING_NAMING_CONVENTION.md).

## Usage

### Import

The package supports both CommonJS and ES Module imports:

```javascript
// ES Module (recommended)
import { Storage, File } from '@jamiephan/casclib';

// CommonJS
const { Storage, File } = require('@jamiephan/casclib');

// Advanced: Direct binding access (low-level API)
import { CascStorageBinding, CascStorage, CascFile } from '@jamiephan/casclib';

// Import constants and enums
import { 
  CASC_OPEN_BY_NAME, 
  CASC_LOCALE_ENUS, 
  CascStorageInfoClass,
  CascFileInfoClass 
} from '@jamiephan/casclib';
```

### Opening a CASC Storage

```typescript
import { Storage } from '@jamiephan/casclib';

const storage = new Storage();
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
// Format: local_cache_folder[*cdn_server_url]*code_name[*region]
const storage = new Storage();

// Windows - Basic usage with cache folder and product code
storage.openOnline('C:/Temp/CASC/Cache*hero');

// Linux - Basic usage
storage.openOnline('/tmp/casc/cache*hero');

// With CDN server specified
storage.openOnline('C:/Temp/CASC/Cache*http://us.patch.battle.net:1119*hero');

// With region specified (uses default CDN)
storage.openOnline('/tmp/casc/cache*hero*us');

// Full format with all parameters
storage.openOnline('C:/Temp/CASC/Cache*http://us.patch.battle.net:1119*hero*us');

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
import { Storage } from '@jamiephan/casclib';

async function readGameFile() {
  const storage = new Storage();
  
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

### Storage

#### Constructor

##### `constructor()`
Creates a new Storage instance.

```typescript
const storage = new Storage();
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

##### `openEx(params: string, options?: CascOpenStorageExOptions): void`
Opens a CASC storage with extended parameters.

**Parameters:**
- `params`: Path or parameter string
- `options`: Extended opening options
  - `localPath`: Local path to storage
  - `codeName`: Product code name
  - `region`: Server region
  - `localeMask`: Locale mask for filtering files
  - `flags`: Opening flags
  - `buildKey`: Specific build key
  - `cdnHostUrl`: CDN host URL
  - `online`: Whether to use online mode

**Example:**
```typescript
storage.openEx('/path/to/storage', {
  localPath: '/path/to/storage',
  codeName: 'hero',
  region: 'us',
  flags: 0
});
```

##### `openOnline(path: string, options?: StorageOpenOptions): void`
Opens an online CASC storage.

**Parameters:**
- `path`: Connection string in the format: `local_cache_folder[*cdn_server_url]*code_name[*region]`
  - `local_cache_folder`: Local cache directory for downloaded game data (reusable across runs)
    - Windows: `C:/Temp/CASC/Cache`
    - Linux: `/tmp/casc/cache`
  - `cdn_server_url`: Optional CDN server URL (e.g., `http://us.patch.battle.net:1119`). If omitted, uses default CDN
  - `code_name`: TACT product code - see [TACT documentation](https://wowdev.wiki/TACT) for available codes
    - Examples: `hero` (Heroes of the Storm), `wow` (World of Warcraft), `s2` (StarCraft II), `d3` (Diablo III)
  - `region`: Optional server region (e.g., `us`, `eu`, `kr`, `tw`, `cn`). If omitted, defaults to `us`
- `options`: Optional opening options

**Examples:**
```typescript
// Windows - Minimal format: cache folder and product code
storage.openOnline('C:/Temp/CASC/Cache*hero');

// Linux - Minimal format
storage.openOnline('/tmp/casc/cache*hero');

// With CDN server specified
storage.openOnline('C:/Temp/CASC/Cache*http://us.patch.battle.net:1119*hero');

// With region specified (uses default CDN)
storage.openOnline('/tmp/casc/cache*hero*us');

// Full format with all parameters
storage.openOnline('C:/Temp/CASC/Cache*http://us.patch.battle.net:1119*hero*us');

// World of Warcraft EU region
storage.openOnline('/tmp/casc/cache*wow*eu');
```

##### `close(): boolean`
Closes the storage and releases resources.

**Returns:** `true` if closed successfully, `false` otherwise.

```typescript
const closed = storage.close();
```

##### `getStorageInfo(infoClass: number): CascStorageInfo`
Gets storage information.

**Parameters:**
- `infoClass`: The type of information to retrieve

**Returns:** Storage information object

#### File Operations

##### `openFile(filename: string, options?: FileOpenOptions): File`
Opens a file from the storage.

**Parameters:**
- `filename`: Name of the file to open (use backslashes for paths)
- `options`: Optional opening options
  - `flags`: Open flags (number)

**Returns:** A `File` object

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

##### `findFirstFile(mask?: string, listFile?: string): CascFindData | null`
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

##### `findNextFile(): CascFindData | null`
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

### File

#### Constructor

The `File` class is instantiated by calling `storage.openFile()`. Do not construct it directly.

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

##### `getFileInfo(infoClass: number): CascFileInfoResult`
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

interface CascOpenStorageExOptions {
  localPath?: string;
  codeName?: string;
  region?: string;
  localeMask?: number;
  flags?: number;
  buildKey?: string;
  cdnHostUrl?: string;
  online?: boolean;
}

interface FileInfo {
  name: string;
  size: number;
}

interface CascFindData {
  fileName: string;
  ckey: Buffer;
  ekey: Buffer;
  tagBitMask: number;
  fileSize: number;
  plainName: string | null;
  fileDataId: number;
  localeFlags: number;
  contentFlags: number;
  spanCount: number;
  available: boolean;
  nameType: CascNameType;
}

interface CascStorageInfo {
  fileCount?: number;
  features?: number;
  codeName?: string;
  buildNumber?: number;
}

interface CascFileInfoResult {
  ckey?: Buffer;
  ekey?: Buffer;
  dataFileName?: string;
  storageOffset?: number;
  segmentOffset?: number;
  tagBitMask?: number;
  fileNameHash?: number;
  contentSize?: number;
  encodedSize?: number;
  segmentIndex?: number;
  spanCount?: number;
  fileDataId?: number;
  localeFlags?: number;
  contentFlags?: number;
}
```

## Enums

```typescript
enum CascStorageInfoClass {
  LocalFileCount = 0,
  TotalFileCount = 1,
  Features = 2,
  InstalledLocales = 3,
  Product = 4,
  Tags = 5,
  PathProduct = 6
}

enum CascFileInfoClass {
  ContentKey = 0,
  EncodedKey = 1,
  FullInfo = 2,
  SpanInfo = 3
}

enum CascNameType {
  Full = 0,
  DataId = 1,
  CKey = 2,
  EKey = 3
}
```

## Constants

The package exports numerous constants from CascLib. Here are some commonly used ones:

### File Open Flags
```typescript
CASC_OPEN_BY_NAME      // Open file by name
CASC_OPEN_BY_CKEY      // Open file by content key
CASC_OPEN_BY_EKEY      // Open file by encoded key
CASC_OPEN_BY_FILEID    // Open file by file ID
CASC_STRICT_DATA_CHECK // Enable strict data checking
CASC_OVERCOME_ENCRYPTED // Try to overcome encryption
```

### Locale Flags
```typescript
CASC_LOCALE_ALL        // All locales
CASC_LOCALE_ENUS       // English (US)
CASC_LOCALE_KOKR       // Korean
CASC_LOCALE_FRFR       // French
CASC_LOCALE_DEDE       // German
CASC_LOCALE_ZHCN       // Chinese (Simplified)
CASC_LOCALE_ESES       // Spanish (Spain)
CASC_LOCALE_ZHTW       // Chinese (Traditional)
CASC_LOCALE_ENGB       // English (GB)
// ... and more
```

### Content Flags
```typescript
CASC_CFLAG_INSTALL           // Install file
CASC_CFLAG_LOAD_ON_WINDOWS   // Load on Windows
CASC_CFLAG_LOAD_ON_MAC       // Load on macOS
CASC_CFLAG_ENCRYPTED         // File is encrypted
CASC_CFLAG_NO_COMPRESSION    // No compression
// ... and more
```

### Feature Flags
```typescript
CASC_FEATURE_FILE_NAMES          // Storage has file names
CASC_FEATURE_FILE_DATA_IDS       // Storage has file data IDs
CASC_FEATURE_LOCALE_FLAGS        // Storage has locale flags
CASC_FEATURE_ONLINE              // Online storage
// ... and more
```

### File Positioning
```typescript
FILE_BEGIN     // Beginning of file
FILE_CURRENT   // Current position
FILE_END       // End of file
```

See [lib/bindings.ts](lib/bindings.ts) for a complete list of available constants.

## Advanced Usage

### Direct Binding Access

For advanced users who need direct access to the native bindings with exact CascLib.h function names:

```typescript
import { 
  CascStorageBinding, 
  CascStorage, 
  CascFile, 
  CASC_OPEN_BY_NAME 
} from '@jamiephan/casclib';

// Use the low-level binding interface directly
const storage: CascStorage = new CascStorageBinding();
storage.CascOpenStorage('/path/to/storage', 0);

const file: CascFile = storage.CascOpenFile('filename.txt', CASC_OPEN_BY_NAME);
const size = file.CascGetFileSize64();
const content = file.readFileAll();
file.CascCloseFile();

storage.CascCloseStorage();
```

### Utility Functions

The package also exports some utility functions:

```typescript
import { 
  CascOpenLocalFile,
  GetCascError,
  SetCascError,
  CascCdnGetDefault,
  CascCdnDownload
} from '@jamiephan/casclib';

// Open a local file directly (outside of storage)
const localFile = CascOpenLocalFile('/path/to/file.txt');

// Get the last CASC error code
const errorCode = GetCascError();

// Get default CDN URL
const defaultCdn = CascCdnGetDefault();

// Download from CDN
const data = CascCdnDownload(
  'http://us.patch.battle.net:1119',
  'hero',
  'some-file.idx'
);
```

### Binding Naming Convention

The low-level bindings use **exact names from CascLib.h**:
- C++ function: `CascOpenStorageEx` → JS binding: `CascOpenStorageEx`
- C++ function: `CascGetFileSize64` → JS binding: `CascGetFileSize64`
- Interfaces are prefixed with `CASC`: `CascStorage`, `CascFile`, `CascFindData`, etc.

The high-level wrapper simplifies these names:
- Binding: `CascOpenStorageEx` → Wrapper: `openEx()`
- Binding: `CascGetFileSize64` → Wrapper: `getSize64()`

See [BINDING_NAMING_CONVENTION.md](BINDING_NAMING_CONVENTION.md) for complete details.

## Performance Tips

1. **Use `readAll()` for small files**: More efficient than multiple `read()` calls
2. **Use `read(size)` for large files**: Better memory management for streaming
3. **Close files and storage**: Always close resources when done to prevent memory leaks
4. **Online storage caching**: First access downloads data to temp directory for better subsequent performance

## Error Handling

All methods that can fail will throw exceptions. Always use try-catch blocks:

```typescript
try {
  const storage = new Storage();
  storage.open('/path/to/storage');
  
  if (storage.fileExists('some-file.txt')) {
    const file = storage.openFile('some-file.txt');
    const content = file.readAll();
    file.close();
  }
  
  storage.close();
} catch (error) {
  console.error('Error processing storage:', error);
}
```

## License

MIT

## Credits

- [CascLib](https://github.com/ladislav-zezula/CascLib) by Ladislav Zezula
