#!/usr/bin/env node

/**
 * Installation script that uses prebuilt binaries if available,
 * otherwise falls back to building from source
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const platform = process.platform;
const arch = process.arch;
const nodeVersion = process.versions.node.split('.')[0];

// Determine package name from directory
const packageDir = process.cwd();
const packageName = path.basename(packageDir);

console.log(`Installing ${packageName}...`);
console.log(`Platform: ${platform}, Arch: ${arch}, Node: v${nodeVersion}`);

// Check if we're in development (git repository exists in parent directories)
function isInDevelopment() {
  let dir = packageDir;
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return true;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // reached root
    dir = parent;
  }
  return false;
}

const buildDir = path.join(packageDir, 'build', 'Release');
const outputPath = path.join(buildDir, `${packageName}.node`);

// Helper function to build from source
function buildFromSource() {
  // Clean build directory to avoid stale files
  const fullBuildDir = path.join(packageDir, 'build');
  if (fs.existsSync(fullBuildDir)) {
    console.log('Cleaning existing build directory...');
    fs.rmSync(fullBuildDir, { recursive: true, force: true });
  }
  
  // Configure and build
  console.log('Configuring native module...');
  execSync('npx node-gyp configure', { 
    stdio: 'inherit',
    cwd: packageDir
  });
  
  console.log('Building native module...');
  execSync('npx node-gyp build', { 
    stdio: 'inherit',
    cwd: packageDir
  });
}

// In development mode, always build from source
if (isInDevelopment()) {
  console.log('Development mode detected, building from source...');
  try {
    buildFromSource();
    console.log(`✓ ${packageName} built successfully from source`);
    process.exit(0);
  } catch (error) {
    console.error(`✗ Failed to build from source: ${error.message}`);
    process.exit(1);
  }
}

// Production mode - look for prebuild
const prebuildName = `${packageName}-${platform}-${arch}-node${nodeVersion}.node`;
const prebuildPath = path.join(packageDir, 'prebuilds', prebuildName);

// Check if prebuild exists
if (fs.existsSync(prebuildPath)) {
  console.log(`✓ Found prebuild: ${prebuildName}`);
  
  // Create build directory if it doesn't exist
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Copy prebuild to build directory
  try {
    fs.copyFileSync(prebuildPath, outputPath);
    console.log(`✓ Installed prebuild to ${outputPath}`);
    console.log(`✓ ${packageName} installed successfully (using prebuild)`);
    process.exit(0);
  } catch (error) {
    console.error(`✗ Failed to copy prebuild: ${error.message}`);
    console.log('Falling back to building from source...');
  }
} else {
  console.log(`No prebuild found for ${platform}-${arch}-node${nodeVersion}`);
  console.log('Building from source...');
}

// Fallback: Build from source
try {
  console.log('Building from source as fallback...');
  buildFromSource();
  console.log(`✓ ${packageName} built successfully from source`);
  process.exit(0);
} catch (error) {
  console.error(`✗ Failed to build from source: ${error.message}`);
  process.exit(1);
}
