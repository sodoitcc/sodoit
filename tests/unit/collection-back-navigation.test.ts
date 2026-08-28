import { describe, expect, it } from "vitest";
import { resolveCollectionBackTarget } from "../../app/(app)/u/[username]/collections/[slug]/back-navigation";

describe("resolveCollectionBackTarget", () => {
  it("gives the owner a fixed link to their own list, regardless of history", () => {
    expect(resolveCollectionBackTarget(true, true)).toEqual({
      label: "My list",
      href: "/list",
      useHistoryBack: false,
    });
    expect(resolveCollectionBackTarget(true, false)).toEqual({
      label: "My list",
      href: "/list",
      useHistoryBack: false,
    });
  });

  it("sends a non-owner visitor back through real browser history when available", () => {
    const target = resolveCollectionBackTarget(false, true);
    expect(target.useHistoryBack).toBe(true);
  });

  it("never routes a non-owner visitor to another user's list/private surface — falls back to Feed with no history", () => {
    const target = resolveCollectionBackTarget(false, false);
    expect(target.useHistoryBack).toBe(false);
    expect(target.href).toBe("/feed");
    expect(target.href).not.toMatch(/\/list$/);
    expect(target.href).not.toMatch(/^\/u\//);
  });
});
