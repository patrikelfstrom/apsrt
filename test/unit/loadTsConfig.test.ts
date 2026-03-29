import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findTsConfigPath, loadTsConfig } from "../../src/core/loadTsConfig";

const tempDirectories: string[] = [];
const originalConfigEnv = process.env.APSRT_TSCONFIG;

function createTempProject() {
  const projectRoot = mkdtempSync(join(tmpdir(), "apsrt-load-config-"));
  tempDirectories.push(projectRoot);

  mkdirSync(join(projectRoot, "src"));
  writeFileSync(
    join(projectRoot, "src/example.ts"),
    "export const value = 1;\n",
    "utf8"
  );

  return projectRoot;
}

afterEach(() => {
  if (originalConfigEnv === undefined) {
    delete process.env.APSRT_TSCONFIG;
  } else {
    process.env.APSRT_TSCONFIG = originalConfigEnv;
  }

  while (tempDirectories.length > 0) {
    const directory = tempDirectories.pop();
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

describe("loadTsConfig", () => {
  it("loads tsconfig.json by default", () => {
    const projectRoot = createTempProject();
    const tsConfigPath = join(projectRoot, "tsconfig.json");

    writeFileSync(
      tsConfigPath,
      JSON.stringify({ include: ["src/**/*.ts"] }, null, 2),
      "utf8"
    );

    const parsedTsConfig = loadTsConfig({ cwd: projectRoot });

    expect(findTsConfigPath({ cwd: projectRoot })).toBe(tsConfigPath);
    expect(parsedTsConfig.fileNames).toContain(join(projectRoot, "src/example.ts"));
  });

  it("uses APSRT_TSCONFIG when present", () => {
    const projectRoot = createTempProject();
    const customConfigPath = join(projectRoot, "tsconfig.fixtures.json");

    writeFileSync(
      customConfigPath,
      JSON.stringify({ include: ["src/**/*.ts"] }, null, 2),
      "utf8"
    );

    process.env.APSRT_TSCONFIG = "tsconfig.fixtures.json";

    expect(findTsConfigPath({ cwd: projectRoot })).toBe(customConfigPath);
  });

  it("throws when the requested config file does not exist", () => {
    const projectRoot = createTempProject();

    expect(() =>
      findTsConfigPath({
        cwd: projectRoot,
        configName: "missing.json",
      })
    ).toThrowError(
      `Could not find missing.json in ${projectRoot} or any parent directory.`
    );
  });

  it("suggests descendant configs when running from a workspace root", () => {
    const projectRoot = createTempProject();
    const packageRoot = join(projectRoot, "packages", "web");

    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(
      join(packageRoot, "tsconfig.json"),
      JSON.stringify({ include: ["src/**/*.ts"] }, null, 2),
      "utf8"
    );

    try {
      findTsConfigPath({ cwd: projectRoot });
      expect.fail("Expected findTsConfigPath to throw");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      expect(message).toContain(
        `Could not find tsconfig.json in ${projectRoot} or any parent directory.`
      );
      expect(message).toContain(
        "Found matching tsconfig.json files below the current directory:"
      );
      expect(message).toContain("- packages/web/tsconfig.json");
      expect(message).toContain(
        "Run APSRT from the package you want to analyze, or pass --tsconfig with the matching config path."
      );
    }
  });
});
