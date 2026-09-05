import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminMock, isSlugTakenMock, fromMock, insertMock, updateMock } =
  vi.hoisted(() => ({
    requireAdminMock: vi.fn(),
    isSlugTakenMock: vi.fn(),
    fromMock: vi.fn(),
    insertMock: vi.fn(),
    updateMock: vi.fn(),
  }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/admin/experiences/queries", () => ({
  isExperienceSlugTaken: isSlugTakenMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import {
  createExperience,
  setExperienceVisibility,
  updateExperience,
} from "@/lib/admin/experiences/actions";

const VALID_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";
const VALID_TAG_ID = "33333333-3333-4333-8333-333333333333";

function validFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("title", "Watch a sunrise");
  formData.set("slug", "watch-a-sunrise");
  formData.set("description", "");
  formData.set("primary_category_id", VALID_CATEGORY_ID);
  formData.set("difficulty", "Easy");
  formData.set("location_type", "global");
  formData.set("country_code", "");
  formData.set("city", "");
  formData.set("image_url", "");
  formData.set("image_alt", "");
  for (const [key, value] of Object.entries(overrides))
    formData.set(key, value);
  return formData;
}

function tableClient() {
  return {
    from(table: string) {
      if (table === "experience_categories") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { name: "Nature" }, error: null }),
              }),
            }),
          }),
        };
      }

      if (table === "experience_tag_assignments") {
        return {
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
          insert: () => Promise.resolve({ error: null }),
        };
      }

      return { insert: insertMock, update: updateMock };
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ ok: true, userId: "admin-1" });
  isSlugTakenMock.mockResolvedValue(false);
  insertMock.mockReturnValue({
    select: () => ({
      single: () => Promise.resolve({ data: { id: "new-id" }, error: null }),
    }),
  });
  updateMock.mockReturnValue({
    eq: () => Promise.resolve({ error: null }),
  });
  fromMock.mockImplementation(tableClient().from);
});

describe("createExperience authorization", () => {
  it("refuses to create when the caller is not an admin", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const result = await createExperience(validFormData());

    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("creates when the caller is an admin", async () => {
    const result = await createExperience(validFormData());

    expect(result).toEqual({ success: true, id: "new-id" });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Watch a sunrise",
        slug: "watch-a-sunrise",
        category: "Nature",
        primary_category_id: VALID_CATEGORY_ID,
      }),
    );
  });

  it("persists selected tag ids to the tag assignment relation", async () => {
    const formData = validFormData();
    formData.append("tag_ids", VALID_TAG_ID);

    let insertedTagRows: unknown = null;
    fromMock.mockImplementation((table: string) => {
      if (table === "experience_tag_assignments") {
        return {
          delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
          insert: (rows: unknown) => {
            insertedTagRows = rows;
            return Promise.resolve({ error: null });
          },
        };
      }
      return tableClient().from(table);
    });

    const result = await createExperience(formData);

    expect(result.success).toBe(true);
    expect(insertedTagRows).toEqual([
      { experience_id: "new-id", tag_id: VALID_TAG_ID },
    ]);
  });
});

describe("createExperience validation", () => {
  it("rejects a missing title", async () => {
    const result = await createExperience(validFormData({ title: "" }));
    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid category id format", async () => {
    const result = await createExperience(
      validFormData({ primary_category_id: "not-a-uuid" }),
    );
    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects a category id that does not resolve to an active category", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "experience_categories") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return { insert: insertMock, update: updateMock };
    });

    const result = await createExperience(validFormData());

    expect(result).toEqual({
      success: false,
      error: "Choose a valid category.",
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a duplicate slug before touching the database", async () => {
    isSlugTakenMock.mockResolvedValue(true);

    const result = await createExperience(validFormData());

    expect(result).toEqual({
      success: false,
      error: "That slug is already in use.",
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("surfaces a unique-violation from the database as a slug error", async () => {
    insertMock.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: null,
            error: { code: "23505", message: "duplicate key" },
          }),
      }),
    });

    const result = await createExperience(validFormData());

    expect(result).toEqual({
      success: false,
      error: "That slug is already in use.",
    });
  });
});

describe("updateExperience", () => {
  it("rejects a malformed id without calling the database", async () => {
    const result = await updateExperience("not-a-uuid", validFormData());
    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
    expect(requireAdminMock).not.toHaveBeenCalled();
  });

  it("updates when the id and payload are valid", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const result = await updateExperience(id, validFormData());

    expect(result).toEqual({ success: true, id });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Watch a sunrise",
        primary_category_id: VALID_CATEGORY_ID,
      }),
    );
  });
});

describe("setExperienceVisibility", () => {
  const id = "11111111-1111-4111-8111-111111111111";

  it("blocks non-admins from publishing or hiding", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const result = await setExperienceVisibility(id, true);

    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("toggles is_public for an admin", async () => {
    const result = await setExperienceVisibility(id, true);

    expect(result).toEqual({ success: true, id });
    expect(updateMock).toHaveBeenCalledWith({ is_public: true });
  });
});
