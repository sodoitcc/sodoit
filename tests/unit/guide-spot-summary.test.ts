import { describe, expect, it } from "vitest";
import { hasBriefingContent, spotPreviewLine } from "@/lib/guides/spot-summary";

describe("spotPreviewLine", () => {
  it("returns null for missing description", () => {
    expect(spotPreviewLine(null)).toBeNull();
  });

  it("returns short descriptions unchanged", () => {
    expect(spotPreviewLine("Great coffee.")).toBe("Great coffee.");
  });

  it("truncates long descriptions at a word boundary with an ellipsis", () => {
    const long =
      "A wonderful spot with a long history and a lot of detail that goes well past the preview length limit";
    const preview = spotPreviewLine(long, 40);
    expect(preview!.length).toBeLessThanOrEqual(41);
    expect(preview!.endsWith("…")).toBe(true);
    expect(preview).not.toMatch(/\s…$/);
  });
});

describe("hasBriefingContent", () => {
  it("is false for missing description", () => {
    expect(hasBriefingContent(null)).toBe(false);
  });

  it("is false for a short description already fully visible in the hero", () => {
    expect(hasBriefingContent("A short guide summary.")).toBe(false);
  });

  it("is true once the description exceeds the hero preview length", () => {
    const long = "x".repeat(200);
    expect(hasBriefingContent(long)).toBe(true);
  });
});
