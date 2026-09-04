import { describe, expect, it } from "vitest";
import { deriveTimelineState } from "@/lib/guides/timeline";

describe("deriveTimelineState", () => {
  it("marks the first spot as start", () => {
    expect(deriveTimelineState(0, 5)).toBe("start");
  });

  it("marks the last spot as finish", () => {
    expect(deriveTimelineState(4, 5)).toBe("finish");
  });

  it("marks middle spots as regular", () => {
    expect(deriveTimelineState(1, 5)).toBe("regular");
    expect(deriveTimelineState(2, 5)).toBe("regular");
    expect(deriveTimelineState(3, 5)).toBe("regular");
  });

  it("treats a single-spot itinerary as start", () => {
    expect(deriveTimelineState(0, 1)).toBe("start");
  });
});
