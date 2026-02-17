# Development Container

This project includes a VS Code development container configuration for a consistent development environment.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Getting Started

1. Open this project in VS Code
2. Press `F1` and select **Dev Containers: Reopen in Container**
3. Wait for the container to build and start
4. The container will automatically run `pnpm install`

## What's Included

### Environment
- **Node.js 22** (latest LTS)
- **Python 3.11** (for node-gyp)
- **Build tools**: gcc, g++, make, cmake
- **pnpm** package manager
- **Zsh with Oh My Zsh**

### VS Code Extensions
- C/C++ Tools (for native module development)
- ESLint & Prettier (code formatting)
- Jest (testing)
- GitHub Copilot (if you have access)

## Building Native Modules

The container includes all necessary build tools for compiling native Node.js addons:

```bash
# Build a specific package
pnpm --filter @jamiephan/casclib rebuild

# Build all packages
pnpm rebuild

# Run tests
pnpm test
```

## Customization

Edit `.devcontainer/devcontainer.json` to:
- Add more VS Code extensions
- Change Node.js version
- Install additional system packages
- Customize shell environment

## Troubleshooting

### Container fails to start
- Ensure Docker Desktop is running
- Check Docker has enough resources (4GB+ RAM recommended)
- Try rebuilding: `F1` → **Dev Containers: Rebuild Container**

### Native modules fail to build
- The container includes all build tools, but if issues persist:
  ```bash
  sudo apt-get update
  sudo apt-get install -y build-essential python3 make g++
  ```

### Permission issues
- The container runs as user `node` (UID 1000)
- If you encounter permission errors, check file ownership

## Benefits

✅ **Consistent environment** - Same setup for all developers  
✅ **Isolated dependencies** - No conflicts with host system  
✅ **Pre-configured tools** - All build tools ready to go  
✅ **Cross-platform** - Works on Windows, macOS, and Linux  
✅ **Easy onboarding** - New developers can start immediately
