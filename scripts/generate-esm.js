#!/usr/bin/env node

/**
 * Generate ESM (.mjs) wrappers for packages
 * This script creates ES module wrappers that import the CommonJS build
 */

const fs = require('fs');
const path = require('path');

// Determine which package we're building
const cwd = process.cwd();
const packageName = path.basename(cwd);
const distDir = path.join(cwd, 'dist');

console.log(`Generating ESM wrapper for ${packageName}...`);

// Read the CJS index to understand exports
const indexJsPath = path.join(distDir, 'index.js');
if (!fs.existsSync(indexJsPath)) {
  console.error('Error: dist/index.js not found. Run TypeScript build first.');
  process.exit(1);
}

// Create ESM wrapper for index.mjs
const esmWrapperContent = `// ESM wrapper for ${packageName}
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Import the CommonJS module
const cjs = require('./index.js');

// Re-export everything
export const {
  ${packageName === 'casclib' ? 'CascStorage, CascFile, Storage, File' : 'MpqArchive, MpqFile, Archive, File'}
} = cjs;

export default cjs.default || cjs;
`;

const indexMjsPath = path.join(distDir, 'index.mjs');
fs.writeFileSync(indexMjsPath, esmWrapperContent, 'utf8');

console.log(`✓ Created ${indexMjsPath}`);

// Create ESM wrapper for bindings.mjs
const bindingsEsmContent = `// ESM wrapper for bindings
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import the CommonJS module
const cjs = require('./bindings.js');

// Re-export everything
export default cjs.default || cjs;
`;

const bindingsMjsPath = path.join(distDir, 'bindings.mjs');
fs.writeFileSync(bindingsMjsPath, bindingsEsmContent, 'utf8');

console.log(`✓ Created ${bindingsMjsPath}`);

console.log(`\n✓ ESM wrappers generated successfully for ${packageName}!`);
console.log('\nUsage:');
console.log('  CommonJS: const { CascStorage } = require("@jamiephan/casclib");');
console.log('  ES Module: import { CascStorage } from "@jamiephan/casclib";');
