# Quick Reference Guide

## Project Overview

This monorepo contains two native Node.js binding packages:

- **@jamiephan/casclib**: Bindings for CascLib (CASC storage from modern Blizzard games)
- **@jamiephan/stormlib**: Bindings for StormLib (MPQ archives from classic Blizzard games)

## Quick Commands

### Installation
```bash
pnpm install          # Install all dependencies
```

### Building
```bash
pnpm rebuild          # Rebuild all native modules and TypeScript
pnpm build            # Build TypeScript only
pnpm clean            # Clean build artifacts
```

### Testing
```bash
pnpm test             # Run all tests
pnpm --filter @jamiephan/casclib test    # Test CascLib only
pnpm --filter @jamiephan/stormlib test   # Test StormLib only
```

### Package-Specific Commands
```bash
# Work on a specific package
pnpm --filter @jamiephan/casclib <command>
pnpm --filter @jamiephan/stormlib <command>

# Examples:
pnpm --filter @jamiephan/casclib rebuild
pnpm --filter @jamiephan/stormlib test
```

## API Quick Reference

### CascLib

```typescript
import { CascStorage } from '@jamiephan/casclib';

// Open storage
const storage = new CascStorage();
storage.open('/path/to/Data');

// Check file
storage.fileExists('filename')          // boolean
storage.getFileInfo('filename')         // { name, size } | null

// Read file
const file = storage.openFile('filename');
file.readAll()                          // Buffer
file.read(bytesToRead)                  // Buffer
file.getSize()                          // number
file.getPosition()                      // number
file.setPosition(position)              // number
file.close()                            // boolean

// Close storage
storage.close();
```

### StormLib

```typescript
import { MpqArchive } from '@jamiephan/stormlib';

// Open or create archive
const archive = new MpqArchive();
archive.open('/path/to/archive.mpq');
archive.create('/path/to/new.mpq', { maxFileCount: 1000 });

// File operations
archive.hasFile('filename')             // boolean
archive.extractFile('src', 'dest')      // boolean
archive.addFile('src', 'archive-name')  // boolean
archive.removeFile('filename')          // boolean
archive.renameFile('old', 'new')        // boolean

// Read file
const file = archive.openFile('filename');
file.readAll()                          // Buffer
file.read(bytesToRead)                  // Buffer
file.getSize()                          // number
file.getPosition()                      // number
file.setPosition(position)              // number
file.close()                            // boolean

// Archive operations
archive.compact()                       // boolean
archive.getMaxFileCount()               // number
archive.close()                         // boolean
```

## File Structure

```
@jamiephan/
├── packages/
│   ├── casclib/
│   │   ├── src/              # C++ bindings
│   │   │   ├── addon.cpp     # Entry point
│   │   │   ├── storage.cpp   # Storage operations
│   │   │   └── file.cpp      # File operations
│   │   ├── lib/              # TypeScript wrappers
│   │   │   ├── index.ts      # Main export
│   │   │   └── bindings.ts   # Native binding types
│   │   ├── test/             # Unit tests
│   │   ├── binding.gyp       # Build configuration
│   │   └── package.json
│   └── stormlib/
│       ├── src/              # C++ bindings
│       │   ├── addon.cpp     # Entry point
│       │   ├── archive.cpp   # Archive operations
│       │   └── file.cpp      # File operations
│       ├── lib/              # TypeScript wrappers
│       │   ├── index.ts      # Main export
│       │   └── bindings.ts   # Native binding types
│       ├── test/             # Unit tests
│       ├── binding.gyp       # Build configuration
│       └── package.json
└── thirdparty/
    ├── CascLib/              # Git submodule
    └── StormLib/             # Git submodule
```

## Development Workflow

### 1. Making Changes

**C++ Changes:**
```bash
cd packages/casclib  # or stormlib
# Edit src/*.cpp files
node-gyp rebuild
pnpm test
```

**TypeScript Changes:**
```bash
cd packages/casclib  # or stormlib
# Edit lib/*.ts files
pnpm build
pnpm test
```

### 2. Debugging

**JavaScript/TypeScript:**
```bash
# Use VS Code debugger (F5) or:
node --inspect-brk node_modules/.bin/jest --runInBand
```

**Native Code:**
```bash
# Build in debug mode
node-gyp rebuild --debug

# Windows: Attach Visual Studio debugger
# Linux: gdb --args node test.js
# macOS: lldb -- node test.js
```

### 3. Testing with Real Files

```bash
# Set environment variables
export TEST_CASC_PATH="/path/to/wow/Data"
export TEST_MPQ_PATH="/path/to/war3.mpq"

# Windows PowerShell:
$env:TEST_CASC_PATH = "C:\Games\WoW\Data"
$env:TEST_MPQ_PATH = "C:\Games\War3\war3.mpq"

# Run tests
pnpm test
```

## Common Build Issues

| Issue | Solution |
|-------|----------|
| Python not found | `npm config set python /path/to/python3` |
| MSBuild not found (Windows) | Install Visual Studio Build Tools |
| Missing zlib/bz2 (Linux) | `sudo apt-get install zlib1g-dev libbz2-dev` |
| Permission denied | `sudo chown -R $USER:$USER .` |
| node-gyp fails | `npx node-gyp clean && node-gyp rebuild --verbose` |

## Publishing Checklist

- [ ] Update version in package.json
- [ ] Run `pnpm rebuild` to ensure clean build
- [ ] Run `pnpm test` to verify all tests pass
- [ ] Update CHANGELOG.md (if exists)
- [ ] Commit changes
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push with tags: `git push --tags`
- [ ] Publish: `npm publish --access public`

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `TEST_CASC_PATH` | Path for CascLib tests | `/path/to/wow/Data` |
| `TEST_MPQ_PATH` | Path for StormLib tests | `/path/to/game.mpq` |
| `npm_config_python` | Python path for node-gyp | `/usr/bin/python3` |
| `npm_config_msvs_version` | Visual Studio version | `2019` |

## IDE Configuration

### VS Code Recommended Extensions
- C/C++ (ms-vscode.cpptools)
- CMake Tools (ms-vscode.cmake-tools)
- Prettier (esbenp.prettier-vscode)
- ESLint (dbaeumer.vscode-eslint)
- Jest (orta.vscode-jest)

### VS Code Settings (Optional)
See [SETUP.md](./SETUP.md) for recommended VS Code settings.

## Useful Links

- [node-gyp Documentation](https://github.com/nodejs/node-gyp)
- [Node-API Documentation](https://nodejs.org/api/n-api.html)
- [node-addon-api Documentation](https://github.com/nodejs/node-addon-api)
- [CascLib GitHub](https://github.com/ladislav-zezula/CascLib)
- [StormLib GitHub](https://github.com/ladislav-zezula/StormLib)
- [pnpm Workspace Documentation](https://pnpm.io/workspaces)

## Support

- **Issues**: Create an issue on GitHub
- **Documentation**: See [README.md](./README.md) and [SETUP.md](./SETUP.md)
- **Examples**: Check test files in `packages/*/test/`
