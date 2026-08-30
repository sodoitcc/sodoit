import { describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { loadMyList } from "@/app/(app)/list/data";

function experience(id: string, title: string) {
  return { id, title };
}

function setupClient(rows: { status: string; experiences: unknown }[]) {
  createClientMock.mockResolvedValue({
    from() {
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: rows }),
          }),
        }),
      };
    },
  });
}

describe("loadMyList", () => {
  it("partitions saved and completed rows without overlap", async () => {
    setupClient([
      { status: "saved", experiences: experience("a", "Saved one") },
      { status: "completed", experiences: experience("b", "Done one") },
      { status: "saved", experiences: experience("c", "Saved two") },
    ]);

    const result = await loadMyList("user-1");

    expect(result.saved.map((e) => e.id)).toEqual(["a", "c"]);
    expect(result.completed.map((e) => e.id)).toEqual(["b"]);
  });

  it("never places the same experience in both saved and completed", async () => {
    setupClient([
      { status: "saved", experiences: experience("a", "A") },
      { status: "completed", experiences: experience("b", "B") },
    ]);

    const result = await loadMyList("user-1");
    const savedIds = new Set(result.saved.map((e) => e.id));
    const completedIds = new Set(result.completed.map((e) => e.id));

    for (const id of savedIds) {
      expect(completedIds.has(id)).toBe(false);
    }
  });

  it("ignores rows with an unrecognized status rather than misclassifying them", async () => {
    setupClient([
      { status: "saved", experiences: experience("a", "A") },
      { status: "archived", experiences: experience("z", "Z") },
    ]);

    const result = await loadMyList("user-1");
    expect(result.saved.map((e) => e.id)).toEqual(["a"]);
    expect(result.completed).toEqual([]);
  });
});
