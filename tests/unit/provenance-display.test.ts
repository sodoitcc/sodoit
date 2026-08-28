import { describe, expect, it } from "vitest";
import { resolveProvenanceDisplay } from "../../app/(app)/list/collections/provenance-display";

describe("resolveProvenanceDisplay", () => {
  it("renders nothing for a normal, non-forked collection", () => {
    expect(resolveProvenanceDisplay(null)).toBeNull();
    expect(resolveProvenanceDisplay(undefined)).toBeNull();
  });

  it("renders nothing when the source was deleted (forked_from_collection_id is now null)", () => {
    expect(resolveProvenanceDisplay(null)).toBeNull();
  });

  it("builds a clickable link to the source for a public, accessible source", () => {
    const display = resolveProvenanceDisplay({
      status: "public",
      sourceId: "abc",
      sourceSlug: "prague-weekend",
      sourceName: "Prague Weekend",
      sourceUsername: "amina",
    });

    expect(display).toEqual({
      text: "Based on @amina's collection",
      href: "/u/amina/collections/prague-weekend",
    });
  });

  it("shows a neutral, non-clickable fallback without leaking any source metadata", () => {
    const display = resolveProvenanceDisplay({ status: "hidden" });

    expect(display).toEqual({
      text: "Based on another Sodoit collection",
      href: null,
    });
    expect(JSON.stringify(display)).not.toMatch(/amina|prague|slug|username/i);
  });
});
