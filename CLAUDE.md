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

Toolchain: pnpm 8, Node ≥18 (CI/release uses Node 22). Windows needs VS build tools; Linux needs `build-essential`, `zlib1g-dev`, `libbz2-dev`; macOS needs Xcode CLT (`xcode-select --install`) — system zlib/bzip2 are linked for stormlib.

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
2. **TypeScript** (`tsc`): `lib/*.ts` → `dist/*.js` + `.d.ts`. Target ES2020, CommonJS, strict mode.
3. **ESM wrapper** (`scripts/generate-esm.js`): introspects exported names from `dist/index.js`, emits `dist/index.mjs` using `createRequire(import.meta.url)('./index.js')` and re-exports every named binding. `package.json` `exports` map routes `import` → `.mjs`, `require` → `.js`. Reason: `.node` addons are inherently CJS; this avoids dual compilation.

If you change exports in `lib/index.ts`, re-run `pnpm build` so `.mjs` regenerates — stale ESM wrappers cause silent missing exports.

## Two-layer API design

Each package exposes both layers from the same entry point:

- **High-level wrapper** (`lib/index.ts`): `Storage` / `Archive` / `File` classes with friendly camelCase methods (`storage.open()`, `archive.openFile()`).
- **Low-level bindings** (`lib/bindings.ts`): `CascStorageBinding` / `MPQArchiveBinding` instances exposing **exact upstream C++ function names** (`CascOpenStorage`, `SFileOpenArchive`, `CascGetFileSize64`). See `packages/*/BINDING_NAMING_CONVENTION.md`.

Rule when adding methods: native binding name = upstream C name (no case change, no prefix strip). Wrapper method = simplified camelCase. Helper methods that don't exist upstream (e.g., `fileExists`, `readFileAll`) use camelCase in both layers.

Adding a new native method requires four edits in lockstep:
1. `src/*.cpp` — implement `Napi::Value` method, register via `InstanceMethod()` in `Init()`.
2. `lib/bindings.ts` — declare on the interface.
3. `lib/index.ts` — wrap in friendly method.
4. `test/*.test.ts` — integration test.

## C++ binding conventions

- `NAPI_DISABLE_CPP_EXCEPTIONS` is set. Errors must be thrown via `Napi::Error::New(env, "...").ThrowAsJavaScriptException(); return env.Undefined();` — do not use `throw`.
- Native handles (storage/archive/file) require explicit `close()`. Wrappers do not auto-close; callers use `try/finally`.
- Platform conditionals in `binding.gyp`: Windows enables MSVC `ExceptionHandling=1` and defines `_WINDOWS`/`WIN32`; Linux uses `-std=c++17`; macOS uses libc++, deployment target 10.15. casclib bundles its own zlib (under `thirdparty/CascLib/src/zlib/`) and sets `Z_SOLO=1` on macOS.
- `CASCLIB_NO_AUTO_LINK_LIBRARY` prevents pragma-based linking on Windows.
- **stormlib on macOS**: `StormPort.h` auto-defines `__SYS_ZLIB` + `__SYS_BZLIB` on `__APPLE__`, so `StormCommon.h` includes `<zlib.h>` + `<bzlib.h>` (system headers). `binding.gyp` accordingly excludes bundled `zlib/*.c` + `bzip2/*.c` sources on mac and links `-lz -lbz2`. Don't re-add bundled sources to the mac branch — symbols will collide with system libs.

## Tests

Jest + ts-jest. Test files: `packages/*/test/*.test.ts`.

**casclib tests hit Blizzard CDN** — `*.online-storage.test.ts` connect to live TACT product endpoints (`hero`, `s2`, `agent`, `rtro`) and download into a temp cache. They are slow and network-dependent; CI runs them on every PR. Cleanup happens in `afterEach()`.

stormlib tests use local MPQ fixtures under `packages/stormlib/test/files/`.

## Release workflow

`.github/workflows/release.yml` — manual `workflow_dispatch` only, must run on `master`.

- Input `tag` must match `^(casclib|stormlib)/v[0-9]+\.[0-9]+\.[0-9]+(-.*)?$` (e.g. `casclib/v1.0.0`, `stormlib/v0.0.0-dev.3`).
- Input `npm_tag` is `latest` or `dev`.
- Validates tag doesn't exist, parses package + version, then matrix-builds prebuilds on Node 22 across: `ubuntu-latest` (linux x64), `ubuntu-24.04-arm` (linux arm64), `windows-latest` (win x64), `windows-11-arm` (win arm64).
- Publishes with `npm publish --provenance --access public --tag <npm_tag>` from a temporarily-bumped `package.json`, then commits the bump, creates the git tag, pushes, and creates a GitHub release. Comments on the 5 most recent merged PRs.
- **Versions are not bumped manually** — let the workflow do it. Don't tag locally.

`.github/workflows/pr-test.yml` matrix-tests the same 4 OS/arch combos × casclib + stormlib on every PR.

**macOS not in CI.** Native code is fully macOS-compatible (binding.gyp mac branch + system zlib/bzip2 links) and source builds work on Xcode CLT. Online-storage tests fail in GitHub Actions macOS runners because Blizzard's CDN port 1119 is not reachable from those runners' egress, producing `CascError=ERROR_FILE_NOT_FOUND` from empty CSV responses. No prebuilds shipped for mac — falls back to source build at install. If you have local mac hardware, run `pnpm rebuild && pnpm test` to verify changes.

## Files worth knowing

- `packages/*/binding.gyp` — source list, defines, platform conds. Edit when adding/removing upstream `.cpp` files.
- `packages/*/lib/bindings.ts` — raw N-API contract (TypeScript declarations of the C++ surface).
- `packages/*/lib/index.ts` — wrapper classes + JSDoc that drives the public API docs.
- `packages/stormlib/lib/constants.ts` — re-exported MPQ flags/locales/compression constants.
- `scripts/generate-esm.js` — ESM wrapper generator; runs per-package via `pnpm build`.
- `.github/copilot-instructions.md` — original detailed contributor guide; this file is the condensed operating manual.
