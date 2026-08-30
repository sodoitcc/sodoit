"use server";

import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/request-ip";

export interface SignupRateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export async function checkSignupRateLimit(): Promise<SignupRateLimitResult> {
  const ip = await getClientIp();
  if (!ip) return { allowed: true };

  const result = await consumeAuthRateLimit({
    identityKey: `ip:${ip}`,
    action: "signup_ip",
    maxRequests: 5,
    windowSeconds: 900,
  });

  if (!result.allowed) {
    return { allowed: false, retryAfterSeconds: result.retryAfterSeconds };
  }

  return { allowed: true };
}
