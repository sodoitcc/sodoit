import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  isSlugTakenMock,
  fromMock,
  insertMock,
  updateMock,
  selectMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  isSlugTakenMock: vi.fn(),
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  updateMock: vi.fn(),
  selectMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/admin/guides/queries", () => ({
  isGuideSlugTaken: isSlugTakenMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import {
  createGuide,
  moveGuideItem,
  setGuideVisibility,
  updateGuide,
} from "@/lib/admin/guides/actions";

function validFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("title", "48 Hours in Lisbon");
  formData.set("slug", "48-hours-in-lisbon");
  formData.set("description", "");
  formData.set("type", "itinerary");
  formData.set("city", "Lisbon");
  formData.set("country_code", "PT");
  formData.set("city_slug", "");
  formData.set("cover_image_url", "");
  formData.set("cover_image_alt", "");
  formData.set("duration_label", "");
  formData.set("editorial_attribution", "");
  formData.set("sort_order", "0");
  for (const [key, value] of Object.entries(overrides))
    formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ ok: true, userId: "admin-1" });
  isSlugTakenMock.mockResolvedValue(false);
  insertMock.mockReturnValue({
    select: () => ({
      single: () =>
        Promise.resolve({ data: { id: "new-guide-id" }, error: null }),
    }),
  });
  updateMock.mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
  fromMock.mockReturnValue({
    insert: insertMock,
    update: updateMock,
    select: selectMock,
  });
});

describe("createGuide authorization and validation", () => {
  it("blocks non-admins", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const result = await createGuide(validFormData());

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("creates and persists the guide type", async () => {
    const result = await createGuide(validFormData({ type: "hidden_gems" }));

    expect(result).toEqual({ success: true, id: "new-guide-id" });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "hidden_gems",
        city: "Lisbon",
        country_code: "PT",
      }),
    );
  });

  it("rejects an invalid type", async () => {
    const result = await createGuide(validFormData({ type: "wishlist" }));
    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects a duplicate slug", async () => {
    isSlugTakenMock.mockResolvedValue(true);
    const result = await createGuide(validFormData());
    expect(result).toEqual({
      success: false,
      error: "That slug is already in use.",
    });
  });
});

describe("updateGuide", () => {
  it("persists visibility together with other fields", async () => {
    const id = "22222222-2222-4222-8222-222222222222";
    const result = await updateGuide(id, validFormData({ is_public: "on" }));

    expect(result).toEqual({ success: true, id });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ is_public: true }),
    );
  });
});

describe("setGuideVisibility", () => {
  it("blocks non-admins from publishing", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });
    const id = "22222222-2222-4222-8222-222222222222";

    const result = await setGuideVisibility(id, true);

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe("moveGuideItem", () => {
  const guideId = "33333333-3333-4333-8333-333333333333";

  function itemsQuery(items: { id: string; position: number }[]) {
    return {
      eq: () => ({
        order: () => Promise.resolve({ data: items, error: null }),
      }),
    };
  }

  it("swaps two adjacent items through a temporary, non-negative position", async () => {
    const itemA = "44444444-4444-4444-8444-444444444444";
    const itemB = "55555555-5555-4555-8555-555555555555";
    const itemC = "66666666-6666-4666-8666-666666666666";
    const items = [
      { id: itemA, position: 0 },
      { id: itemB, position: 1 },
      { id: itemC, position: 2 },
    ];
    selectMock.mockReturnValue(itemsQuery(items));

    const eqCalls: unknown[] = [];
    updateMock.mockImplementation((payload: { position: number }) => ({
      eq: (_column: string, value: string) => {
        eqCalls.push({ ...payload, id: value });
        return Promise.resolve({ error: null });
      },
    }));

    const result = await moveGuideItem(guideId, itemA, "down");

    expect(result).toEqual({ success: true, id: guideId });
    expect(eqCalls).toEqual([
      { position: 3, id: itemA },
      { position: 0, id: itemB },
      { position: 1, id: itemA },
    ]);
    for (const call of eqCalls) {
      expect((call as { position: number }).position).toBeGreaterThanOrEqual(0);
    }
  });

  it("does nothing when moving the first item up", async () => {
    const itemA = "44444444-4444-4444-8444-444444444444";
    const itemB = "55555555-5555-4555-8555-555555555555";
    const items = [
      { id: itemA, position: 0 },
      { id: itemB, position: 1 },
    ];
    selectMock.mockReturnValue(itemsQuery(items));

    const result = await moveGuideItem(guideId, itemA, "up");

    expect(result).toEqual({ success: true, id: guideId });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("blocks non-admins from reordering", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const result = await moveGuideItem(
      guideId,
      "44444444-4444-4444-8444-444444444444",
      "down",
    );

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
