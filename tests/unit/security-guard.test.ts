import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSecurityFixture } from "../security/setup";

const ENV_KEYS = [
  "RUN_SECURITY_TESTS",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SECURITY_TEST_SUPABASE_PROJECT_REF",
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  process.env.RUN_SECURITY_TESTS = "true";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://prod-project-ref.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("security test project guard", () => {
  it("refuses to run when no approved test project ref is configured", async () => {
    delete process.env.SECURITY_TEST_SUPABASE_PROJECT_REF;
    await expect(createSecurityFixture()).rejects.toThrow(
      /SECURITY_TEST_SUPABASE_PROJECT_REF is not set/,
    );
  });

  it("refuses to run when the target project does not match the approved test project", async () => {
    process.env.SECURITY_TEST_SUPABASE_PROJECT_REF = "dedicated-test-ref";
    await expect(createSecurityFixture()).rejects.toThrow(
      /does not match the approved test project/,
    );
  });
});
