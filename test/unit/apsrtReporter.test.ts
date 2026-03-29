import { describe, expect, it } from "vitest";
import {
  buildApsrtReporterOutput,
  type ReportedRuntimeTest,
} from "../../src/core/apsrtReporter";

describe("ApsrtReporter", () => {
  it("prints passed tests even when a mismatch occurs", () => {
    const runtimeTests: ReportedRuntimeTest[] = [
      {
        filePath: "src/components/Triangles/triangleGrid.ts",
        lineNumber: "61",
        columnNumber: "17",
        functionName: "createTriangleGrid()",
        status: "passed",
      },
      {
        filePath: "src/helpers/colors.ts",
        lineNumber: "10",
        columnNumber: "14",
        functionName: "randomHslGenerator()",
        status: "failed",
      },
      {
        filePath: "src/helpers/colors.ts",
        lineNumber: "21",
        columnNumber: "14",
        functionName: "hslToHex()",
        status: "passed",
      },
    ];

    const report = buildApsrtReporterOutput(runtimeTests, {
      durationMs: 101,
      startTime: new Date(2026, 2, 29, 21, 26, 30),
      useColor: false,
    });

    expect(report.stdout).toBeNull();

    expect(report.stderr).toBe(
      [
        "✓ src/components/Triangles/triangleGrid.ts",
        "  ✓ createTriangleGrid()",
        "",
        "❯ src/helpers/colors.ts",
        "  ✓ hslToHex()",
        "  × randomHslGenerator()",
        "",
        "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯",
        "",
        "src/helpers/colors.ts:10:14 > randomHslGenerator() > Snapshot mismatch",
        "  Snapshot output changed for this function.",
        "",
        "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯",
        "",
        "✅ APSRT checked 3 exports.",
        "🚨 APSRT found 1 snapshot mismatch.",
        "Start at  21:26:30",
        "Duration  101ms",
        "",
        "Run `npx apsrt --update` if this change is expected.",
      ].join("\n")
    );
  });
});
