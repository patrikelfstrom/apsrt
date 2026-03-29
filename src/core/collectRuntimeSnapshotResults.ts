import { basename } from "node:path";
import fc from "fast-check";
import { analyzeProjectSources } from "./analyzeProjectSources";
import { createArbitraryForType } from "./createArbitraryForType";
import { loadTsConfig } from "./loadTsConfig";
import type { AnalyzeProjectSourcesOptions } from "./analyzeProjectSources";

export const DEFAULT_RANDOM_SEED = 12345;
export const DEFAULT_SAMPLES_PER_FUNCTION = 10;

export interface RuntimeSnapshotAssertion {
  input: unknown[];
  output?: unknown;
  error?: string;
}

export interface RuntimeSnapshotResult {
  title: string;
  assertions: RuntimeSnapshotAssertion[];
}

export interface CollectRuntimeSnapshotResultsOptions
  extends AnalyzeProjectSourcesOptions {
  sampleCount?: number;
  randomSeed?: number;
}

export const shouldIncludeRuntimeSourceFile = (filePath: string) =>
  filePath.endsWith(".ts") &&
  !filePath.endsWith(".test.ts") &&
  !filePath.endsWith("cli.ts");

export async function collectRuntimeSnapshotResults(
  options: CollectRuntimeSnapshotResultsOptions = {}
): Promise<RuntimeSnapshotResult[]> {
  const parsedTsConfig = loadTsConfig(options);
  const sourceFilePaths = parsedTsConfig.fileNames
    .filter(shouldIncludeRuntimeSourceFile)
    .sort((left, right) => left.localeCompare(right));

  const analyzedSources = await analyzeProjectSources(sourceFilePaths, options);
  const sampleCount = options.sampleCount ?? DEFAULT_SAMPLES_PER_FUNCTION;
  const randomSeed = options.randomSeed ?? DEFAULT_RANDOM_SEED;

  const results = await Promise.all(
    analyzedSources.flatMap(({ sourceFilePath, analysis, moduleExports }) =>
      analysis.functions.map(async ({ name, parameterTypes }) => {
        const callable = moduleExports[name];
        if (typeof callable !== "function") {
          throw new TypeError(
            `Expected export "${name}" from ${sourceFilePath} to be callable`
          );
        }

        const title = `${basename(sourceFilePath)}\t${name}()`;
        const argumentArbitraries = parameterTypes.map(createArbitraryForType);
        const sampledArguments = argumentArbitraries.length
          ? fc.sample(fc.tuple(...argumentArbitraries), {
              numRuns: sampleCount,
              seed: randomSeed,
            })
          : fc.sample(fc.constant([] as unknown[]), {
              numRuns: sampleCount,
              seed: randomSeed,
            });

        const assertions = await Promise.all(
          sampledArguments.map(async (input) => {
            try {
              const output = await (callable as (...args: unknown[]) => unknown)(
                ...input
              );
              return { input, output };
            } catch (error) {
              return {
                input,
                error:
                  error instanceof Error ? error.message : String(error),
              };
            }
          })
        );

        return {
          title,
          assertions,
        };
      })
    )
  );

  return results.sort((left, right) => left.title.localeCompare(right.title));
}
