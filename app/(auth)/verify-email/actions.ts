"use server";

import { createClient } from "@/lib/supabase/server";
import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { getSafeNextPath } from "@/lib/auth-redirect";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const OTP_RE = /^\d{6}$/;

export interface ResendResult {
  success: boolean;
  retryAfterSeconds?: number;
}

export async function resendVerificationCode(
  email: string,
): Promise<ResendResult> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) {
    return { success: true };
  }

  const cooldown = await consumeAuthRateLimit({
    identityKey: `email:${normalized}`,
    action: "resend_cooldown",
    maxRequests: 1,
    windowSeconds: 60,
  });
  if (!cooldown.allowed) {
    return { success: false, retryAfterSeconds: cooldown.retryAfterSeconds };
  }

  const hourly = await consumeAuthRateLimit({
    identityKey: `email:${normalized}`,
    action: "resend_hourly",
    maxRequests: 5,
    windowSeconds: 3600,
  });
  if (!hourly.allowed) {
    return { success: false, retryAfterSeconds: hourly.retryAfterSeconds };
  }

  const ip = await getClientIp();
  if (ip) {
    const ipHourly = await consumeAuthRateLimit({
      identityKey: `ip:${ip}`,
      action: "resend_ip_hourly",
      maxRequests: 10,
      windowSeconds: 3600,
    });
    if (!ipHourly.allowed) {
      return { success: false, retryAfterSeconds: ipHourly.retryAfterSeconds };
    }
  }

  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email: normalized });

  return { success: true };
}

export interface VerifyResult {
  success: boolean;
  error?: string;
  next?: string;
}

export async function verifyEmailCode(
  email: string,
  token: string,
  next: string,
): Promise<VerifyResult> {
  const normalized = normalizeEmail(email);

  if (!normalized.includes("@") || !OTP_RE.test(token)) {
    return { success: false, error: "Enter the 6-digit code." };
  }

  const ip = await getClientIp();
  if (ip) {
    const ipAttempts = await consumeAuthRateLimit({
      identityKey: `ip:${ip}`,
      action: "verify_attempt_ip",
      maxRequests: 20,
      windowSeconds: 900,
    });
    if (!ipAttempts.allowed) {
      return {
        success: false,
        error: "Too many attempts. Try again later.",
      };
    }
  }

  const emailAttempts = await consumeAuthRateLimit({
    identityKey: `email:${normalized}`,
    action: "verify_attempt_email",
    maxRequests: 10,
    windowSeconds: 900,
  });
  if (!emailAttempts.allowed) {
    return { success: false, error: "Too many attempts. Try again later." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: normalized,
    token,
    type: "signup",
  });

  if (error) {
    return { success: false, error: "That code is incorrect or has expired." };
  }

  return { success: true, next: getSafeNextPath(next) };
}
