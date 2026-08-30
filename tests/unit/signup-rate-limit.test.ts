import { beforeEach, describe, expect, it, vi } from "vitest";

const { consumeAuthRateLimitMock, getClientIpMock } = vi.hoisted(() => ({
  consumeAuthRateLimitMock: vi.fn(),
  getClientIpMock: vi.fn(),
}));

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeAuthRateLimit: consumeAuthRateLimitMock,
}));

vi.mock("@/lib/request-ip", () => ({
  getClientIp: getClientIpMock,
}));

import { checkSignupRateLimit } from "@/app/(auth)/signup/actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkSignupRateLimit", () => {
  it("allows the request and checks by IP when an IP is available", async () => {
    getClientIpMock.mockResolvedValue("9.9.9.9");
    consumeAuthRateLimitMock.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });

    const result = await checkSignupRateLimit();

    expect(result.allowed).toBe(true);
    expect(consumeAuthRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        identityKey: "ip:9.9.9.9",
        action: "signup_ip",
        maxRequests: 5,
        windowSeconds: 900,
      }),
    );
  });

  it("blocks after the IP limit is exceeded", async () => {
    getClientIpMock.mockResolvedValue("9.9.9.9");
    consumeAuthRateLimitMock.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 500,
    });

    const result = await checkSignupRateLimit();

    expect(result).toEqual({ allowed: false, retryAfterSeconds: 500 });
  });

  it("fails open when no IP is observable", async () => {
    getClientIpMock.mockResolvedValue(null);

    const result = await checkSignupRateLimit();

    expect(result.allowed).toBe(true);
    expect(consumeAuthRateLimitMock).not.toHaveBeenCalled();
  });
});
