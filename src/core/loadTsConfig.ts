import { dirname } from "node:path";
import {
  findConfigFile,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
  type ParsedCommandLine,
} from "typescript";
import type { TsConfigLookupOptions } from "./types";

export const findTsConfigPath = (options: TsConfigLookupOptions = {}) => {
  if (options.tsConfigFilePath) {
    return options.tsConfigFilePath;
  }

  const configName = options.configName ?? process.env.APSRT_TSCONFIG ?? "tsconfig.json";
  const cwd = options.cwd ?? process.cwd();
  const tsConfigPath = findConfigFile(cwd, sys.fileExists, configName);

  if (!tsConfigPath) {
    throw new Error(`Could not find ${configName}`);
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
