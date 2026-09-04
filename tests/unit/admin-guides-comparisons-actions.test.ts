import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminMock, fromMock, insertMock, updateMock, deleteMock, selectMock } =
  vi.hoisted(() => ({
    requireAdminMock: vi.fn(),
    fromMock: vi.fn(),
    insertMock: vi.fn(),
    updateMock: vi.fn(),
    deleteMock: vi.fn(),
    selectMock: vi.fn(),
  }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import {
  addGuideComparison,
  deleteGuideComparison,
  moveGuideComparison,
  updateGuideComparison,
} from "@/lib/admin/guides/actions";

const guideId = "33333333-3333-4333-8333-333333333333";

function validFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("skip_title", "Old Town tourist restaurants");
  formData.set("go_instead_title", "Lokál Dlouhááá");
  for (const [key, value] of Object.entries(overrides))
    formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ ok: true, userId: "admin-1" });
  insertMock.mockReturnValue(Promise.resolve({ error: null }));
  updateMock.mockReturnValue({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) });
  deleteMock.mockReturnValue({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) });
  fromMock.mockReturnValue({
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
    select: selectMock,
  });
});

describe("addGuideComparison", () => {
  it("blocks non-admins", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const result = await addGuideComparison(guideId, validFormData());

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects a missing skip title", async () => {
    const result = await addGuideComparison(
      guideId,
      validFormData({ skip_title: "" }),
    );

    expect(result.success).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects an unsafe skip google maps url", async () => {
    const result = await addGuideComparison(
      guideId,
      validFormData({ skip_google_maps_url: "javascript:alert(1)" }),
    );

    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range latitude", async () => {
    const result = await addGuideComparison(
      guideId,
      validFormData({ skip_latitude: "91" }),
    );

    expect(result.success).toBe(false);
  });

  it("inserts with the next position and normalized nullable fields", async () => {
    selectMock.mockReturnValue({
      eq: () => ({
        order: () => ({
          limit: () =>
            Promise.resolve({ data: [{ position: 2 }], error: null }),
        }),
      }),
    });

    const result = await addGuideComparison(guideId, validFormData());

    expect(result).toEqual({ success: true, id: guideId });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        guide_id: guideId,
        position: 3,
        skip_title: "Old Town tourist restaurants",
        skip_description: null,
        go_instead_title: "Lokál Dlouhááá",
        reason: null,
      }),
    );
  });
});

describe("updateGuideComparison", () => {
  it("persists edited fields", async () => {
    const comparisonId = "44444444-4444-4444-8444-444444444444";

    const result = await updateGuideComparison(
      guideId,
      comparisonId,
      validFormData({ reason: "Same neighborhood, better food." }),
    );

    expect(result).toEqual({ success: true, id: guideId });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Same neighborhood, better food." }),
    );
  });
});

describe("deleteGuideComparison", () => {
  it("removes the comparison", async () => {
    const comparisonId = "44444444-4444-4444-8444-444444444444";

    const result = await deleteGuideComparison(guideId, comparisonId);

    expect(result).toEqual({ success: true, id: guideId });
    expect(deleteMock).toHaveBeenCalled();
  });
});

describe("moveGuideComparison", () => {
  function comparisonsQuery(rows: { id: string; position: number }[]) {
    return {
      eq: () => ({
        order: () => Promise.resolve({ data: rows, error: null }),
      }),
    };
  }

  it("swaps two adjacent comparisons through a temporary position", async () => {
    const a = "44444444-4444-4444-8444-444444444444";
    const b = "55555555-5555-4555-8555-555555555555";
    const rows = [
      { id: a, position: 0 },
      { id: b, position: 1 },
    ];
    selectMock.mockReturnValue(comparisonsQuery(rows));

    const eqCalls: unknown[] = [];
    updateMock.mockImplementation((payload: { position: number }) => ({
      eq: (_column: string, value: string) => {
        eqCalls.push({ ...payload, id: value });
        return Promise.resolve({ error: null });
      },
    }));

    const result = await moveGuideComparison(guideId, a, "down");

    expect(result).toEqual({ success: true, id: guideId });
    expect(eqCalls).toEqual([
      { position: 2, id: a },
      { position: 0, id: b },
      { position: 1, id: a },
    ]);
  });

  it("does nothing when moving the first comparison up", async () => {
    const a = "44444444-4444-4444-8444-444444444444";
    const b = "55555555-5555-4555-8555-555555555555";
    selectMock.mockReturnValue(
      comparisonsQuery([
        { id: a, position: 0 },
        { id: b, position: 1 },
      ]),
    );

    const result = await moveGuideComparison(guideId, a, "up");

    expect(result).toEqual({ success: true, id: guideId });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
