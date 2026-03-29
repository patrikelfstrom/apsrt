import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createArbitraryForType } from "../../src/core/createArbitraryForType";

describe("createArbitraryForType", () => {
  it("creates string samples for string types", () => {
    const samples = fc.sample(createArbitraryForType("string"), {
      numRuns: 5,
      seed: 123,
    });

    expect(samples.every((sample) => typeof sample === "string")).toBe(true);
  });

  it("creates boolean arrays for primitive array types", () => {
    const samples = fc.sample(createArbitraryForType("boolean[]"), {
      numRuns: 5,
      seed: 123,
    }) as boolean[][];

    expect(samples.every(Array.isArray)).toBe(true);
    expect(
      samples.every((sample) =>
        sample.every((value) => typeof value === "boolean")
      )
    ).toBe(true);
  });

  it("creates callable values for function signatures", () => {
    const [sampledFunction] = fc.sample(
      createArbitraryForType("(value: string) => boolean"),
      {
        numRuns: 1,
        seed: 123,
      }
    ) as Array<(value: string) => boolean>;

    expect(typeof sampledFunction).toBe("function");
    expect(typeof sampledFunction("abc")).toBe("boolean");
  });

  it("falls back to unknown-value generation for unsupported types", () => {
    const samples = fc.sample(createArbitraryForType("Map<string, number>"), {
      numRuns: 3,
      seed: 123,
    });

    expect(samples).toHaveLength(3);
  });
});
