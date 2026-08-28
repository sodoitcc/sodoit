import { describe, expect, it } from "vitest";
import { resolveCopyCountLabel } from "../../app/(app)/list/collections/provenance-display";

describe("resolveCopyCountLabel", () => {
  it("renders nothing when count is zero, null, or undefined", () => {
    expect(resolveCopyCountLabel(0)).toBeNull();
    expect(resolveCopyCountLabel(null)).toBeNull();
    expect(resolveCopyCountLabel(undefined)).toBeNull();
  });

  it("uses singular form for exactly one copy", () => {
    expect(resolveCopyCountLabel(1)).toBe("1 copy");
  });

  it("uses user-facing 'copies' language, not technical 'forks'", () => {
    expect(resolveCopyCountLabel(12)).toBe("12 copies");
  });
});
