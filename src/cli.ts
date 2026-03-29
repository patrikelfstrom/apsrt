#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startVitest } from "vitest/node";
import { defineConfig } from "vitest/config";
import { parseCliArgs } from "./core/parseCliArgs";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const absoluteRuntimeTestPath = path.join(currentDirectory, "runtime.test.js");
const parsedCliArgs = parseCliArgs(process.argv.slice(2));

if (parsedCliArgs.output) {
  process.stdout.write(parsedCliArgs.output);
}

if (parsedCliArgs.shouldExit) {
  process.exit(parsedCliArgs.exitCode);
}

const { cwd, tsConfigFilePath, updateSnapshots, watch } = parsedCliArgs.options;
const snapshotDirectory = path.join(cwd, ".apsrt", "__snapshots__");

fs.mkdirSync(snapshotDirectory, { recursive: true });

process.env.APSRT_CWD = cwd;
if (tsConfigFilePath) {
  process.env.APSRT_TSCONFIG_PATH = tsConfigFilePath;
}

const vitestConfig = defineConfig({
  test: {
    include: [absoluteRuntimeTestPath],
    exclude: [],
    root: cwd,
    environment: "node",
    server: { deps: { inline: ["apsrt"] } },
    reporters: ["verbose"],
    silent: false,
    resolveSnapshotPath: () =>
      path.join(snapshotDirectory, "runtime.test.js.snap"),
  },
});

await startVitest(
  "test",
  [absoluteRuntimeTestPath],
  {
    watch,
    config: false,
    update: updateSnapshots,
  },
  vitestConfig
);
