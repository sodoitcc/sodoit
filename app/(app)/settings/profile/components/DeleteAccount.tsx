"use client";

import { useState, useTransition } from "react";
import posthog from "posthog-js";
import { Card } from "@/components/ui";
import { deleteAccount } from "../actions";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const confirmed = confirmation === "DELETE";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirmed || isPending) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteAccount(confirmation);
        setError(result.error ?? "Could not delete your account.");
      } catch (error) {
        posthog.capture("account_deleted");
        posthog.reset();
        throw error;
      }
    });
  }

  return (
    <Card className="border-red-200">
      <section aria-labelledby="danger-zone-title">
        <h2 id="danger-zone-title" className="text-base font-bold text-red-700">
          Danger zone
        </h2>
        <h3 className="mt-4 text-sm font-semibold text-ink">Delete account</h3>
        <p className="mt-1 text-sm text-muted">
          Permanently delete your account and personal data. This cannot be
          undone.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 min-h-10 rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
          >
            Delete account
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="delete-account-confirmation"
                className="block text-sm font-semibold text-ink"
              >
                Type DELETE to confirm
              </label>
              <input
                id="delete-account-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={isPending}
                autoComplete="off"
                spellCheck={false}
                className="mt-1.5 w-full rounded-md border border-red-200 bg-white px-3.5 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={!confirmed || isPending}
                className="min-h-10 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Permanently delete account"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setConfirming(false);
                  setConfirmation("");
                  setError(null);
                }}
                className="min-h-10 rounded-md px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-border/30 hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </Card>
  );
}
