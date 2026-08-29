import { describe, expect, it } from "vitest";
import { emptyStateForFilter } from "../../app/(app)/feed/empty-state-copy";

describe("emptyStateForFilter", () => {
  it("gives All a general community-activity message", () => {
    expect(emptyStateForFilter("all").title).toBe("No community activity yet");
  });

  it("gives Completed a specific message about completed experiences", () => {
    expect(emptyStateForFilter("completed").title).toBe(
      "No completed experiences yet",
    );
  });

  it("gives Collections a specific message about public collections", () => {
    expect(emptyStateForFilter("collections").title).toBe(
      "No public collections yet",
    );
  });

  it("each filter gets a distinct, non-empty title and description", () => {
    for (const filter of ["all", "completed", "collections"] as const) {
      const copy = emptyStateForFilter(filter);
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.description.length).toBeGreaterThan(0);
    }
  });
});
