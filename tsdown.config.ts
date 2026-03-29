import { defineConfig } from "tsdown";

// Build both the library entry (apsrt) and the CLI entry (cli)
export default defineConfig({
  entry: ["src/cli.ts", "src/apsrt.test.ts"],
  exports: true,
  outDir: "blablabla", // dist
});
