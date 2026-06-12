# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

pnpm monorepo (`pnpm-workspace.yaml` → `packages/*`) shipping Node.js N-API bindings for two C++ archive libraries by Ladislav Zezula:

- `@jamiephan/casclib` — CASC storage (modern Blizzard: WoW, D3/D4, Overwatch, SC2, HotS, WC3 Reforged)
- `@jamiephan/stormlib` — MPQ archives (classic Blizzard)

Upstream C++ sources are git submodules at `thirdparty/CascLib` and `thirdparty/StormLib`. They are **compiled directly** by each package's `binding.gyp` (no prebuilt static lib) — every `.cpp` from upstream is listed explicitly.

## Setup

Submodules are required — without them the native build fails on missing `CascLib.h` / `StormLib.h`.

```bash
git submodule update --init --recursive   # if cloned without --recurse-submodules
pnpm install
pnpm rebuild   # node-gyp compile + tsc + ESM wrapper
```

Toolchain: pnpm 10 (version pinned via root `packageManager` field), Node ≥18 (CI/release uses Node 24). Windows needs VS build tools; Linux needs `build-essential`, `zlib1g-dev`, `libbz2-dev`; macOS needs Xcode CLT (`xcode-select --install`) — system zlib/bzip2 are linked for stormlib.

`.npmrc` sets `node-linker=hoisted` — pnpm flattens all deps into the root `node_modules` (npm/yarn style). No per-package `node_modules` directories. Don't switch to isolated linker without a reason; native addon resolution and `node -p "require('node-addon-api').include"` already work under hoisted layout.

## Common commands

Root-level (run from repo root, fan out to all packages via `pnpm -r`):

```bash
pnpm build           # tsc + generate-esm only (no native recompile)
pnpm rebuild         # node-gyp-build + tsc + ESM (use after touching src/*.cpp or binding.gyp)
pnpm test            # all packages
pnpm test:coverage   # with coverage
pnpm clean           # node-gyp clean + rimraf dist
```

Per-package (run from `packages/casclib/` or `packages/stormlib/`, or with `--filter`):

```bash
pnpm --filter @jamiephan/casclib test
pnpm --filter @jamiephan/stormlib test:coverage
pnpm --filter @jamiephan/casclib build
```

Single test file / test name (Jest via ts-jest):

```bash
cd packages/casclib
npx jest test/hero.online-storage.test.ts
npx jest -t "should open online storage"
```

Native-only rebuild (skip tsc):

```bash
cd packages/casclib
npx node-gyp rebuild
```

## Build pipeline (three stages)

1. **Native** (`node-gyp-build`, triggered by `install` script): compiles `src/*.cpp` + every upstream `.cpp` listed in `binding.gyp` into `build/Release/{casclib,stormlib}.node`. `prebuildify --napi --strip` produces redistributable binaries under `prebuilds/`. Runtime resolution uses `node-gyp-build` (loads prebuilt if matching arch/platform, otherwise compiles from source).
2. **TypeScript** (`tsc`): `lib/*.ts` → `dist/*.js` + `.d.ts`. Target ES2022, CommonJS, strict mode.
3. **ESM wrapper** (`scripts/generate-esm.js`): introspects exported names from `dist/index.js`, emits `dist/index.mjs` using `createRequire(import.meta.url)('./index.js')` and re-exports every named binding. `package.json` `exports` map routes `import` → `.mjs`, `require` → `.js`. Reason: `.node` addons are inherently CJS; this avoids dual compilation.

If you change exports in `lib/index.ts`, re-run `pnpm build` so `.mjs` regenerates — stale ESM wrappers cause silent missing exports.

## Two-layer API design

Each package exposes both layers from the same entry point (`lib/index.ts` only re-exports):

- **High-level wrapper** (`lib/storage.ts`+`lib/file.ts` for casclib, `lib/archive.ts`+`lib/file.ts` for stormlib): `Storage` / `Archive` / `File` classes with friendly camelCase methods, static factories that return opened handles (`Storage.open(...)`, `Archive.create(...)`), Promise-based async variants (`openAsync`, `readFileAsync`, `extractFileAsync`), lazy iteration (`storage.files(mask)`, `Symbol.iterator`), and `Symbol.dispose` support.
- **Low-level bindings** (`lib/bindings.ts`): `CascStorageBinding` / `MPQArchiveBinding` instances exposing **exact upstream C++ function names** (`CascOpenStorage`, `SFileOpenArchive`, `CascGetFileSize64`). See `packages/*/BINDING_NAMING_CONVENTION.md`.

Other TS modules per package: `lib/errors.ts` (`CascError`/`StormError` + `invoke`/`invokeAsync` translation helpers), `lib/constants.ts` (constants), `lib/dispose.ts` (`Symbol.dispose` polyfill).

Errors: the native layer attaches `code` (numeric, from `GetCascError`/`SErrGetLastError`) and `codeName` (e.g. `"ERROR_FILE_NOT_FOUND"`) to every thrown error/rejection. Wrapper methods route native calls through `invoke()`/`invokeAsync()`, which rethrow as `CascError`/`StormError`. Detection in `from()` is shape-based, not `instanceof Error` — native errors come from the real Node realm and fail `instanceof` under Jest's VM contexts.

Rule when adding methods: native binding name = upstream C name (no case change, no prefix strip). Wrapper method = simplified camelCase. Helper methods that don't exist upstream (e.g., `fileExists`, `readFileAll`, `openAsync`) use camelCase in both layers.

Adding a new native method requires four edits in lockstep:
1. `src/*.cpp` — implement `Napi::Value` method, register via `InstanceMethod()` in `Init()`.
2. `lib/bindings.ts` — declare on the interface.
3. `lib/storage.ts` / `lib/archive.ts` / `lib/file.ts` — wrap in friendly method via `invoke()`.
4. `test/*.test.ts` — integration test.

## C++ binding conventions

- `NAPI_DISABLE_CPP_EXCEPTIONS` is set. Library failures must be thrown via `ThrowCascError(env, msg)` / `ThrowStormError(env, msg)` (defined in `src/errors.cpp` — appends the error suffix and sets `code`/`codeName` props); plain `Napi::TypeError` for argument validation. Do not use C++ `throw`.
- Async methods use `Napi::AsyncWorker` subclasses defined in the same `.cpp` (e.g. `OpenStorageWorker`, `MpqReadAllWorker`). Pattern: worker holds a `Napi::Promise::Deferred` + `Napi::ObjectReference` on the receiver (keeps the JS object and native handle alive), captures the error code in `Execute()` (thread-safe), rejects with `MakeCascError`/`MakeStormError` in `OnError()`. Worker classes are `friend`s of the wrapped class to reach the raw handle.
- Native handles (storage/archive/file) require explicit `close()`. Wrappers do not auto-close; callers use `try/finally` or `using`. Don't interleave other operations on a handle while one of its async operations is pending.
- Platform conditionals in `binding.gyp`: Windows enables MSVC `ExceptionHandling=1` and defines `_WINDOWS`/`WIN32`; Linux uses `-std=c++17`; macOS uses libc++, deployment target 10.15. casclib bundles its own zlib (under `thirdparty/CascLib/src/zlib/`) on all platforms. Never define `Z_SOLO` for it: CascLib's `CascDecompress` passes NULL `zalloc`/`zfree`, and `Z_SOLO` removes zlib's default allocators, so every `inflateInit` fails and all decompression returns `ERROR_FILE_CORRUPT` (1004) at runtime while still building fine.
- `CASCLIB_NO_AUTO_LINK_LIBRARY` prevents pragma-based linking on Windows.
- **stormlib on macOS**: `StormPort.h` auto-defines `__SYS_ZLIB` + `__SYS_BZLIB` on `__APPLE__`, so `StormCommon.h` includes `<zlib.h>` + `<bzlib.h>` (system headers). `binding.gyp` accordingly excludes bundled `zlib/*.c` + `bzip2/*.c` sources on mac and links `-lz -lbz2`. Don't re-add bundled sources to the mac branch — symbols will collide with system libs.

## Tests

Jest + ts-jest. Test files: `packages/*/test/*.test.ts`.

**casclib tests hit Blizzard CDN** — `*.online-storage.test.ts` connect to live TACT product endpoints (`hero`, `s2`, `agent`, `rtro`) and download into a temp cache. They are slow and network-dependent; CI runs them on every PR. Cleanup happens in `afterEach()`.

stormlib tests use local MPQ fixtures under `packages/stormlib/test/files/`.

## Release workflow

`.github/workflows/release.yml` — manual `workflow_dispatch` only, must run on `master`.

- Input `tag` must match `^(casclib|stormlib)/v[0-9]+\.[0-9]+\.[0-9]+(-.*)?$` (e.g. `casclib/v1.0.0`, `stormlib/v0.0.0-dev.3`).
- Input `npm_tag` is `latest` or `dev`. Validation enforces consistency: prerelease versions must use `dev`, stable versions must use `latest`.
- Input `dry_run` (boolean): builds all platforms, verifies prebuilds, packs the tarball as an artifact — but does not publish, commit, tag, or release.
- Validates tag doesn't exist, parses package + version, then matrix-builds prebuilds on Node 24 across 6 targets: `ubuntu-latest` (linux x64), `ubuntu-24.04-arm` (linux arm64), `windows-latest` (win x64), `windows-11-arm` (win arm64), `macos-15-intel` (darwin x64), `macos-15` (darwin arm64).
- Before publish, verifies all 6 platform prebuild dirs contain a `.node` — a partial artifact download fails the run instead of shipping silently.
- Publishes with `npm publish --provenance --access public --tag <npm_tag>` (npm OIDC trusted publishing — no token secret) from a temporarily-bumped `package.json`, then commits the bump, creates the git tag, pushes, and creates a GitHub release. Comments only on PRs merged since the package's previous tag whose commits touched that package (parsed from squash-merge subjects).
- **Versions are not bumped manually** — let the workflow do it. Don't tag locally.

`.github/workflows/pr-test.yml` (workflow name "Test") matrix-tests the same 6 OS/arch combos × casclib + stormlib on every PR, push to `master`, and manual dispatch. PR runs cancel superseded runs via `concurrency`. pnpm version comes from the root `packageManager` field (pnpm/action-setup reads it); pnpm store is cached via setup-node.

`.github/dependabot.yml` keeps GitHub Actions (weekly, grouped), npm deps (monthly), and the upstream submodules (monthly) updated.

## Files worth knowing

- `packages/*/binding.gyp` — source list, defines, platform conds. Edit when adding/removing upstream `.cpp` files.
- `packages/*/lib/bindings.ts` — raw N-API contract (TypeScript declarations of the C++ surface) + native loader.
- `packages/casclib/lib/storage.ts`, `packages/stormlib/lib/archive.ts`, `packages/*/lib/file.ts` — wrapper classes + JSDoc that drives the public API docs.
- `packages/*/lib/errors.ts` — `CascError`/`StormError` and native-error translation.
- `packages/*/lib/constants.ts` — constants (casclib re-exports from the native addon; stormlib hardcodes MPQ flags/locales/compression).
- `packages/*/src/errors.cpp` — `ThrowCascError`/`ThrowStormError`, `MakeCascError`/`MakeStormError`, error-name tables.
- `scripts/generate-esm.js` — ESM wrapper generator; runs per-package via `pnpm build`.
- `.github/copilot-instructions.md` — original detailed contributor guide; this file is the condensed operating manual.
