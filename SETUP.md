# Setup Guide

This guide will help you set up and build the native bindings for CascLib and StormLib.

## System Requirements

### Operating System
- Windows 10/11 (x64)
- Linux (Ubuntu 18.04+, Debian 10+, or similar)
- macOS 10.15+

### Software Requirements

1. **Node.js** (v18.0.0 or later)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **pnpm** (v8.0.0 or later)
   ```bash
   npm install -g pnpm
   # Verify: pnpm --version
   ```

3. **Python** (v3.6 or later)
   - Required by node-gyp
   - Download from: https://www.python.org/
   - Verify: `python --version` or `python3 --version`

4. **C++ Build Tools**
   - See platform-specific instructions below

## Platform-Specific Setup

### Windows

#### Option 1: Visual Studio (Recommended)
1. Download Visual Studio 2019 or later from: https://visualstudio.microsoft.com/
2. During installation, select "Desktop development with C++"
3. Install the following components:
   - MSVC v142 or later
   - Windows 10/11 SDK
   - C++ CMake tools

#### Option 2: Build Tools Only
```powershell
# Run as Administrator
npm install --global windows-build-tools
```

#### Verify Installation
```powershell
# Check if Visual Studio is detected
node-gyp configure
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt-get update

# Install build essentials
sudo apt-get install -y build-essential

# Install Python 3
sudo apt-get install -y python3 python3-pip

# Install required libraries
sudo apt-get install -y zlib1g-dev libbz2-dev

# Verify installation
gcc --version
g++ --version
python3 --version
```

### Linux (CentOS/RHEL/Fedora)

```bash
# Install development tools
sudo yum groupinstall 'Development Tools'

# Or on Fedora/newer RHEL
sudo dnf groupinstall 'Development Tools'

# Install Python 3
sudo yum install python3

# Install required libraries
sudo yum install zlib-devel bzip2-devel

# Verify installation
gcc --version
g++ --version
python3 --version
```

### macOS

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required libraries
brew install zlib bzip2 python

# Verify installation
gcc --version
python3 --version
```

## Building the Project

### Step 1: Clone and Setup

```bash
# Navigate to the project directory
cd z:\NodeJS\@jamiephan

# Initialize git submodules (if not already done)
git submodule update --init --recursive

# Install pnpm globally if needed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Step 2: Build Native Addons

```bash
# Build all packages
pnpm rebuild

# Or build individually
cd packages/casclib
node-gyp rebuild
cd ../stormlib
node-gyp rebuild
```

### Step 3: Build TypeScript

```bash
# From the root directory
pnpm build

# Or build individually
pnpm --filter @jamiephan/casclib build
pnpm --filter @jamiephan/stormlib build
```

### Step 4: Verify Installation

```bash
# Run tests
pnpm test

# Or test individually
pnpm --filter @jamiephan/casclib test
pnpm --filter @jamiephan/stormlib test
```

## Common Issues and Solutions

### Issue: Python not found

**Error:**
```
gyp ERR! find Python
gyp ERR! Could not find any Python installation to use
```

**Solution:**
```bash
# Set Python path explicitly
npm config set python /path/to/python3

# Or on Windows
npm config set python "C:\Python39\python.exe"

# Verify
npm config get python
```

### Issue: MSBuild not found (Windows)

**Error:**
```
gyp ERR! find VS
gyp ERR! find VS msvs_version not set from command line or npm config
```

**Solution:**
```powershell
# Set Visual Studio version
npm config set msvs_version 2019

# Or specify during build
node-gyp rebuild --msvs_version=2019
```

### Issue: Missing zlib or bz2 (Linux)

**Error:**
```
fatal error: zlib.h: No such file or directory
```

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install zlib1g-dev libbz2-dev

# CentOS/RHEL/Fedora
sudo yum install zlib-devel bzip2-devel
```

### Issue: Build fails with "Permission denied"

**Solution:**
```bash
# Make sure you have write permissions
sudo chown -R $USER:$USER .

# Or run with appropriate permissions
# (Not recommended) sudo pnpm install
```

### Issue: node-gyp version mismatch

**Error:**
```
gyp ERR! stack Error: Command failed: ...
```

**Solution:**
```bash
# Clear node-gyp cache
npx node-gyp clean

# Update node-gyp globally
npm install -g node-gyp@latest

# Rebuild
node-gyp rebuild
```

## Development Workflow

### Making Changes

```bash
# 1. Make changes to C++ source files
# packages/{casclib,stormlib}/src/*.cpp

# 2. Rebuild native addon
cd packages/casclib  # or stormlib
node-gyp rebuild

# 3. Make changes to TypeScript files
# packages/{casclib,stormlib}/lib/*.ts

# 4. Rebuild TypeScript
pnpm build

# 5. Run tests
pnpm test
```

### Debugging Native Code

#### Windows (Visual Studio)
```bash
# Build in debug mode
node-gyp rebuild --debug

# Attach Visual Studio debugger to node.exe process
```

#### Linux/macOS (GDB/LLDB)
```bash
# Build in debug mode
node-gyp rebuild --debug

# Debug with gdb
gdb --args node test/casclib.test.js

# Or with lldb (macOS)
lldb -- node test/casclib.test.js
```

### Testing with Real Game Files

```bash
# Set environment variables
export TEST_CASC_PATH="/path/to/wow/Data"
export TEST_MPQ_PATH="/path/to/war3.mpq"

# On Windows PowerShell
$env:TEST_CASC_PATH = "C:\Games\WoW\Data"
$env:TEST_MPQ_PATH = "C:\Games\War3\war3.mpq"

# Run tests
pnpm test
```

## Next Steps

- Read the [README.md](./README.md) for usage examples
- Check individual package documentation:
  - [CascLib README](./packages/casclib/README.md)
  - [StormLib README](./packages/stormlib/README.md)
- Review the test files for more examples:
  - [CascLib tests](./packages/casclib/test/casclib.test.ts)
  - [StormLib tests](./packages/stormlib/test/stormlib.test.ts)

## Getting Help

If you encounter issues:

1. Check this guide for common solutions
2. Review the error messages carefully
3. Search for similar issues on:
   - node-gyp issues: https://github.com/nodejs/node-gyp/issues
   - CascLib issues: https://github.com/ladislav-zezula/CascLib/issues
   - StormLib issues: https://github.com/ladislav-zezula/StormLib/issues
4. Create a new issue with:
   - Your operating system and version
   - Node.js version (`node --version`)
   - Full error message
   - Steps to reproduce
