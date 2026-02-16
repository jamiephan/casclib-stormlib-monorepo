# ES Module Import Examples

This document shows how to use both CommonJS and ES Module imports with the packages.

## Installation

```bash
npm install @jamiephan/casclib @jamiephan/stormlib
# or
pnpm add @jamiephan/casclib @jamiephan/stormlib
```

## CommonJS (require) - Backward Compatible

```javascript
// CascLib
const { CascStorage, CascFile } = require('@jamiephan/casclib');

const storage = new CascStorage();
storage.open('/path/to/casc/storage');
const file = storage.openFile('file.txt');
const content = file.readAll();
file.close();
storage.close();

// StormLib
const { MpqArchive, MpqFile } = require('@jamiephan/stormlib');

const archive = new MpqArchive();
archive.create('test.mpq', 16);
archive.addFile('local.txt', 'archive.txt');
archive.close();
```

## ES Module (import) - Modern JavaScript

```javascript
// CascLib
import { CascStorage, CascFile } from '@jamiephan/casclib';

const storage = new CascStorage();
storage.open('/path/to/casc/storage');
const file = storage.openFile('file.txt');
const content = file.readAll();
file.close();
storage.close();

// StormLib
import { MpqArchive, MpqFile } from '@jamiephan/stormlib';

const archive = new MpqArchive();
archive.create('test.mpq', 16);
archive.addFile('local.txt', 'archive.txt');
archive.close();
```

## Default Import

```javascript
// ES Module
import casclib from '@jamiephan/casclib';
import stormlib from '@jamiephan/stormlib';

const storage = new casclib.CascStorage();
const archive = new stormlib.MpqArchive();
```

## TypeScript

Both import styles work seamlessly with TypeScript:

```typescript
// ES Module (recommended)
import { CascStorage, CascFile } from '@jamiephan/casclib';
import { MpqArchive, MpqFile } from '@jamiephan/stormlib';

// CommonJS
import casclib = require('@jamiephan/casclib');
import stormlib = require('@jamiephan/stormlib');

// Full type support with IntelliSense
const storage: CascStorage = new CascStorage();
const archive: MpqArchive = new MpqArchive();
```

## Async/Await Example

```javascript
import { CascStorage } from '@jamiephan/casclib';
import { promises as fs } from 'fs';

async function extractFile(storagePath, fileName, outputPath) {
  const storage = new CascStorage();
  
  try {
    storage.open(storagePath);
    
    if (!storage.fileExists(fileName)) {
      throw new Error(`File ${fileName} not found`);
    }
    
    const file = storage.openFile(fileName);
    const content = file.readAll();
    
    await fs.writeFile(outputPath, content);
    
    file.close();
    console.log(`Extracted ${fileName} to ${outputPath}`);
  } finally {
    storage.close();
  }
}

// Usage
await extractFile(
  'C:/Games/Warcraft/Data',
  'Interface/FrameXML/UIParent.lua',
  './UIParent.lua'
);
```

## Package.json Configuration

The packages use the `exports` field to provide dual support:

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

This ensures that:
- Node.js automatically picks the right format based on your import style
- TypeScript gets full type information
- Bundlers (webpack, rollup, vite) can use ES modules for tree-shaking
- CommonJS projects continue to work without changes

## Testing Both Import Styles

### Test CommonJS
```bash
node -e "const {CascStorage} = require('@jamiephan/casclib'); console.log(typeof CascStorage);"
```

### Test ES Module
```bash
node --input-type=module --eval "import {CascStorage} from '@jamiephan/casclib'; console.log(typeof CascStorage);"
```

## Browser Usage

These packages contain native Node.js modules and **cannot run in browsers**. They require:
- Node.js runtime (v18+)
- Native addon support
- File system access

For browser use, you would need to create a server-side API that uses these libraries.
