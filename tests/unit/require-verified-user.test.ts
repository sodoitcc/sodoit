import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  isEmailVerified,
  requireVerifiedUser,
} from "@/lib/auth/require-verified-user";
import { setListStatus } from "@/app/(app)/browse/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isEmailVerified", () => {
  it("is false when email_confirmed_at is undefined", () => {
    expect(isEmailVerified({ email_confirmed_at: undefined })).toBe(false);
  });

  it("is true when email_confirmed_at is set", () => {
    expect(
      isEmailVerified({ email_confirmed_at: "2026-01-01T00:00:00.000Z" }),
    ).toBe(true);
  });
});

describe("requireVerifiedUser", () => {
  it("rejects when there is no signed-in user", async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: () => Promise.resolve({ data: { user: null } }) },
    });

    const result = await requireVerifiedUser();
    expect(result).toEqual({ ok: false, error: "You must be signed in." });
  });

  it("rejects a signed-in but unverified user", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: { id: "u1", email_confirmed_at: null } },
          }),
      },
    });

    const result = await requireVerifiedUser();
    expect(result).toEqual({
      ok: false,
      error: "Please verify your email first.",
    });
  });

  it("allows a verified user through", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: {
              user: { id: "u1", email_confirmed_at: "2026-01-01T00:00:00Z" },
            },
          }),
      },
    });

    const result = await requireVerifiedUser();
    expect(result).toEqual({ ok: true, userId: "u1" });
  });
});

describe("setListStatus rejects unverified accounts", () => {
  const VALID_UUID = "11111111-1111-4111-8111-111111111111";

  it("does not write for an unverified user", async () => {
    const fromMock = vi.fn();
    createClientMock.mockResolvedValue({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: { id: "u1", email_confirmed_at: null } },
          }),
      },
      from: fromMock,
    });

    await setListStatus(VALID_UUID, "saved");

    expect(fromMock).not.toHaveBeenCalled();
  });

  it("still writes for a verified user", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn().mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
      insert,
    });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: {
              user: { id: "u1", email_confirmed_at: "2026-01-01T00:00:00Z" },
            },
          }),
      },
      from: fromMock,
    });

    await setListStatus(VALID_UUID, "saved");

    expect(insert).toHaveBeenCalled();
  });
});
