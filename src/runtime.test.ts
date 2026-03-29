import { describe, expect, it } from "vitest";
import { collectRuntimeSnapshotResults } from "./core/collectRuntimeSnapshotResults";

const runtimeSnapshotResults = await collectRuntimeSnapshotResults({
  cwd: process.env.APSRT_CWD,
  tsConfigFilePath: process.env.APSRT_TSCONFIG_PATH,
});

for (const runtimeSnapshotResult of runtimeSnapshotResults) {
  describe(runtimeSnapshotResult.title, () => {
    it("matches snapshot", () => {
      expect(runtimeSnapshotResult.assertions).toMatchSnapshot();
    });
  });
}
