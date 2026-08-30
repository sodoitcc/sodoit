import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type RequireVerifiedUserResult =
  { ok: true; userId: string } | { ok: false; error: string };

export function isEmailVerified(user: Pick<User, "email_confirmed_at">) {
  return Boolean(user.email_confirmed_at);
}

export async function requireVerifiedUser(): Promise<RequireVerifiedUserResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  if (!isEmailVerified(user)) {
    return { ok: false, error: "Please verify your email first." };
  }

  return { ok: true, userId: user.id };
}
