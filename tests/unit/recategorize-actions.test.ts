import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminMock, createAdminClientMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { applyExperienceRecategorization } from "@/lib/admin/recategorize/actions";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const CATEGORY_UUID = "22222222-2222-4222-8222-222222222222";

function fakeRpcClient(result: { data: unknown; error: unknown }) {
  return { rpc: vi.fn(() => Promise.resolve(result)) };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ ok: true, userId: "admin-user" });
});

describe("applyExperienceRecategorization", () => {
  it("rejects when the caller is not an admin", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const result = await applyExperienceRecategorization([
      {
        id: VALID_UUID,
        primary_category_id: CATEGORY_UUID,
        experience_type: "place",
        location_scope: "specific_place",
      },
    ]);

    expect(result).toEqual({
      success: false,
      error: "Admin access required.",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects an empty selection", async () => {
    const result = await applyExperienceRecategorization([]);
    expect(result.success).toBe(false);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid experience id before calling the database", async () => {
    const result = await applyExperienceRecategorization([
      {
        id: "not-a-uuid",
        primary_category_id: null,
        experience_type: null,
        location_scope: null,
      },
    ]);

    expect(result.success).toBe(false);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid experience_type before calling the database", async () => {
    const result = await applyExperienceRecategorization([
      {
        id: VALID_UUID,
        primary_category_id: null,
        experience_type: "not-a-real-type",
        location_scope: null,
      },
    ]);

    expect(result.success).toBe(false);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid location_scope before calling the database", async () => {
    const result = await applyExperienceRecategorization([
      {
        id: VALID_UUID,
        primary_category_id: null,
        experience_type: null,
        location_scope: "not-a-real-scope",
      },
    ]);

    expect(result.success).toBe(false);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("calls the RPC with the exact selected rows and returns the updated count", async () => {
    createAdminClientMock.mockReturnValue(
      fakeRpcClient({ data: { updated_count: 1 }, error: null }),
    );

    const updates = [
      {
        id: VALID_UUID,
        primary_category_id: CATEGORY_UUID,
        experience_type: "place",
        location_scope: "specific_place",
      },
    ];

    const result = await applyExperienceRecategorization(updates);

    expect(result).toEqual({ success: true, updatedCount: 1 });
    const client = createAdminClientMock.mock.results[0].value;
    expect(client.rpc).toHaveBeenCalledWith(
      "apply_experience_recategorization",
      { updates },
    );
  });

  it("surfaces a clean error when the RPC fails", async () => {
    createAdminClientMock.mockReturnValue(
      fakeRpcClient({ data: null, error: { message: "boom" } }),
    );

    const result = await applyExperienceRecategorization([
      {
        id: VALID_UUID,
        primary_category_id: null,
        experience_type: null,
        location_scope: null,
      },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Could not apply the changes.");
  });
});
