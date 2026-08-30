"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSafeNextPath } from "@/lib/auth-redirect";
import { INPUT_CLASS, PasswordField } from "../PasswordField";
import { passwordStrength } from "@/lib/password";
import { PASSWORD_MIN_LENGTH, USERNAME_RE } from "@/lib/validation";
import { checkSignupRateLimit } from "./actions";

const STRENGTH_COLORS = ["#DC2626", "#F97316", "#EAB308", "#16A34A"];

const DISPLAY_NAME_MAX_LENGTH = 80;

export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = passwordStrength(password);
  const safeNext = getSafeNextPath(next);
  const loginHref = `/login?next=${encodeURIComponent(safeNext)}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setUsernameError(null);

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!USERNAME_RE.test(normalizedUsername)) {
      setUsernameError(
        "Username must be 3-24 lowercase letters, numbers, underscores, or dashes.",
      );
      return;
    }

    if (
      !normalizedDisplayName ||
      normalizedDisplayName.length > DISPLAY_NAME_MAX_LENGTH
    ) {
      setError(
        `Your name must be ${DISPLAY_NAME_MAX_LENGTH} characters or fewer.`,
      );
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setLoading(true);

    try {
      const rateLimit = await checkSignupRateLimit();
      if (!rateLimit.allowed) {
        setError("Too many signup attempts. Please try again later.");
        return;
      }

      const supabase = createClient();

      const { data: existing, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", normalizedUsername)
        .maybeSingle();

      if (lookupError) {
        setError(
          "Could not create your account. Please check your details and try again.",
        );
        return;
      }

      if (existing) {
        setUsernameError("This username is already taken");
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            username: normalizedUsername,
            display_name: normalizedDisplayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            safeNext,
          )}`,
        },
      });

      if (signUpError) {
        setError(
          "Could not create your account. Please check your details and try again.",
        );
        return;
      }

      router.push(
        `/verify-email?email=${encodeURIComponent(normalizedEmail)}&next=${encodeURIComponent(safeNext)}`,
      );
      return;
    } catch {
      setError(
        "Could not create your account. Please check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Create your account</h1>

      <p className="mt-2 text-sm text-muted">Start building your list.</p>

      <form
        method="post"
        onSubmit={handleSubmit}
        className="mt-7 flex flex-col gap-3"
      >
        <div>
          <label
            htmlFor="displayName"
            className="mb-1.5 block text-[13px] font-semibold text-ink"
          >
            Your name
          </label>

          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            placeholder="Jan Novák"
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="username"
            className="mb-1.5 block text-[13px] font-semibold text-ink"
          >
            Username
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">
              @
            </span>

            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="jannovak"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value.toLowerCase());
                setUsernameError(null);
              }}
              className={INPUT_CLASS}
              style={{ paddingLeft: 26 }}
            />
          </div>

          {usernameError && (
            <p className="mt-1.5 text-xs text-red-600">{usernameError}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[13px] font-semibold text-ink"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
          />

          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-[3px] flex-1 rounded-full"
                style={{
                  background:
                    index < strength
                      ? STRENGTH_COLORS[strength - 1]
                      : "#E7E5E4",
                }}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 rounded-md bg-accent text-[15px] font-bold text-white transition-colors hover:bg-accent-dark disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Create account"}
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

      <p className="mt-6 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
