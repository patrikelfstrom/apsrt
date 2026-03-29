import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAnalysisCache } from "../../src/core/analysisCache";
import { analyzeProjectSources } from "../../src/core/analyzeProjectSources";

const fixtureTsConfigPath = resolve(process.cwd(), "tsconfig.fixtures.json");
const sourceAnalysisFixturePath = resolve(
  process.cwd(),
  "test/fixtures/sourceAnalysisFixture.ts"
);
const mathUtilsFixturePath = resolve(process.cwd(), "test/fixtures/mathUtils.ts");
const nondeterministicFixturePath = resolve(
  process.cwd(),
  "test/fixtures/nondeterministicFixture.ts"
);
const ignoredVariableNondeterministicFixturePath = resolve(
  process.cwd(),
  "test/fixtures/ignoredVariableNondeterministicFixture.ts"
);
const nondeterministicFixtureTsConfigPath = resolve(
  process.cwd(),
  "tsconfig.nondeterministic-fixtures.json"
);
const multipleNondeterministicFixturePath = resolve(
  process.cwd(),
  "test/fixtures/multipleNondeterministicFixture.ts"
);
const multipleNondeterministicFixtureTsConfigPath = resolve(
  process.cwd(),
  "tsconfig.multiple-nondeterministic-fixtures.json"
);
const moduleLoadingFixturePath = resolve(
  process.cwd(),
  "test/fixtures/moduleLoading/components/triangleGrid.ts"
);
const moduleLoadingFixtureTsConfigPath = resolve(
  process.cwd(),
  "tsconfig.module-loading-fixtures.json"
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
        lineNumber: 1,
        columnNumber: 17,
        parameterTypes: ["string", "number"],
      },
      {
        name: "usesHiddenHelper",
        lineNumber: 15,
        columnNumber: 17,
        parameterTypes: ["string"],
      },
      {
        name: "exportedArrow",
        lineNumber: 5,
        columnNumber: 14,
        parameterTypes: ["boolean"],
      },
      {
        name: "exportedFunctionExpression",
        lineNumber: 7,
        columnNumber: 14,
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

  it("skips functions annotated with @apsrt-ignore", async () => {
    const [result] = await analyzeProjectSources([mathUtilsFixturePath], {
      tsConfigFilePath: fixtureTsConfigPath,
      cache: createAnalysisCache({ enabled: false }),
    });

    expect(
      result.analysis.functions.some(
        (functionAnalysis) => functionAnalysis.name === "randomNumber"
      )
    ).toBe(false);
  });

  it("skips exported variable functions annotated with @apsrt-ignore comments", async () => {
    const [result] = await analyzeProjectSources(
      [ignoredVariableNondeterministicFixturePath],
      {
        tsConfigFilePath: fixtureTsConfigPath,
        cache: createAnalysisCache({ enabled: false }),
      }
    );

    expect(result.analysis.functions).toEqual([]);
  });

  it("throws for likely nondeterministic functions without @apsrt-ignore", async () => {
    try {
      await analyzeProjectSources([nondeterministicFixturePath], {
        tsConfigFilePath: nondeterministicFixtureTsConfigPath,
        cache: createAnalysisCache({ enabled: false }),
      });
      expect.fail("Expected analyzeProjectSources to throw");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      expect(message).toContain("Likely nondeterministic function detected.");
      expect(message).toContain(
        "test/fixtures/nondeterministicFixture.ts:2:21 (Math.random())"
      );
      expect(message).toContain(
        "> 2 |   return Math.floor(Math.random() * (max - min + 1) + min);"
      );
      expect(message).toContain("  1 | export function unignoredRandomNumber");
      expect(message).toContain("    |                     ^");
      expect(message).toContain("Tip: Add @apsrt-ignore annotation.");
    }
  });

  it("reports all nondeterministic functions found in a file", async () => {
    try {
      await analyzeProjectSources([multipleNondeterministicFixturePath], {
        tsConfigFilePath: multipleNondeterministicFixtureTsConfigPath,
        cache: createAnalysisCache({ enabled: false }),
      });
      expect.fail("Expected analyzeProjectSources to throw");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      expect(message).toContain("Likely nondeterministic functions detected.");
      expect(message).toContain(
        "test/fixtures/multipleNondeterministicFixture.ts:2:14 (Math.random())"
      );
      expect(message).toContain(
        "test/fixtures/multipleNondeterministicFixture.ts:5:14 (Math.random())"
      );
      expect(message).toContain(
        "> 2 |   Math.floor(Math.random() * (max - min + 1) + min);"
      );
      expect(message).toContain(
        "> 5 |   Math.floor(Math.random() * (max - min + 1) + min);"
      );
      expect(message).toContain("Tip: Add @apsrt-ignore annotation.");
    }
  });

  it("loads user modules with TS-aware extensionless relative imports", async () => {
    const [result] = await analyzeProjectSources([moduleLoadingFixturePath], {
      tsConfigFilePath: moduleLoadingFixtureTsConfigPath,
      cache: createAnalysisCache({ enabled: false }),
    });

    expect(typeof result.moduleExports.getTriangleColor).toBe("function");
    expect(
      (result.moduleExports.getTriangleColor as () => string)()
    ).toBe("#ffd700");
    expect(
      (result.moduleExports.getTrianglePalette as () => string[])()
    ).toEqual(["#ffd700", "#ffd700"]);
  });
});
