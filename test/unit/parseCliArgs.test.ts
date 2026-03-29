import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../../src/core/parseCliArgs";

describe("parseCliArgs", () => {
  it("returns default runtime options when no flags are provided", () => {
    const result = parseCliArgs([]);

    expect(result.shouldExit).toBe(false);
    expect(result.options.updateSnapshots).toBe(false);
    expect(result.options.watch).toBe(false);
    expect(result.options.cwd).toBe(process.cwd());
  });

  it("parses tsconfig, update, and watch flags", () => {
    const result = parseCliArgs([
      "--tsconfig",
      "configs/tsconfig.app.json",
      "--update",
      "--watch",
    ]);

    expect(result.shouldExit).toBe(false);
    expect(result.options.tsConfigFilePath).toBe(
      `${process.cwd()}/configs/tsconfig.app.json`
    );
    expect(result.options.updateSnapshots).toBe(true);
    expect(result.options.watch).toBe(true);
  });

  it("returns help output without running the CLI", () => {
    const result = parseCliArgs(["--help"]);

    expect(result.shouldExit).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("Usage:");
  });

  it("returns an error for unknown arguments", () => {
    const result = parseCliArgs(["--wat"]);

    expect(result.shouldExit).toBe(true);
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Unknown argument");
  });
});
