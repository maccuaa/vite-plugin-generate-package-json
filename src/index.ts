import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Plugin } from "vite";
import { OutputChunk } from "rollup";

interface PluginConfiguration {
  outputDir?: string;
}

interface Lock {
  version: string;
  resolved: string;
  integrity: string;
  dev?: boolean;
}

interface Dependency {
  [name: string]: string;
}

interface PackageJson {
  name: string;
  version: string;
  dependencies: Dependency;
  devDependencies?: Dependency;
}

interface PackageLockJson {
  name: string;
  version: string;
  lockfileVersion: number;
  requires: boolean;
  packages: {
    [name: string]: PackageJson | Lock;
  };
}

async function readPackageLockJson(folder: string, name: string): Promise<PackageLockJson> {
  const file = resolve(folder, name);
  try {
    const str = await readFile(file, { encoding: "utf8" });
    return JSON.parse(str) as PackageLockJson;
  } catch (e) {
    throw new Error(`Unable to save read file: ${file}. Error: ${e}`);
  }
}

async function writeJsonFile(folder: string, name: string, contents: string) {
  try {
    const destFile = resolve(folder, name);
    return await writeFile(destFile, contents, { encoding: "utf8" });
  } catch (e) {
    throw new Error(`Unable to save generated package.json file. Error: ${e}`);
  }
}

function normalizeImportModule(imports: string): string {
  if (!imports.includes("node_modules")) {
    return "";
  }

  const [, path] = imports.split("node_modules/");

  if (path.startsWith("@")) {
    const [namespace, name] = path.split("/");

    return `node_modules/${namespace}/${name}`;
  } else {
    const [name] = path.split("/");

    return `node_modules/${name}`;
  }
}

export const generatePackageJson = (options: PluginConfiguration = {}): Plugin => {
  const { outputDir = "build" } = options;
  return {
    name: "generate-package-json",
    enforce: "post",
    apply: "build",
    generateBundle: async (_, bundle) => {
      // Module ID: /home/andrew/eas/node_modules/@mui/material/Table/TableRow/index.js
      const moduleIds = new Set<string>();

      // Dependency: node_modules/@mui/material
      const dependencies = new Set<string>();

      // Get all the module IDs
      Object.values(bundle).forEach((c) => {
        const chunk = c as OutputChunk;

        chunk.moduleIds?.forEach((moduleId) => moduleIds.add(moduleId));
      }, moduleIds);

      // Normalize the module IDs into a list of unique dependencies
      Array.from(moduleIds).map((moduleId) => {
        const normalized = normalizeImportModule(moduleId);
        if (normalized.length) {
          dependencies.add(normalized);
        }
      });

      const packageLockJson = await readPackageLockJson(process.cwd(), "package-lock.json");

      const entries = Object.entries(packageLockJson.packages);

      const locks: Map<string, Lock> = new Map();
      const deps: Map<string, string> = new Map();

      Array.from(dependencies)
        .sort()
        .forEach((dep) => {
          const lockDep = entries.find(([key]) => key === dep);

          if (!lockDep) {
            throw new Error(`Unable to find ${dep} in package-lock.json`);
          }

          const [rawName, attributes] = lockDep as [string, Lock];

          const [, name] = rawName.split("node_modules/");

          const { version, resolved, integrity } = attributes;

          locks.set(rawName, {
            version,
            resolved,
            integrity,
            dev: false,
          });

          deps.set(name, version);
        });

      const outputPath = resolve(outputDir);

      try {
        await mkdir(outputPath);
      } catch (e) {
        // ignore
      }

      const newPackageJson: PackageJson = {
        name: packageLockJson.name,
        version: packageLockJson.version,
        dependencies: Object.fromEntries(deps),
      };

      await writeJsonFile(outputPath, "package.json", JSON.stringify(newPackageJson, null, 2));

      const packageJson = packageLockJson.packages[""] as PackageJson;

      const newPackageLock: PackageLockJson = {
        name: packageLockJson.name,
        version: packageLockJson.version,
        lockfileVersion: packageLockJson.lockfileVersion,
        requires: packageLockJson.requires,
        packages: {
          "": {
            name: packageJson.name,
            version: packageJson.version,
            dependencies: Object.fromEntries(deps),
            devDependencies: {},
          },
          ...Object.fromEntries(locks),
        },
      };

      await writeJsonFile(outputPath, "package-lock.json", JSON.stringify(newPackageLock, null, 2));
    },
  };
};
