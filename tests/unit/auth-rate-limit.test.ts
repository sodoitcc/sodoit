import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";

function makeClient(
  result: { allowed: boolean; retry_after_seconds: number } | null,
  error: unknown = null,
) {
  return {
    rpc: () => ({
      single: () => Promise.resolve({ data: result, error }),
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("consumeAuthRateLimit", () => {
  it("returns allowed when the RPC allows the request", async () => {
    createAdminClientMock.mockReturnValue(
      makeClient({ allowed: true, retry_after_seconds: 0 }),
    );

    const result = await consumeAuthRateLimit({
      identityKey: "email:a@b.com",
      action: "resend_cooldown",
      maxRequests: 1,
      windowSeconds: 60,
    });

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 });
  });

  it("returns blocked with retryAfterSeconds when the RPC blocks the request", async () => {
    createAdminClientMock.mockReturnValue(
      makeClient({ allowed: false, retry_after_seconds: 42 }),
    );

    const result = await consumeAuthRateLimit({
      identityKey: "email:a@b.com",
      action: "resend_cooldown",
      maxRequests: 1,
      windowSeconds: 60,
    });

    expect(result).toEqual({ allowed: false, retryAfterSeconds: 42 });
  });

  it("fails open when the RPC errors, rather than blocking every request", async () => {
    createAdminClientMock.mockReturnValue(
      makeClient(null, { message: "boom" }),
    );

    const result = await consumeAuthRateLimit({
      identityKey: "email:a@b.com",
      action: "resend_cooldown",
      maxRequests: 1,
      windowSeconds: 60,
    });

    expect(result.allowed).toBe(true);
  });
});
