import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitCheck {
  identityKey: string;
  action: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitOutcome {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function consumeAuthRateLimit(
  check: RateLimitCheck,
): Promise<RateLimitOutcome> {
  const client = createAdminClient();

  const { data, error } = await client
    .rpc("consume_auth_rate_limit", {
      p_identity_key: check.identityKey,
      p_action: check.action,
      p_max_requests: check.maxRequests,
      p_window_seconds: check.windowSeconds,
    })
    .single<{ allowed: boolean; retry_after_seconds: number }>();

  if (error || !data) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: data.allowed,
    retryAfterSeconds: data.retry_after_seconds,
  };
}
