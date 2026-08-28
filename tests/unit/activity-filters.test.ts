import { describe, expect, it } from "vitest";
import { VISIBLE_ACTIVITY_FILTERS } from "../../components/feed/ActivityFilters";

describe("VISIBLE_ACTIVITY_FILTERS", () => {
  it("keeps All, Completed, and Collections", () => {
    expect(VISIBLE_ACTIVITY_FILTERS).toEqual([
      "all",
      "completed",
      "collections",
    ]);
  });

  it("no longer offers a standalone Added to list filter", () => {
    expect(VISIBLE_ACTIVITY_FILTERS).not.toContain("added_to_list");
  });
});
