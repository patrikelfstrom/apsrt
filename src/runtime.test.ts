import { describe, expect, it } from "vitest";
import { collectRuntimeSnapshotResults } from "./core/collectRuntimeSnapshotResults";

const runtimeSnapshotResults = await collectRuntimeSnapshotResults();

for (const runtimeSnapshotResult of runtimeSnapshotResults) {
  describe(runtimeSnapshotResult.title, () => {
    it("matches snapshot", () => {
      expect(runtimeSnapshotResult.assertions).toMatchSnapshot();
    });
  });
}
