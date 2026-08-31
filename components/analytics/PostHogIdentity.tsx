"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

interface PostHogIdentityProps {
  userId?: string;
  username?: string | null;
}

export function PostHogIdentity({ userId, username }: PostHogIdentityProps) {
  useEffect(() => {
    if (!userId) return;

    posthog.identify(userId, username ? { username } : undefined);
  }, [userId, username]);

  return null;
}
