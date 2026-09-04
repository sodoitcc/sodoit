import { describe, expect, it } from "vitest";
import { parseTags } from "@/lib/admin/guides/validation";

describe("parseTags", () => {
  it("splits a comma-separated string into trimmed tags", () => {
    expect(parseTags("coffee, historic, free")).toEqual([
      "coffee",
      "historic",
      "free",
    ]);
  });

  it("drops empty segments", () => {
    expect(parseTags("coffee,, free,")).toEqual(["coffee", "free"]);
  });

  it("returns null for an empty or whitespace-only string", () => {
    expect(parseTags("")).toBeNull();
    expect(parseTags("   ")).toBeNull();
  });
});
