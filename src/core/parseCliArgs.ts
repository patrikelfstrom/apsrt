import path from "node:path";
import type { RuntimeCliOptions } from "./types";

const HELP_TEXT = `APSRT

Usage:
  apsrt [--tsconfig path] [--update] [--watch]

Options:
  --tsconfig, -c  Path to a TypeScript config file relative to the current directory
  --update, -u    Update stored APSRT snapshots
  --watch, -w     Run Vitest in watch mode
  --help, -h      Show this help text
`;

export interface ParsedCliArgs {
  options: RuntimeCliOptions;
  shouldExit: boolean;
  exitCode: number;
  output?: string;
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const options: RuntimeCliOptions = {
    cwd: process.cwd(),
    updateSnapshots: false,
    watch: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      return {
        options,
        shouldExit: true,
        exitCode: 0,
        output: HELP_TEXT,
      };
    }

    if (argument === "--update" || argument === "-u") {
      options.updateSnapshots = true;
      continue;
    }

    if (argument === "--watch" || argument === "-w") {
      options.watch = true;
      continue;
    }

    if (argument === "--tsconfig" || argument === "-c") {
      const value = argv[index + 1];
      if (!value) {
        return {
          options,
          shouldExit: true,
          exitCode: 1,
          output: "Missing value for --tsconfig\n",
        };
      }

      options.tsConfigFilePath = path.resolve(options.cwd, value);
      index += 1;
      continue;
    }

    return {
      options,
      shouldExit: true,
      exitCode: 1,
      output: `Unknown argument: ${argument}\n`,
    };
  }

  return {
    options,
    shouldExit: false,
    exitCode: 0,
  };
}
