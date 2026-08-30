import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { isE2eTestModeActive } from "@/lib/env/e2e";

const ENV_KEYS = ["E2E_TEST_MODE", "NODE_ENV", "CI"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  vi.clearAllMocks();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else (process.env as Record<string, string>)[key] = saved[key];
  }
});

describe("isE2eTestModeActive", () => {
  it("is false when E2E_TEST_MODE is unset, even outside production", () => {
    delete process.env.E2E_TEST_MODE;
    (process.env as Record<string, string>).NODE_ENV = "development";
    expect(isE2eTestModeActive()).toBe(false);
  });

  it("is true when E2E_TEST_MODE is set and NODE_ENV is not production", () => {
    process.env.E2E_TEST_MODE = "true";
    (process.env as Record<string, string>).NODE_ENV = "test";
    delete process.env.CI;
    expect(isE2eTestModeActive()).toBe(true);
  });

  it("is true when E2E_TEST_MODE is set, NODE_ENV is production, and CI is true", () => {
    process.env.E2E_TEST_MODE = "true";
    (process.env as Record<string, string>).NODE_ENV = "production";
    process.env.CI = "true";
    expect(isE2eTestModeActive()).toBe(true);
  });

  it("rejects the bypass when NODE_ENV is production and CI is not true", () => {
    process.env.E2E_TEST_MODE = "true";
    (process.env as Record<string, string>).NODE_ENV = "production";
    delete process.env.CI;
    expect(isE2eTestModeActive()).toBe(false);
  });
});

describe("consumeAuthRateLimit E2E bypass", () => {
  it("does not construct the admin client when E2E test mode is active", async () => {
    process.env.E2E_TEST_MODE = "true";
    (process.env as Record<string, string>).NODE_ENV = "test";
    delete process.env.CI;

    const result = await consumeAuthRateLimit({
      identityKey: "ip:1.2.3.4",
      action: "signup_ip",
      maxRequests: 5,
      windowSeconds: 900,
    });

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("still constructs the admin client when running as production without CI", async () => {
    process.env.E2E_TEST_MODE = "true";
    (process.env as Record<string, string>).NODE_ENV = "production";
    delete process.env.CI;
    createAdminClientMock.mockReturnValue({
      rpc: () => ({
        single: () =>
          Promise.resolve({
            data: { allowed: true, retry_after_seconds: 0 },
            error: null,
          }),
      }),
    });

    await consumeAuthRateLimit({
      identityKey: "ip:1.2.3.4",
      action: "signup_ip",
      maxRequests: 5,
      windowSeconds: 900,
    });

    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
  });
});
