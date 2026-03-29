#!/usr/bin/env node

import { startVitest } from "vitest/node";
import { defineConfig } from "vitest/config";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const absoluteRuntimeTestPath = path.join(__dirname, "apsrt.test.js");
const projectRoot = path.join(__dirname, "..");

const vitestConfig = defineConfig({
  test: {
    include: [absoluteRuntimeTestPath],
    // exclude: ["**/node_modules/**"], // allow node_modules
    // ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*']
    root: projectRoot,
    environment: "node",
    server: { deps: { inline: ["apsrt"] } },
    reporters: ["verbose"],
    silent: false,

    // resolveSnapshotPath: (testPath, snapExt) =>
    //   path.join(
    //     projectRoot,
    //     ".apsrt",
    //     "tests",
    //     "snapshots",
    //     path.basename(testPath) + snapExt
    //   ),
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
