# casclib-stormlib-monorepo

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jamiephan/casclib-stormlib-monorepo/release.yml?logo=github)
[![NPM Version](https://img.shields.io/npm/v/%40jamiephan%2Fcasclib?logo=npm&label=%40jamiephan%2Fcasclib)](https://www.npmjs.com/package/@jamiephan/casclib)
[![NPM Version](https://img.shields.io/npm/v/%40jamiephan%2Fstormlib?logo=npm&label=%40jamiephan%2Fstormlib)](https://www.npmjs.com/package/@jamiephan/stormlib)

A monorepo containing Node.js native bindings for [**CascLib**](https://github.com/ladislav-zezula/CascLib) and [**StormLib**](https://github.com/ladislav-zezula/StormLib) - libraries for reading and writing Blizzard game archives.

## 📦 Packages

- **[@jamiephan/casclib](https://www.npmjs.com/package/@jamiephan/casclib)** - Native bindings for CascLib (CASC storage from modern Blizzard games) 
  - [./packages/casclib](./packages/casclib)
- **[@jamiephan/stormlib](https://www.npmjs.com/package/@jamiephan/stormlib)** - Native bindings for StormLib (MPQ archives from classic Blizzard games) 
  - [./packages/stormlib](./packages/stormlib)

## Command Line

Both packages include CLIs that can be run as a `npx` command.

```bash
npx @jamiephan/casclib --help
npx @jamiephan/stormlib --help
```

See the [CASC CLI reference](packages/casclib/README.md#command-line) and
[MPQ CLI reference](packages/stormlib/README.md#command-line) for options and examples.

## 📄 License

MIT

## Credits

- [CascLib](https://github.com/ladislav-zezula/CascLib) by Ladislav Zezula
- [StormLib](https://github.com/ladislav-zezula/StormLib) by Ladislav Zezula

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/jamiephan/casclib-stormlib-monorepo/issues)
- Documentation: See individual package READMEs
