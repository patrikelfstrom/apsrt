import { readdirSync, type Dirent } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import {
  findConfigFile,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
  type ParsedCommandLine,
} from "typescript";
import { ApsrtUserError } from "./errors";
import type { TsConfigLookupOptions } from "./types";

const IGNORED_CONFIG_SEARCH_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".next",
  ".nuxt",
  ".pnpm",
  ".turbo",
  ".yarn",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
]);
const MAX_DESCENDANT_CONFIG_MATCHES = 5;
const MAX_DESCENDANT_DIRECTORIES_TO_SCAN = 2_000;

export const findTsConfigPath = (options: TsConfigLookupOptions = {}) => {
  if (options.tsConfigFilePath) {
    return options.tsConfigFilePath;
  }

  const configName = options.configName ?? process.env.APSRT_TSCONFIG ?? "tsconfig.json";
  const cwd = options.cwd ?? process.cwd();
  const tsConfigPath = findConfigFile(cwd, sys.fileExists, configName);

  if (!tsConfigPath) {
    throw createMissingTsConfigError(cwd, configName);
  }

  return tsConfigPath;
};

export const loadTsConfig = (
  options: TsConfigLookupOptions = {}
): ParsedCommandLine => {
  const tsConfigPath = findTsConfigPath(options);
  const tsconfigFile = readConfigFile(tsConfigPath, sys.readFile);

  const parsedTsconfig = parseJsonConfigFileContent(
    tsconfigFile.config,
    sys,
    dirname(tsConfigPath)
  );

  return parsedTsconfig;
};

function createMissingTsConfigError(cwd: string, configName: string) {
  const descendantConfigPaths = findDescendantConfigPaths(cwd, configName);
  const title = `Could not find ${configName} in ${cwd} or any parent directory.`;

  if (descendantConfigPaths.length > 0) {
    const locations = [
      descendantConfigPaths.length === MAX_DESCENDANT_CONFIG_MATCHES
        ? `Found matching ${configName} files below the current directory (showing up to ${MAX_DESCENDANT_CONFIG_MATCHES}):`
        : `Found matching ${configName} files below the current directory:`,
      ...descendantConfigPaths.map((configPath) => `- ${relative(cwd, configPath)}`),
    ];

    return new ApsrtUserError({
      title,
      locations: locations.map((label) => ({ label })),
      hint: "Run APSRT from the package you want to analyze, or pass --tsconfig with the matching config path.",
    });
  }

  return new ApsrtUserError({
    title,
    hint: "Pass --tsconfig with the config path you want APSRT to use.",
  });
}

function findDescendantConfigPaths(cwd: string, configName: string) {
  const directories = [cwd];
  const matches: string[] = [];
  let scannedDirectoryCount = 0;

  while (
    directories.length > 0 &&
    matches.length < MAX_DESCENDANT_CONFIG_MATCHES &&
    scannedDirectoryCount < MAX_DESCENDANT_DIRECTORIES_TO_SCAN
  ) {
    const directory = directories.shift();
    if (!directory) {
      break;
    }

    scannedDirectoryCount += 1;

    let entries: Dirent[];
    try {
      entries = readdirSync(directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.isFile() && entry.name === configName) {
        matches.push(resolve(directory, entry.name));
        if (matches.length >= MAX_DESCENDANT_CONFIG_MATCHES) {
          break;
        }
      }
    }

    for (const entry of entries) {
      if (
        !entry.isDirectory() ||
        IGNORED_CONFIG_SEARCH_DIRECTORIES.has(entry.name)
      ) {
        continue;
      }

      directories.push(resolve(directory, entry.name));
    }
  }

  return matches.sort((left, right) => left.localeCompare(right));
}
