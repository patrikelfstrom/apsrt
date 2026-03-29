import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAnalysisCache } from "../../src/core/analysisCache";
import { analyzeProjectSources } from "../../src/core/analyzeProjectSources";

const fixtureTsConfigPath = resolve(process.cwd(), "tsconfig.fixtures.json");
const sourceAnalysisFixturePath = resolve(
  process.cwd(),
  "test/fixtures/sourceAnalysisFixture.ts"
);

describe("analyzeProjectSources", () => {
  it("finds exported declarations, arrows, and function expressions", async () => {
    const [result] = await analyzeProjectSources([sourceAnalysisFixturePath], {
      tsConfigFilePath: fixtureTsConfigPath,
      cache: createAnalysisCache({ enabled: false }),
    });

    expect(result.analysis.functions).toEqual([
      {
        name: "exportedDeclaration",
        parameterTypes: ["string", "number"],
      },
      {
        name: "usesHiddenHelper",
        parameterTypes: ["string"],
      },
      {
        name: "exportedArrow",
        parameterTypes: ["boolean"],
      },
      {
        name: "exportedFunctionExpression",
        parameterTypes: ["string[]"],
      },
    ]);
  });

  it("skips non-exported helpers from the analysis", async () => {
    const [result] = await analyzeProjectSources([sourceAnalysisFixturePath], {
      tsConfigFilePath: fixtureTsConfigPath,
      cache: createAnalysisCache({ enabled: false }),
    });

    expect(
      result.analysis.functions.some(
        (functionAnalysis) => functionAnalysis.name === "hiddenHelper"
      )
    ).toBe(false);
  });
});
