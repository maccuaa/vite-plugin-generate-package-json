# Sample App

This is a demonstration project for [vite-plugin-generate-package-json](https://github.com/maccuaa/vite-plugin-generate-package-json).

## Overview

This sample app is a simple Vite + React application that includes the vite-plugin-generate-package-json plugin. It demonstrates how the plugin analyzes your production bundle and generates accurate `package.json` and `package-lock.json` files containing only the dependencies that are actually used.

## Features

- **Basic React App**: Simple counter application built with React 19
- **Plugin Integration**: Configured to use vite-plugin-generate-package-json
- **Dependency Analysis**: Includes both used (react, react-dom) and unused (axios) dependencies to demonstrate the plugin's filtering capability

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or bun

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

## What Happens During Build

When you run the build command:

1. Vite bundles your application
2. The plugin analyzes all modules included in the bundle
3. Two new files are generated in the `dist/` directory:
   - `package.json` - Contains only the dependencies found in your bundle
   - `package-lock.json` - Contains the corresponding lock file entries

### Expected Results

After building, check the generated `dist/package.json`. You'll notice:

- ✅ `react` and `react-dom` are included (they're imported and used)
- ❌ `axios` is NOT included (it's in dependencies but never imported)
- ❌ Dev dependencies are NOT included (they're not part of the production bundle)

This demonstrates how the plugin identifies the **actual** production dependencies versus what's declared in your `package.json`.

## Plugin Configuration

The plugin is configured in [vite.config.js](vite.config.js):

```javascript
import { generatePackageJson } from "vite-plugin-generate-package-json";

export default defineConfig({
  plugins: [react(), generatePackageJson()],
});
```

The generated files will be created in the `dist/` directory (Vite's default output directory).

## Use Cases

This sample demonstrates how the plugin helps with:

1. **Accurate SBOM Generation**: Get a true bill of materials for your production build
2. **Security Audits**: Only audit dependencies that are actually deployed
3. **Docker Optimization**: Use the generated `package.json` to install only production dependencies
4. **Dependency Analysis**: Identify unused dependencies in your project

## Learn More

- [Plugin Documentation](../README.md)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
