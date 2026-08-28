import { describe, expect, it, vi } from "vitest";
import {
  loadCollectionCopyCount,
  loadCollectionProvenance,
} from "../../app/(app)/list/collections/provenance";

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

function fakeCountClient(count: number | null) {
  const eq = vi.fn(() => Promise.resolve({ count, error: null }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  const client = { from } as unknown as Parameters<
    typeof loadCollectionCopyCount
  >[0];

  return { client, from, select, eq };
}

describe("loadCollectionCopyCount", () => {
  it("counts collections referencing this one via forked_from_collection_id", async () => {
    const { client, select, eq } = fakeCountClient(3);

    const result = await loadCollectionCopyCount(client, "col-1");

    expect(result).toBe(3);
    expect(select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(eq).toHaveBeenCalledWith("forked_from_collection_id", "col-1");
  });

  it("returns zero when there are no copies (not null)", async () => {
    const { client } = fakeCountClient(null);

    const result = await loadCollectionCopyCount(client, "col-2");

    expect(result).toBe(0);
  });

  it("reflects repeated copies by the same user (RLS/DB just counts rows, no dedupe by user)", async () => {
    const { client } = fakeCountClient(2);

    const result = await loadCollectionCopyCount(client, "col-3");

    expect(result).toBe(2);
  });
});
