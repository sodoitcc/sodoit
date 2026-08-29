import { describe, expect, it } from "vitest";
import { isDefaultBrowseView } from "../../app/(app)/browse/browse-editorial";

const DEFAULT_PARAMS = {
  q: "",
  category: null,
  difficulty: null,
  status: "all" as const,
  sort: "recommended" as const,
};

describe("isDefaultBrowseView", () => {
  it("is true only when no search/filter/sort state is active", () => {
    expect(isDefaultBrowseView(DEFAULT_PARAMS)).toBe(true);
  });

  it.each([
    { ...DEFAULT_PARAMS, q: "japan" },
    { ...DEFAULT_PARAMS, category: "Food" },
    { ...DEFAULT_PARAMS, difficulty: "Easy" },
    { ...DEFAULT_PARAMS, status: "completed" as const },
    { ...DEFAULT_PARAMS, sort: "newest" as const },
  ])("is false when any filter is active: %j", (params) => {
    expect(isDefaultBrowseView(params)).toBe(false);
  });
});
