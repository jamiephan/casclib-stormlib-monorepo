# @jamiephan Monorepo

A monorepo containing Node.js native bindings for CascLib and StormLib - libraries for reading Blizzard game archives.

## Packages

- **[@jamiephan/casclib](./packages/casclib)** - Native bindings for CascLib (CASC storage)
- **[@jamiephan/stormlib](./packages/stormlib)** - Native bindings for StormLib (MPQ archives)

## Prerequisites

### Required Tools

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Python** (for node-gyp) >= 3.6
- **C++ Build Tools**

#### Windows
Install Visual Studio 2019 or later with "Desktop development with C++" workload:
```powershell
# Or install just the build tools
npm install --global windows-build-tools
```

#### Linux
```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 libbz2-dev zlib1g-dev
```

#### macOS
```bash
xcode-select --install
```

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd @jamiephan

# Install pnpm if you haven't already
npm install -g pnpm

# Install all dependencies and build native modules
pnpm install
```

### 2. Build All Packages

```bash
# Build all packages
pnpm build

# Or build individually
pnpm --filter @jamiephan/casclib build
pnpm --filter @jamiephan/stormlib build
```

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @jamiephan/casclib test
pnpm --filter @jamiephan/stormlib test
```

## Development

### Project Structure

```
@jamiephan/
├── packages/
│   ├── casclib/
│   │   ├── src/           # C++ native binding source
│   │   ├── lib/           # TypeScript wrapper
│   │   ├── test/          # Unit tests
│   │   ├── binding.gyp    # node-gyp build config
│   │   └── package.json
│   └── stormlib/
│       ├── src/           # C++ native binding source
│       ├── lib/           # TypeScript wrapper
│       ├── test/          # Unit tests
│       ├── binding.gyp    # node-gyp build config
│       └── package.json
├── thirdparty/
│   ├── CascLib/          # CascLib submodule
│   └── StormLib/         # StormLib submodule
├── package.json          # Root package.json
├── pnpm-workspace.yaml   # Workspace configuration
└── tsconfig.json         # Shared TypeScript config
```

### Available Scripts

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm build

# Run tests for all packages
pnpm test

# Clean build artifacts
pnpm clean

# Rebuild native modules
pnpm rebuild

# Run a command in a specific package
pnpm --filter @jamiephan/casclib <command>
pnpm --filter @jamiephan/stormlib <command>
```

### Building Individual Packages

```bash
# Navigate to package directory
cd packages/casclib

# Rebuild native addon
node-gyp rebuild

# Build TypeScript
pnpm build

# Run tests
pnpm test
```

## Usage Examples

### Import Methods

Both packages support **CommonJS** and **ES Module** imports:

```javascript
// ES Module (recommended)
import { CascStorage } from '@jamiephan/casclib';
import { MpqArchive } from '@jamiephan/stormlib';

// CommonJS (backward compatible)
const { CascStorage } = require('@jamiephan/casclib');
const { MpqArchive } = require('@jamiephan/stormlib');
```

> 📚 **See [ESM_USAGE.md](./ESM_USAGE.md) for comprehensive examples and TypeScript usage**

### CascLib (CASC Storage)

```typescript
import { CascStorage } from '@jamiephan/casclib';

const storage = new CascStorage();
storage.open('/path/to/wow/Data');

if (storage.fileExists('Interface\\FrameXML\\UIParent.lua')) {
  const file = storage.openFile('Interface\\FrameXML\\UIParent.lua');
  const content = file.readAll();
  console.log(content.toString());
  file.close();
}

storage.close();
```

### StormLib (MPQ Archives)

```typescript
import { MpqArchive } from '@jamiephan/stormlib';

const archive = new MpqArchive();
archive.open('/path/to/war3.mpq');

if (archive.hasFile('war3map.j')) {
  const file = archive.openFile('war3map.j');
  const content = file.readAll();
  console.log(content.toString());
  file.close();
}

archive.close();
```

## Testing

The packages include comprehensive unit tests. To run tests with actual game files:

```bash
# Set environment variables for test files
export TEST_CASC_PATH=/path/to/wow/Data
export TEST_MPQ_PATH=/path/to/game.mpq

# Run tests
pnpm test
```

Note: Some tests will be skipped if test files are not available.

## Troubleshooting

### Build Errors

#### Missing Python
```bash
# Install Python 3
# Windows: Download from python.org
# Linux: sudo apt-get install python3
# macOS: brew install python3
```

#### Missing C++ Compiler
- **Windows**: Install Visual Studio Build Tools
- **Linux**: `sudo apt-get install build-essential`
- **macOS**: `xcode-select --install`

#### node-gyp Rebuild Fails
```bash
# Clear node-gyp cache
node-gyp clean

# Rebuild with verbose output
node-gyp rebuild --verbose
```

#### Missing zlib or bz2 (Linux/macOS)
```bash
# Ubuntu/Debian
sudo apt-get install zlib1g-dev libbz2-dev

# macOS
brew install zlib bzip2
```

### Runtime Errors

#### Cannot find module '../build/Release/casclib.node'
The native addon wasn't built. Run:
```bash
cd packages/casclib
node-gyp rebuild
```

#### CASC/MPQ Error: "Failed to open storage/archive"
- Verify the path is correct
- Ensure you have read permissions
- Check that the storage/archive is not corrupted

## Publishing

### Preparing for Publish

```bash
# Update version in package.json
cd packages/casclib
npm version patch  # or minor, major

# Build and test
pnpm rebuild
pnpm test

# Publish
npm publish --access public
```

### CI/CD

Consider setting up GitHub Actions for:
- Automated testing on push
- Building for multiple platforms (Windows, Linux, macOS)
- Automated publishing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT

## Credits

- [CascLib](https://github.com/ladislav-zezula/CascLib) by Ladislav Zezula
- [StormLib](https://github.com/ladislav-zezula/StormLib) by Ladislav Zezula

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/jamiephan/repository/issues)
- Documentation: See individual package READMEs
