import { describe, expect, it, vi } from "vitest";
import { loadCollectionProvenance } from "../../app/(app)/list/collections/provenance";

function fakeClient(row: unknown) {
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null })),
      })),
    })),
  }));

  const client = { from } as unknown as Parameters<
    typeof loadCollectionProvenance
  >[0];

  return { client, from };
}

describe("loadCollectionProvenance", () => {
  it("returns null (no attribution) when the collection isn't a fork", async () => {
    const { client, from } = fakeClient(null);
    const result = await loadCollectionProvenance(client, null);

    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("resolves public source attribution correctly", async () => {
    const { client } = fakeClient({
      id: "src-1",
      slug: "prague-weekend",
      name: "Prague Weekend",
      profiles: { username: "amina" },
    });

    const result = await loadCollectionProvenance(client, "src-1");

    expect(result).toEqual({
      status: "public",
      sourceId: "src-1",
      sourceSlug: "prague-weekend",
      sourceName: "Prague Weekend",
      sourceUsername: "amina",
    });
  });

  it("does not leak any source metadata when the source is private/inaccessible", async () => {
    const { client } = fakeClient(null);
    const result = await loadCollectionProvenance(client, "src-private");

    expect(result).toEqual({ status: "hidden" });
  });

  it("falls back to hidden if the source row has no resolvable owner username", async () => {
    const { client } = fakeClient({
      id: "src-2",
      slug: "orphaned",
      name: "Orphaned",
      profiles: null,
    });

    const result = await loadCollectionProvenance(client, "src-2");

    expect(result).toEqual({ status: "hidden" });
  });

  it("unwraps a profiles array embed the same as a single object", async () => {
    const { client } = fakeClient({
      id: "src-3",
      slug: "array-embed",
      name: "Array Embed",
      profiles: [{ username: "kenji" }],
    });

    const result = await loadCollectionProvenance(client, "src-3");

    expect(result).toEqual({
      status: "public",
      sourceId: "src-3",
      sourceSlug: "array-embed",
      sourceName: "Array Embed",
      sourceUsername: "kenji",
    });
  });
});
