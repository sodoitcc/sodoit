"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { getSafeNextPath } from "@/lib/auth-redirect";
import { INPUT_CLASS, PasswordField } from "../PasswordField";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeNext = getSafeNextPath(next);
  const signupHref = `/signup?next=${encodeURIComponent(safeNext)}`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        if (signInError.code === "email_not_confirmed") {
          window.location.assign(
            `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&next=${encodeURIComponent(safeNext)}`,
          );
          return;
        }

        setError("Incorrect email or password.");
        return;
      }

      if (signInData.user && !signInData.user.email_confirmed_at) {
        window.location.assign(
          `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&next=${encodeURIComponent(safeNext)}`,
        );
        return;
      }

      window.location.assign(safeNext);
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Welcome back</h1>

      <p className="mt-1.5 text-sm text-muted">
        Log in to continue where you left off.
      </p>

      <form
        onSubmit={handleSubmit}
        method="post"
        className="mt-7 flex flex-col gap-4"
      >
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

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 rounded-control bg-accent text-[15px] font-bold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        {error && (
          <p
            role="alert"
            className="rounded-control border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600"
          >
            {error}
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Don&apos;t have an account?{" "}
        <Link href={signupHref} className="font-semibold text-accent">
          Create account
        </Link>
      </p>
    </div>
  );
}
