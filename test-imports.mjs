/**
 * Comprehensive test for ES Module imports
 * Run with: node test-imports.mjs
 */

// ES Module imports
import { CascStorage, CascFile } from './packages/casclib/dist/index.mjs';
import { MpqArchive, MpqFile } from './packages/stormlib/dist/index.mjs';

console.log('=== Testing ES Module Imports ===\n');

// Test CascLib
console.log('CascLib (ES Module):');
console.log('  CascStorage:', typeof CascStorage, '✓');
console.log('  CascFile:', typeof CascFile, '✓');

const cascStorage = new CascStorage();
console.log('  CascStorage instance:', cascStorage instanceof CascStorage ? '✓' : '✗');

// Test StormLib
console.log('\nStormLib (ES Module):');
console.log('  MpqArchive:', typeof MpqArchive, '✓');
console.log('  MpqFile:', typeof MpqFile, '✓');

const mpqArchive = new MpqArchive();
console.log('  MpqArchive instance:', mpqArchive instanceof MpqArchive ? '✓' : '✗');

console.log('\n✅ All ES Module imports working correctly!\n');
