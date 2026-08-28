import { describe, expect, it } from "vitest";
import { canShareCollection } from "../../app/(app)/list/collections/fork-visibility";

describe("canShareCollection", () => {
  it("shows Share for a public collection", () => {
    expect(canShareCollection("public")).toBe(true);
  });

  it("does not show Share for a private collection", () => {
    expect(canShareCollection("private")).toBe(false);
  });
});
