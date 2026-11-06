#!/usr/bin/env node
/**
 * Copies upstream C/C++ sources from the monorepo's `thirdparty/<Lib>` submodule
 * into the package's `deps/<Lib>` directory so the published tarball can be
 * compiled from source (e.g. Electron rebuilds, platforms without prebuilds).
 *
 * Usage (from a package directory): node ../../scripts/vendor-thirdparty.js <Lib>
 */
const fs = require('fs');
const path = require('path');

const lib = process.argv[2];
if (!lib) {
  console.error('Usage: vendor-thirdparty.js <CascLib|StormLib>');
  process.exit(1);
}

const pkgDir = process.cwd();
const srcRoot = path.resolve(__dirname, '..', 'thirdparty', lib);
const destRoot = path.join(pkgDir, 'deps', lib);

if (!fs.existsSync(path.join(srcRoot, 'src'))) {
  console.error(`Missing ${srcRoot}/src. Run: git submodule update --init --recursive`);
  process.exit(1);
}

fs.rmSync(destRoot, { recursive: true, force: true });
fs.mkdirSync(destRoot, { recursive: true });
fs.cpSync(path.join(srcRoot, 'src'), path.join(destRoot, 'src'), { recursive: true });
for (const file of ['LICENSE', 'README.md']) {
  const from = path.join(srcRoot, file);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(destRoot, file));
}

console.log(`Vendored ${lib} sources into ${path.relative(pkgDir, destRoot)}`);
