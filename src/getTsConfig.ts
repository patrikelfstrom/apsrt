import { dirname } from "path";
import {
  findConfigFile,
  parseJsonConfigFileContent,
  readConfigFile,
  sys,
  type ParsedCommandLine,
} from "typescript";

export const getTsConfig = (): ParsedCommandLine => {
  const tsconfigPath = getTsConfigFilePath();
  const tsconfigFile = readConfigFile(tsconfigPath, sys.readFile);

  const parsedTsconfig = parseJsonConfigFileContent(
    tsconfigFile.config,
    sys,
    dirname(tsconfigPath)
  );

  return parsedTsconfig;
};

export const getTsConfigFilePath = () => {
  const configName = process.env.TYPESCRIPT_CONFIG_NAME || "tsconfig.json";
  const tsconfigPath = findConfigFile(
    process.cwd(),
    sys.fileExists,
    configName
  );

  if (!tsconfigPath) {
    throw Error(`Could not find ${configName}`);
  }

  return tsconfigPath;
};
