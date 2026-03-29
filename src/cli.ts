#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { startVitest } from "vitest/node";
import { defineConfig } from "vitest/config";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const absoluteRuntimeTestPath = path.join(currentDirectory, "runtime.test.js");
const projectRoot = path.join(currentDirectory, "..");

const vitestConfig = defineConfig({
  test: {
    include: [absoluteRuntimeTestPath],
    root: projectRoot,
    environment: "node",
    server: { deps: { inline: ["apsrt"] } },
    reporters: ["verbose"],
    silent: false,
  },
});

await startVitest(
  "test",
  [absoluteRuntimeTestPath],
  {
    watch: false,
    config: false,
  },
  vitestConfig
);
