import type { Reporter, TestCase, TestModule, TestSpecification } from "vitest/node";

const ANSI = {
  reset: "\u001B[0m",
  red: "\u001B[31m",
  green: "\u001B[32m",
  dim: "\u001B[2m",
} as const;

export interface ReportedRuntimeTest {
  filePath: string;
  lineNumber: string;
  columnNumber: string;
  functionName: string;
  status: "passed" | "failed";
}

export interface ApsrtReporterOutputOptions {
  durationMs: number;
  startTime: Date;
  useColor: boolean;
}

export class ApsrtReporter implements Reporter {
  private startedAt = new Date();

  onTestRunStart(_specifications: ReadonlyArray<TestSpecification>) {
    this.startedAt = new Date();
  }

  onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
    const runtimeTests = collectReportedRuntimeTests(testModules);
    const report = buildApsrtReporterOutput(runtimeTests, {
      durationMs: Date.now() - this.startedAt.getTime(),
      startTime: this.startedAt,
      useColor: Boolean(process.stderr.isTTY),
    });

    if (report.stdout) {
      process.stdout.write(`${report.stdout}\n`);
    }

    if (report.stderr) {
      process.stderr.write(`${report.stderr}\n`);
    }
  }
}

export function buildApsrtReporterOutput(
  runtimeTests: ReportedRuntimeTest[],
  options: ApsrtReporterOutputOptions
) {
  const failedTests = runtimeTests.filter((testCase) => testCase.status === "failed");
  const lines = [
    ...formatOverviewSection(runtimeTests, options.useColor),
    "",
    ...(failedTests.length > 0
      ? [
          formatFailureDivider(failedTests.length, options.useColor),
          "",
          ...formatFailureDetails(failedTests, options.useColor),
          "",
          formatFailureDivider(failedTests.length, options.useColor),
          "",
        ]
      : []),
    ...formatSummaryLines(runtimeTests.length, failedTests.length, options),
  ];

  const output = lines.join("\n");

  if (failedTests.length > 0) {
    return {
      stdout: null,
      stderr: output,
    };
  }

  return {
    stdout: output,
    stderr: null,
  };
}

function collectReportedRuntimeTests(testModules: ReadonlyArray<TestModule>) {
  return testModules.flatMap((testModule) =>
    Array.from(testModule.children.allTests()).flatMap((testCase) => {
      const state = testCase.result().state;

      if (state !== "passed" && state !== "failed") {
        return [];
      }

      return {
        ...getRuntimeLabel(testCase),
        status: state,
      };
    })
  );
}

function getRuntimeLabel(testCase: TestCase) {
  const runtimeSuiteName =
    testCase.parent.type === "suite" ? testCase.parent.name : testCase.name;
  const [filePath, lineNumber, columnNumber, functionName] = runtimeSuiteName.split(
    "\t"
  );

  return {
    filePath: filePath ?? runtimeSuiteName,
    lineNumber: lineNumber ?? "?",
    columnNumber: columnNumber ?? "?",
    functionName: functionName ?? runtimeSuiteName,
  };
}

function formatOverviewSection(
  runtimeTests: ReportedRuntimeTest[],
  useColor: boolean
) {
  const groupedTests = groupTestsByFile(runtimeTests);

  return groupedTests.flatMap(([filePath, fileTests], fileIndex) => {
    const hasFailures = fileTests.some((testCase) => testCase.status === "failed");
    const headerSymbol = hasFailures ? "❯" : colorGreen("✓", useColor);
    const orderedFileTests = [...fileTests].sort((left, right) =>
      left.status === right.status ? 0 : left.status === "passed" ? -1 : 1
    );
    const block = [
      `${headerSymbol} ${filePath}`,
      ...orderedFileTests.map((testCase) =>
        formatOverviewTestLine(testCase, useColor)
      ),
    ];

    if (fileIndex < groupedTests.length - 1) {
      block.push("");
    }

    return block;
  });
}

function formatOverviewTestLine(
  testCase: ReportedRuntimeTest,
  useColor: boolean
) {
  if (testCase.status === "failed") {
    return colorRed(`  × ${testCase.functionName}`, useColor);
  }

  return `  ${colorGreen("✓", useColor)} ${testCase.functionName}`;
}

function formatFailureDetails(
  failedTests: ReportedRuntimeTest[],
  useColor: boolean
) {
  return failedTests.flatMap((testCase, index) => {
    const block = [
      `${testCase.filePath}:${testCase.lineNumber}:${testCase.columnNumber} > ${testCase.functionName} > Snapshot mismatch`,
      "  Snapshot output changed for this function.",
    ];

    if (index < failedTests.length - 1) {
      block.push("");
    }

    return block.map((line) => colorRed(line, useColor));
  });
}

function formatFailureDivider(failedTestCount: number, useColor: boolean) {
  const divider = `${"⎯".repeat(29)} Failed Tests ${failedTestCount} ${"⎯".repeat(
    29
  )}`;
  return colorRed(divider, useColor);
}

function formatSummaryLines(
  checkedTestsCount: number,
  failedTestsCount: number,
  options: ApsrtReporterOutputOptions
) {
  const lines = [
    `✅ APSRT checked ${checkedTestsCount} export${checkedTestsCount === 1 ? "" : "s"}.`,
  ];

  if (failedTestsCount > 0) {
    lines.push(
      colorRed(
        `🚨 APSRT found ${failedTestsCount} snapshot mismatch${failedTestsCount === 1 ? "" : "es"}.`,
        options.useColor
      )
    );
  }

  lines.push(
    `${colorDim("Start at", options.useColor)}  ${formatStartTime(options.startTime)}`,
    `${colorDim("Duration", options.useColor)}  ${options.durationMs}ms`
  );

  if (failedTestsCount > 0) {
    lines.push("", "Run `npx apsrt --update` if this change is expected.");
  }

  return lines;
}

function groupTestsByFile(testCases: ReportedRuntimeTest[]) {
  const groupedTests = new Map<string, ReportedRuntimeTest[]>();

  for (const testCase of testCases) {
    const existingGroup = groupedTests.get(testCase.filePath) ?? [];
    existingGroup.push(testCase);
    groupedTests.set(testCase.filePath, existingGroup);
  }

  return Array.from(groupedTests.entries());
}

function formatStartTime(startTime: Date) {
  return startTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function colorGreen(value: string, useColor: boolean) {
  return useColor ? `${ANSI.green}${value}${ANSI.reset}` : value;
}

function colorRed(value: string, useColor: boolean) {
  return useColor ? `${ANSI.red}${value}${ANSI.reset}` : value;
}

function colorDim(value: string, useColor: boolean) {
  return useColor ? `${ANSI.dim}${value}${ANSI.reset}` : value;
}
