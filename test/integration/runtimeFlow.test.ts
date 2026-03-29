import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAnalysisCache } from "../../src/core/analysisCache";
import { collectRuntimeSnapshotResults } from "../../src/core/collectRuntimeSnapshotResults";

describe("runtime snapshot flow", () => {
  it("collects deterministic snapshot assertions from fixture sources", async () => {
    const snapshotResults = await collectRuntimeSnapshotResults({
      tsConfigFilePath: resolve(process.cwd(), "tsconfig.fixtures.json"),
      sampleCount: 3,
      randomSeed: 12345,
      cache: createAnalysisCache({ enabled: false }),
    });

    expect(snapshotResults).toMatchSnapshot();
  });
});
