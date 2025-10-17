import { beforeAll, expect, it, setDefaultTimeout } from "bun:test";
import { $, file } from "bun";

// Set timeout to 60 seconds for npm install and build
setDefaultTimeout(60000);

// build the sample app
beforeAll(async () => {
  $.cwd("./sample");

  console.info("Cleaning...");
  await $`rm -rf node_modules dist build`;

  console.info("Installing dependencies...");
  await $`npm i`;

  console.info("Building sample app...");
  await $`npm run build`;
});

it("should generate a package.json", async () => {
  const { dependencies, devDependencies } = await file("./sample/build/package.json").json();

  // There should be no devDependencies
  expect(devDependencies).toBeUndefined();

  // package.json should only include modules actually used by the app
  expect(dependencies).toContainAllKeys(["react", "react-dom", "scheduler"]);
});

it("should generate a package-lock.json", async () => {
  // package-lock.json should be valid
  const shellOutput = await $`npm ci`.cwd("./sample/build");

  expect(shellOutput.exitCode).toBe(0);
});
