import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAnalysisCache } from "../../src/core/analysisCache";
import type { SourceFileAnalysis } from "../../src/core/types";

const tempDirectories: string[] = [];

function createTempWorkspace() {
  const workspaceRoot = mkdtempSync(join(tmpdir(), "apsrt-cache-"));
  tempDirectories.push(workspaceRoot);
  return workspaceRoot;
}

function createSourceFile(workspaceRoot: string, name = "example.ts") {
  const filePath = join(workspaceRoot, name);
  writeFileSync(filePath, "export const value = 1;\n", "utf8");
  return filePath;
}

afterEach(() => {
  while (tempDirectories.length > 0) {
    const directory = tempDirectories.pop();
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

describe("createAnalysisCache", () => {
  it("does nothing when caching is disabled", () => {
    const workspaceRoot = createTempWorkspace();
    const sourceFilePath = createSourceFile(workspaceRoot);
    const cache = createAnalysisCache({
      enabled: false,
      rootDir: workspaceRoot,
    });

    cache.set(sourceFilePath, { functions: [] });

    expect(cache.get(sourceFilePath)).toBeNull();
    expect(existsSync(cache.getCacheFilePath())).toBe(false);
  });

  it("returns a cache hit while the source mtime matches", () => {
    const workspaceRoot = createTempWorkspace();
    const sourceFilePath = createSourceFile(workspaceRoot);
    const cache = createAnalysisCache({
      enabled: true,
      rootDir: workspaceRoot,
    });
    const analysis: SourceFileAnalysis = {
      functions: [{ name: "value", lineNumber: 1, columnNumber: 14, parameterTypes: [] }],
    };

    cache.set(sourceFilePath, analysis);

    expect(cache.get(sourceFilePath)).toEqual(analysis);
  });

  it("treats changed source files as cache misses", async () => {
    const workspaceRoot = createTempWorkspace();
    const sourceFilePath = createSourceFile(workspaceRoot);
    const cache = createAnalysisCache({
      enabled: true,
      rootDir: workspaceRoot,
    });

    cache.set(sourceFilePath, { functions: [] });

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 20));
    writeFileSync(sourceFilePath, "export const value = 2;\n", "utf8");

    expect(cache.get(sourceFilePath)).toBeNull();
  });

  it("persists cache entries to disk for later instances", () => {
    const workspaceRoot = createTempWorkspace();
    const sourceFilePath = createSourceFile(workspaceRoot);
    const analysis: SourceFileAnalysis = {
      functions: [
        { name: "value", lineNumber: 1, columnNumber: 14, parameterTypes: ["number"] },
      ],
    };

    const firstCache = createAnalysisCache({
      enabled: true,
      rootDir: workspaceRoot,
    });
    firstCache.set(sourceFilePath, analysis);

    const secondCache = createAnalysisCache({
      enabled: true,
      rootDir: workspaceRoot,
    });

    expect(JSON.parse(readFileSync(firstCache.getCacheFilePath(), "utf8"))).toBeTruthy();
    expect(secondCache.get(sourceFilePath)).toEqual(analysis);
  });
});
