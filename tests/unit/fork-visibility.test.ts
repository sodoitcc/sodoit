import { describe, expect, it } from "vitest";
import { canSaveCopyCollection } from "../../app/(app)/list/collections/fork-visibility";

describe("canSaveCopyCollection", () => {
  it("shows Save a copy for a public collection viewed by a non-owner", () => {
    expect(canSaveCopyCollection(false, "public")).toBe(true);
  });

  it("never shows Save a copy on the owner's own collection, public or private", () => {
    expect(canSaveCopyCollection(true, "public")).toBe(false);
    expect(canSaveCopyCollection(true, "private")).toBe(false);
  });

  it("never shows Save a copy for a private collection", () => {
    expect(canSaveCopyCollection(false, "private")).toBe(false);
  });
});
