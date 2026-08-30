import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminMock, isTagSlugTakenMock, createAdminClientMock } =
  vi.hoisted(() => ({
    requireAdminMock: vi.fn(),
    isTagSlugTakenMock: vi.fn(),
    createAdminClientMock: vi.fn(),
  }));

vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/admin/tags/queries", () => ({
  isTagSlugTaken: isTagSlugTakenMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createExperienceTag, updateExperienceTag } from "@/lib/admin/tags/actions";

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID_FIELDS = {
  name: "Iconic",
  slug: "iconic",
  sort_order: "1",
};

function fakeInsertClient(result: { data: unknown; error: unknown }) {
  return {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve(result),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ ok: true, userId: "admin-user" });
  isTagSlugTakenMock.mockResolvedValue(false);
});

describe("createExperienceTag", () => {
  it("rejects when the caller is not an admin", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const result = await createExperienceTag(formData(VALID_FIELDS));

    expect(result).toEqual({
      success: false,
      error: "Admin access required.",
    });
  });

  it("rejects invalid input before touching the database", async () => {
    const result = await createExperienceTag(
      formData({ ...VALID_FIELDS, name: "" }),
    );

    expect(result.success).toBe(false);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects a duplicate slug with a clean error, without inserting", async () => {
    isTagSlugTakenMock.mockResolvedValue(true);

    const result = await createExperienceTag(formData(VALID_FIELDS));

    expect(result).toEqual({
      success: false,
      error: "That slug is already in use.",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("creates the tag and returns its id on success", async () => {
    createAdminClientMock.mockReturnValue(
      fakeInsertClient({ data: { id: "new-id" }, error: null }),
    );

    const result = await createExperienceTag(formData(VALID_FIELDS));

    expect(result).toEqual({ success: true, id: "new-id" });
  });

  it("maps a unique-violation from the database to a clean error", async () => {
    createAdminClientMock.mockReturnValue(
      fakeInsertClient({ data: null, error: { code: "23505" } }),
    );

    const result = await createExperienceTag(formData(VALID_FIELDS));

    expect(result).toEqual({
      success: false,
      error: "That slug is already in use.",
    });
  });
});

describe("updateExperienceTag", () => {
  const VALID_UUID = "11111111-1111-4111-8111-111111111111";

  it("rejects an invalid id before checking admin access", async () => {
    const result = await updateExperienceTag(
      "not-a-uuid",
      formData(VALID_FIELDS),
    );

    expect(result).toEqual({ success: false, error: "Invalid tag." });
    expect(requireAdminMock).not.toHaveBeenCalled();
  });

  it("rejects when the caller is not an admin", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const result = await updateExperienceTag(VALID_UUID, formData(VALID_FIELDS));

    expect(result.success).toBe(false);
  });

  it("updates the tag without ever writing the slug field", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    createAdminClientMock.mockReturnValue({
      from: () => ({
        update: (payload: Record<string, unknown>) => {
          capturedPayload = payload;
          return { eq: () => Promise.resolve({ error: null }) };
        },
      }),
    });

    const result = await updateExperienceTag(VALID_UUID, formData(VALID_FIELDS));

    expect(result).toEqual({ success: true, id: VALID_UUID });
    expect(capturedPayload).not.toHaveProperty("slug");
  });

  it("can deactivate a tag by setting is_active to false", async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    createAdminClientMock.mockReturnValue({
      from: () => ({
        update: (payload: Record<string, unknown>) => {
          capturedPayload = payload;
          return { eq: () => Promise.resolve({ error: null }) };
        },
      }),
    });

    await updateExperienceTag(
      VALID_UUID,
      formData({ ...VALID_FIELDS }),
    );

    expect(capturedPayload).toMatchObject({ is_active: false });
  });
});
