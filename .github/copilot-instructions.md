# Copilot Instructions for casclib-stormlib-monorepo

## Project Overview

This is a **pnpm monorepo** containing native Node.js bindings for two C++ libraries that read Blizzard game archives:
- `@jamiephan/casclib` - Modern CASC (Content Addressable Storage Container) archives
- `@jamiephan/stormlib` - Legacy MPQ (Mo'PaQ) archives

Both packages wrap third-party C++ libraries via **Node-API (N-API)** bindings.

## Architecture

### Monorepo Structure
```
packages/
  casclib/          # Native addon for CascLib
    lib/            # TypeScript wrapper API
    src/            # C++ N-API bindings
    binding.gyp     # node-gyp build configuration
  stormlib/         # Native addon for StormLib
    lib/            # TypeScript wrapper API
    src/            # C++ N-API bindings
    binding.gyp     # node-gyp build configuration
thirdparty/
  CascLib/          # Git submodule - C++ library sources
  StormLib/         # Git submodule - C++ library sources
```

### Build Process (Critical!)

The build happens in **three stages**:

1. **Native Compilation**: `node-gyp-build` compiles C++ → `.node` binaries
   - Each `binding.gyp` includes BOTH wrapper code (`src/*.cpp`) AND third-party library sources (`../../thirdparty/*/src/*.cpp`)
   - Uses N-API for ABI stability across Node versions

2. **TypeScript Compilation**: `tsc` → `dist/index.js` + `dist/bindings.js`
   - `lib/bindings.ts` loads `.node` binary via `node-gyp-build()`
   - `lib/index.ts` wraps raw bindings with friendly class APIs

### Module System Design

**Intentional dual-format strategy**:
- Native bindings compile once to CommonJS (`.node` files are inherently CJS)
- TypeScript wraps bindings in CJS format (`dist/index.js`)
- `package.json` exports map both formats via conditional exports

**Why not native ESM?** Native addons require CommonJS `require()` - ESM wrappers bridge the gap.

## Development Workflows

### First-Time Setup
```bash
git clone --recurse-submodules https://github.com/jamiephan/casclib-stormlib-monorepo.git
pnpm install
pnpm rebuild  # Compiles native addons + TypeScript
```

**Critical**: Always use `--recurse-submodules` - third-party C++ code lives in git submodules.

### Making Changes

**TypeScript API changes** (lib/\*.ts):
```bash
pnpm build  # Just TypeScript + ESM wrapper
```

**Native binding changes** (src/\*.cpp, binding.gyp):
```bash
pnpm rebuild  # Full recompile
```

**When to recompile**:
- Changed C++ code in `src/` or `binding.gyp`
- Updated git submodules in `thirdparty/`
- Switched Node versions
- **Don't recompile** for pure TypeScript changes

**Documentation updates**:
- Always check if README.md needs updates when adding/changing public APIs
- Update package README ([packages/casclib/README.md](packages/casclib/README.md), [packages/stormlib/README.md](packages/stormlib/README.md)) with new methods, examples, or changed behavior
- Update TypeScript JSDoc comments in `lib/index.ts` for API documentation
- Consider updating root README.md for major feature additions

### Testing

```bash
pnpm test                # All packages
pnpm test:coverage       # With coverage reports
pnpm -r --filter casclib test  # Single package
```

**Test conventions**:
- Jest with `ts-jest` preset
- Tests in `test/*.test.ts`
- **casclib tests** download from Blizzard CDN (`*hero*us` = Heroes of the Storm US server)
- Tests create temp directories - cleanup in `afterEach()`
- Focus on integration testing (end-to-end bindings), not unit testing C++ internals

**What to test**:
- **Happy paths**: Normal operation with valid inputs (open storage, read files, check existence)
- **Error handling**: Invalid paths, non-existent files, malformed data - expect exceptions
- **Resource lifecycle**: Open → use → close patterns, verify cleanup works correctly
- **Edge cases**: Empty files, large files, chunked reading, file positioning
- **API contracts**: Return types, buffer handling, method chaining where applicable

**Test structure**:
- Group related tests with `describe()` blocks (e.g., "CascStorageOnlineStorage")
- Use descriptive test names that explain the behavior being tested
- Set up clean instances in `beforeEach()`, tear down in `afterEach()`
- Add console.log for debugging values when tests verify actual game data

### Common Issues

**Build fails with "Cannot find CascLib.h"**
→ Git submodules not initialized: `git submodule update --init --recursive`

**Import errors after changes**
→ Forgot to run build: `pnpm build` (TypeScript) or `pnpm rebuild` (native)

**Platform-specific build issues**
→ Check [.github/workflows/build.yml](.github/workflows/release.yml) for required system dependencies

## Code Patterns

### Adding New Native Methods

1. **C++ side** (e.g., `src/storage.cpp`):
```cpp
Napi::Value CascStorage::MethodName(const Napi::CallbackInfo& info) {
  // Validate arguments
  if (!info[0].IsString()) {
    Napi::TypeError::New(env, "Expected string").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  // Call CascLib C API
  HANDLE handle;
  if (!CascOpenStorage(...)) {
    Napi::Error::New(env, "Failed").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  
  return Napi::Boolean::New(env, true);
}

// Register in Init()
InstanceMethod("methodName", &CascStorage::MethodName)
```

2. **TypeScript bindings** (`lib/bindings.ts`):
```typescript
export interface Storage {
  methodName(arg: string): boolean;
}
```

3. **Wrapper API** (`lib/index.ts`):
```typescript
methodName(arg: string): boolean {
  return this.storage.methodName(arg);
}
```

4. **Add test** (`test/*.test.ts`):
```typescript
it("should methodName correctly", () => {
  storage.open(TEST_PATH);
  expect(storage.methodName("test")).toBe(true);
});
```

5. **Update documentation** (`README.md`):
- Add method to API Reference section with parameters, return types, and examples
- Include JSDoc comments in TypeScript wrapper for IDE tooltips
- Update usage examples if introducing new patterns

### Error Handling Pattern

Native bindings throw JS exceptions via N-API:
```cpp
Napi::Error::New(env, "Descriptive error message").ThrowAsJavaScriptException();
```

TypeScript wrappers let exceptions propagate (no try-catch unless adding value).

### Resource Management

Native resources (handles) require explicit cleanup:
```typescript
const storage = new CascStorage();
try {
  storage.open('/path');
  // ... operations ...
} finally {
  storage.close();  // Always clean up!
}
```

Pattern: Classes with `open()` need `close()`. Document in method JSDoc.

## CI/CD Notes

**Multi-platform testing**: [.github/workflows/build.yml](.github/workflows/build.yml) tests on Linux/Windows × Node 22

**Platform-specific dependencies**:
- Linux: `build-essential`, `zlib1g-dev`, `libbz2-dev`
- Windows: Visual Studio build tools (via node-gyp)

**Prebuild binaries**: Uses `prebuildify` to generate prebuilt `.node` files for common platforms (see `npm run prebuild`). Published packages install without compiling on supported platforms.

## Key Files

- [packages/\*/binding.gyp](packages/casclib/binding.gyp) - Native build config (includes third-party sources)
- [packages/\*/lib/bindings.ts](packages/casclib/lib/bindings.ts) - Raw N-API interface definitions
- [packages/\*/lib/index.ts](packages/casclib/lib/index.ts) - User-facing wrapper classes
- [.github/workflows/build.yml](.github/workflows/build.yml) - Multi-platform CI configuration

## External Dependencies

- **CascLib/StormLib**: Ladislav Zezula's C++ libraries (git submodules)
- **node-addon-api**: C++ N-API wrapper (compile-time dependency)
- **node-gyp-build**: Runtime binary loader (production dependency)
- **prebuildify**: Generates prebuilt binaries for distribution

## Conventions

- **Package scripts**: Use `pnpm -r` (recursive) for monorepo-wide commands
- **Versioning**: Both packages share version (`0.0.0-dev.0` = pre-release)
- **TypeScript**: Target ES2020, CommonJS output, strict mode
- **Naming**: Native classes prefixed (`CascStorage`, `MpqArchive`), internal bindings unprefixed (`Storage`, `Archive`)
- **Exports**: Default export is the main class, named exports for all public APIs
