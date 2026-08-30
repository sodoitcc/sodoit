import { describe, expect, it } from "vitest";
import { getExperienceHref } from "@/lib/experiences/href";

describe("getExperienceHref", () => {
  it("returns the canonical slug-based path", () => {
    expect(getExperienceHref({ slug: "swim-with-whale-sharks" })).toBe(
      "/experiences/swim-with-whale-sharks",
    );
  });
});
