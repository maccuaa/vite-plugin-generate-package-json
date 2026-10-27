# AGENTS.md

## Project Overview

**vite-plugin-generate-package-json** is a Vite plugin that generates a `package.json` and `package-lock.json` file containing only the packages that are actually imported and used in your final production bundle.

### Purpose

This plugin solves the problem of miscategorized dependencies in NPM projects. Many libraries incorrectly categorize their dependencies (using `dependency` instead of `devDependency`), which leads to:

- Bloated SBOM (Software Bill of Materials) reports
- False positives in NPM security audits
- Confusion about which libraries are actually used in production

By analyzing the Vite bundle, this plugin creates accurate package files that reflect only the dependencies that are truly included in your production build.

## Project Structure

```
vite-plugin-generate-package-json/
├── src/
│   └── index.ts              # Main plugin implementation
├── test/
│   └── index.test.ts         # Test suite
├── sample/                   # Example project demonstrating plugin usage
│   ├── vite.config.js
│   ├── src/
│   └── public/
├── package.json              # Project metadata and dependencies
├── tsconfig.json             # TypeScript configuration
├── bunfig.toml               # Bun configuration (formatter and import sorting)
├── biome.json                # Biome configuration (linting only)
├── .bun-version              # Pinned Bun version used by CI
└── README.md                 # User-facing documentation
```

## Technical Architecture

### Core Functionality

The plugin is implemented as a Vite plugin with the following characteristics:

- **Enforcement**: `post` - Runs after other plugins
- **Apply**: `build` - Only runs during build (not dev mode)
- **Hook**: `generateBundle` - Analyzes the final bundle before output

### Algorithm

1. **Module Collection**: Iterates through all chunks in the Vite bundle and collects module IDs
2. **Normalization**: Converts module paths to normalized dependency names (e.g., `/path/to/node_modules/@mui/material/Table/index.js` → `node_modules/@mui/material`)
3. **Lock File Parsing**: Reads the project's `package-lock.json` to extract version, resolved URL, and integrity hash for each dependency
4. **Output Generation**: Creates new `package.json` and `package-lock.json` files with only the used dependencies

### Key Functions

- `normalizeImportModule(imports: string)`: Extracts the package name from a full module path, handling both scoped (@namespace/package) and regular packages
- `readPackageLockJson(folder: string, name: string)`: Reads and parses the package-lock.json file
- `writeJsonFile(folder: string, name: string, contents: string)`: Writes JSON files to the output directory
- `generatePackageJson(options?: PluginConfiguration)`: Main plugin factory function

## Configuration

### Plugin Options

- `outputDir` (optional): Directory where generated files will be written
  - Type: `string`
  - Default: `"build"`

### Example Usage

```js
import { defineConfig } from "vite";
import { generatePackageJson } from "vite-plugin-generate-package-json";

export default defineConfig({
  build: {
    outDir: "build",
  },
  plugins: [
    generatePackageJson({
      outputDir: "dist",
    }),
  ],
});
```

## Development

### Technology Stack

- **Runtime**: Node.js >=18.0.0
- **Build Tool**: Bun (version pinned in `.bun-version`)
- **Language**: TypeScript
- **Type Checking**: Bun (`bun check`, `bun build --check`)
- **Formatting**: Bun (`bun fmt`, which also sorts imports)
- **Linting**: Biome (lint rules only)
- **Package Manager**: npm (peer dependency on Vite)

### Build Process

The project uses a two-step build process:

1. `bun build --check` type-checks the code and compiles TypeScript to JavaScript
2. TypeScript compiler generates type definitions (`tsc --noCheck`), because Bun can't emit `.d.ts` files

### Scripts

- `bun run build`: Type-checks the code, builds the plugin and generates type definitions
- `bun run clean`: Removes build artifacts and sample project dependencies
- `bun run lint`: Checks formatting (`bun fmt --check`) and lints with Biome
- `bun run fix`: Formats with `bun fmt` and applies safe Biome lint fixes

`bun check` (type-checks `src/`) and `bun fmt` are Bun built-ins. Don't add `check` or `fmt` scripts to `package.json`: a script with the same name runs instead of the built-in.

Formatter settings live in the `[fmt]` section of `bunfig.toml`. `CHANGELOG.md` is excluded because Release Please generates it.

### Dependencies

**Peer Dependencies:**

- `vite`: ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0

**Dev Dependencies:**

- `@biomejs/biome`: Linter (formatting and import sorting are handled by `bun fmt`)
- `@tsconfig/node-lts`: TypeScript configuration for Node.js LTS
- `@types/bun`: Type definitions for Bun (used to type-check the tests)
- `typescript`: TypeScript compiler (used by `tsc` to emit type definitions)
- `vite`: Vite bundler (for development)

## Testing

The project includes a test suite in `test/index.test.ts`. A sample project is provided in the `sample/` directory to demonstrate and test the plugin's functionality. The tests use the built plugin, so run `bun run build` first, then `bun test --check` (as CI does), which type-checks the tests before running them.

## Use Cases

### When to Use This Plugin

1. **Security Scanning**: When you need accurate vulnerability scans that only include production dependencies
2. **SBOM Generation**: When generating Software Bill of Materials for compliance or audit purposes
3. **Dependency Analysis**: When you want to understand which dependencies are actually used vs declared
4. **Bundle Optimization**: When verifying that unused dependencies aren't included in production

### When NOT to Use This Plugin

- Development environments (the plugin only runs during build)
- Projects without a `package-lock.json` file
- Non-Vite projects

## Common Patterns

### Integration with CI/CD

```js
// vite.config.production.js
export default defineConfig({
  build: {
    outDir: "dist",
  },
  plugins: [
    generatePackageJson({
      outputDir: "dist",
    }),
  ],
});
```

### Docker Optimization

The generated `package.json` can be used in Docker builds to only install production dependencies:

```dockerfile
COPY dist/package.json ./
RUN npm ci --production
```

## Limitations and Considerations

1. **Requires package-lock.json**: The plugin depends on `package-lock.json` for dependency metadata
2. **Build-time Only**: Only runs during Vite build, not during dev server
3. **NPM-specific**: Currently designed for NPM package-lock.json format
4. **Static Analysis**: Analyzes bundle output, so dynamic imports are included if they're in the bundle

## Contributing

This project uses:

- GitHub for version control and issue tracking
- Release Please for automated versioning and changelog generation
- Renovate for automated dependency updates (including the Bun version in `.bun-version`)

## License

MIT License - See LICENSE file for details

## Maintainer

Andrew MacCuaig <andrewmaccuaig@gmail.com>

## Repository

https://github.com/maccuaa/vite-plugin-generate-package-json
