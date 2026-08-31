"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { PasswordField } from "../PasswordField";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setError(null);

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("This reset link is invalid or has expired. Request a new one.");
      setPending(false);
      return;
    }

    await supabase.auth.signOut();
    posthog.reset();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">
        Choose a new password
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Use at least {PASSWORD_MIN_LENGTH} characters.
      </p>

      <form
        method="post"
        onSubmit={handleSubmit}
        className="mt-7 flex flex-col gap-4"
      >
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
        />

        <PasswordField
          id="confirm-password"
          label="Confirm password"
          value={confirmation}
          onChange={setConfirmation}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
        />

        <button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 rounded-md bg-accent text-[15px] font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-70"
        >
          {pending ? "Updating..." : "Update password"}
        </button>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600"
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
