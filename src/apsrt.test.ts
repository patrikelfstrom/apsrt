import { describe, it, expect } from "vitest";
import fc from "fast-check";
import * as path from "path";
import { analyzeSourceFiles } from "./analyzeSourceFiles";
import { arbForType } from "./arbForType";
import { getTsConfig } from "./getTsConfig";

const RANDOM_SEED = 12345;
const SAMPLES_PER_FUNCTION = 10;

const tsConfig = getTsConfig();

const sourceFiles = tsConfig.fileNames.filter(
  (fileName) =>
    fileName.endsWith(".ts") &&
    !fileName.endsWith(".test.ts") &&
    !fileName.endsWith("cli.ts")
);

const analyzedSourceFiles = await analyzeSourceFiles(sourceFiles);

for (const { sourceFilePath, analysis, moduleExports } of analyzedSourceFiles) {
  for (const exportedFn of analysis.functions) {
    const exportedFnName = exportedFn.name as keyof typeof moduleExports;
    const exportedParamTypes = exportedFn.paramTypes;
    const arbitrariesForParams = exportedParamTypes.map(arbForType);
    const testCaseTitle = `${path.basename(sourceFilePath)}\t${String(
      exportedFnName
    )}()`;

    describe(testCaseTitle, () => {
      it("matches snapshot", async () => {
        const inputSamples = arbitrariesForParams.length
          ? fc.sample(fc.tuple(...arbitrariesForParams), {
              numRuns: SAMPLES_PER_FUNCTION,
              seed: RANDOM_SEED,
            })
          : fc.sample(fc.constant([]), {
              numRuns: SAMPLES_PER_FUNCTION,
              seed: RANDOM_SEED,
            });

        const testResults = await Promise.all(
          inputSamples.map(async (inputArgs) => {
            try {
              const output = await moduleExports[exportedFnName](...inputArgs);
              return { input: inputArgs, output };
            } catch (e: any) {
              return { input: inputArgs, error: e?.message ?? String(e) };
            }
          })
        );

        expect(testResults).toMatchSnapshot();
      });
    });
  }
}
