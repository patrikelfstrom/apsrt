import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/cli.ts", "src/runtime.test.ts"],
  exports: true,
  outDir: "dist",
});
