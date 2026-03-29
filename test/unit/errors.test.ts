import { describe, expect, it } from "vitest";
import {
  createLikelyNondeterministicFunctionError,
  formatApsrtUserError,
} from "../../src/core/errors";

describe("Apsrt user errors", () => {
  it("formats plain output for non-TTY environments", () => {
    const error = createLikelyNondeterministicFunctionError(
      [
        {
          label: "src/helpers/numbers.ts:1",
          context: [
            "  1 | export function random() {",
            "  2 |   return Math.random();",
            "    |          ^",
          ],
        },
      ]
    );

    expect(formatApsrtUserError(error, false)).toBe(
      "Likely nondeterministic function detected.\nsrc/helpers/numbers.ts:1\n  1 | export function random() {\n  2 |   return Math.random();\n    |          ^\nTip: Add @apsrt-ignore annotation."
    );
  });

  it("formats styled output for TTY environments", () => {
    const error = createLikelyNondeterministicFunctionError(
      [{ label: "src/helpers/numbers.ts:1" }]
    );

    const formatted = formatApsrtUserError(error, true);

    expect(formatted).toContain("ERROR");
    expect(formatted).toContain("src/helpers/numbers.ts:1");
    expect(formatted).toContain("Add @apsrt-ignore annotation.");
    expect(formatted).toContain("\u001B[31m");
  });

  it("formats multiple nondeterministic locations together", () => {
    const error = createLikelyNondeterministicFunctionError([
      { label: "src/helpers/numbers.ts:11" },
      { label: "src/helpers/numbers.ts:14" },
    ]);

    expect(formatApsrtUserError(error, false)).toBe(
      "Likely nondeterministic functions detected.\nsrc/helpers/numbers.ts:11\nsrc/helpers/numbers.ts:14\nTip: Add @apsrt-ignore annotation."
    );
  });
});
