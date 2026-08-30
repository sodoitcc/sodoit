import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

describe("verification architecture", () => {
  it("RESEND_API_KEY is never referenced in a client component", () => {
    const clientFiles = [
      "app/(auth)/verify-email/VerifyEmailForm.tsx",
      "app/(auth)/signup/SignupForm.tsx",
      "app/(auth)/login/LoginForm.tsx",
    ];

    for (const file of clientFiles) {
      const source = read(file);
      expect(source).toMatch(/^"use client";/);
      expect(source).not.toMatch(/RESEND_API_KEY/);
      expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    }
  });

  it("the OTP code is never passed to a logging or error-reporting call", () => {
    const source = read("app/(auth)/verify-email/actions.ts");
    expect(source).not.toMatch(/console\.(log|error|warn)\([^)]*token/i);
    expect(source).not.toMatch(/Sentry/);
  });

  it("rate-limit RPC is only reachable via the service-role admin client", () => {
    const source = read("lib/auth/rate-limit.ts");
    expect(source).toMatch(/createAdminClient/);
    expect(source).not.toMatch(/@\/lib\/supabase\/client/);
  });

  it("verifyEmailCode resolves the redirect through the safe-next helper", () => {
    const source = read("app/(auth)/verify-email/actions.ts");
    expect(source).toMatch(/getSafeNextPath/);
  });

  it("no custom verification_codes table or OTP generation is introduced", () => {
    const files = [
      "app/(auth)/verify-email/actions.ts",
      "app/(auth)/signup/actions.ts",
      "supabase/migrations/202608300005_auth_rate_limit.sql",
    ];

    for (const file of files) {
      const source = read(file);
      expect(source).not.toMatch(/verification_codes/);
      expect(source).not.toMatch(/generateOtp|randomInt\(.*100000/i);
    }
  });
});
