import { describe, it, expect } from "vitest";
import fc from "fast-check";
import * as path from "path";
import { analyzeSourceFiles } from "./analyzeSourceFiles";
import { arbForType } from "./arbForType";
import { globbySync } from "globby";

const RANDOM_SEED = 12345;
const SAMPLES_PER_FUNCTION = 10;

const tsConfig = getTsConfig();

// Gather all .ts files (excluding test files)
const sourceFiles = globbySync(["**/*.ts", "!**/*.test.ts"], {
  cwd: SOURCE_DIR,
  absolute: true,
});

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
      it("matches snapshot", () => {
        const inputSamples = arbitrariesForParams.length
          ? fc.sample(fc.tuple(...arbitrariesForParams), {
              numRuns: SAMPLES_PER_FUNCTION,
              seed: RANDOM_SEED,
            })
          : fc.sample(fc.constant([]), {
              numRuns: SAMPLES_PER_FUNCTION,
              seed: RANDOM_SEED,
            });

        const testResults = inputSamples.map((inputArgs) => {
          try {
            const output = moduleExports[exportedFnName](...inputArgs);
            return { input: inputArgs, output };
          } catch (e: any) {
            return { input: inputArgs, error: e?.message ?? String(e) };
          }
        });

        expect(testResults).toMatchSnapshot();
      });
    });
  }
}
