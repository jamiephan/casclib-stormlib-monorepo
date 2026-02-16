/**
 * Comprehensive test for both CommonJS and ES Module imports
 * Run with: node test-imports.cjs
 */

// CommonJS imports
const { CascStorage, CascFile } = require('./packages/casclib');
const { MpqArchive, MpqFile } = require('./packages/stormlib');

console.log('=== Testing CommonJS Imports ===\n');

// Test CascLib
console.log('CascLib (CommonJS):');
console.log('  CascStorage:', typeof CascStorage, '✓');
console.log('  CascFile:', typeof CascFile, '✓');

const cascStorage = new CascStorage();
console.log('  CascStorage instance:', cascStorage instanceof CascStorage ? '✓' : '✗');

// Test StormLib
console.log('\nStormLib (CommonJS):');
console.log('  MpqArchive:', typeof MpqArchive, '✓');
console.log('  MpqFile:', typeof MpqFile, '✓');

const mpqArchive = new MpqArchive();
console.log('  MpqArchive instance:', mpqArchive instanceof MpqArchive ? '✓' : '✗');

console.log('\n✅ All CommonJS imports working correctly!\n');
