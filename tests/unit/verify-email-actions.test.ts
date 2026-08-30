import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, consumeAuthRateLimitMock, getClientIpMock } =
  vi.hoisted(() => ({
    createClientMock: vi.fn(),
    consumeAuthRateLimitMock: vi.fn(),
    getClientIpMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeAuthRateLimit: consumeAuthRateLimitMock,
}));

vi.mock("@/lib/request-ip", () => ({
  getClientIp: getClientIpMock,
}));

import { resendVerificationCode, verifyEmailCode } from "@/app/(auth)/verify-email/actions";

const ALLOWED = { allowed: true, retryAfterSeconds: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  getClientIpMock.mockResolvedValue("1.2.3.4");
  consumeAuthRateLimitMock.mockResolvedValue(ALLOWED);
});

describe("resendVerificationCode", () => {
  it("calls supabase.auth.resend for a well-formed email when not rate-limited", async () => {
    const resendMock = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({ auth: { resend: resendMock } });

    const result = await resendVerificationCode("Person@Example.com");

    expect(result.success).toBe(true);
    expect(resendMock).toHaveBeenCalledWith({
      type: "signup",
      email: "person@example.com",
    });
  });

  it("does not call supabase at all for a malformed email, without leaking that", async () => {
    const resendMock = vi.fn();
    createClientMock.mockResolvedValue({ auth: { resend: resendMock } });

    const result = await resendVerificationCode("not-an-email");

    expect(result.success).toBe(true);
    expect(resendMock).not.toHaveBeenCalled();
  });

  it("blocks and reports retryAfterSeconds when the cooldown rate limit is hit", async () => {
    consumeAuthRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 55,
    });
    const resendMock = vi.fn();
    createClientMock.mockResolvedValue({ auth: { resend: resendMock } });

    const result = await resendVerificationCode("person@example.com");

    expect(result).toEqual({ success: false, retryAfterSeconds: 55 });
    expect(resendMock).not.toHaveBeenCalled();
  });

  it("enforces the cooldown limit before the hourly limits", async () => {
    const resendMock = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({ auth: { resend: resendMock } });

    await resendVerificationCode("person@example.com");

    expect(consumeAuthRateLimitMock.mock.calls[0][0]).toMatchObject({
      action: "resend_cooldown",
      maxRequests: 1,
      windowSeconds: 60,
    });
  });
});

describe("verifyEmailCode", () => {
  it("rejects a malformed code before touching supabase", async () => {
    const verifyOtpMock = vi.fn();
    createClientMock.mockResolvedValue({ auth: { verifyOtp: verifyOtpMock } });

    const result = await verifyEmailCode("person@example.com", "12", "/");

    expect(result.success).toBe(false);
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("returns a generic error on an invalid or expired code, without leaking Supabase's message", async () => {
    const verifyOtpMock = vi
      .fn()
      .mockResolvedValue({ error: { message: "Token has expired or is invalid" } });
    createClientMock.mockResolvedValue({ auth: { verifyOtp: verifyOtpMock } });

    const result = await verifyEmailCode("person@example.com", "123456", "/");

    expect(result.success).toBe(false);
    expect(result.error).not.toMatch(/token/i);
    expect(result.error).not.toMatch(/supabase/i);
  });

  it("succeeds and returns a safe next path on a valid code", async () => {
    const verifyOtpMock = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({ auth: { verifyOtp: verifyOtpMock } });

    const result = await verifyEmailCode("person@example.com", "123456", "/list");

    expect(result.success).toBe(true);
    expect(result.next).toBe("/list");
    expect(verifyOtpMock).toHaveBeenCalledWith({
      email: "person@example.com",
      token: "123456",
      type: "signup",
    });
  });

  it("never resolves an external next path to anything but a safe internal one", async () => {
    const verifyOtpMock = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({ auth: { verifyOtp: verifyOtpMock } });

    const result = await verifyEmailCode(
      "person@example.com",
      "123456",
      "https://evil.example.com",
    );

    expect(result.next).toBe("/");
  });

  it("blocks further attempts once the per-email attempt limit is hit", async () => {
    consumeAuthRateLimitMock
      .mockResolvedValueOnce(ALLOWED)
      .mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 300 });

    const verifyOtpMock = vi.fn();
    createClientMock.mockResolvedValue({ auth: { verifyOtp: verifyOtpMock } });

    const result = await verifyEmailCode("person@example.com", "123456", "/");

    expect(result.success).toBe(false);
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });
});
