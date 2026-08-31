"use client";

import { useState, useTransition } from "react";
import posthog from "posthog-js";
import { Button, Card } from "@/components/ui";

import { updateProfile } from "../actions";
import { AvatarUpload } from "./AvatarUpload";
import { BIO_MAX_LENGTH } from "@/lib/validation";

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-white px-3.5 py-2.5 text-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

interface ProfileFormProps {
  userId: string;
  initialUsername: string;
  initialBio: string;
  initialAvatarUrl: string | null;
  bare?: boolean;
  onSaved?: () => void;
}

export function ProfileForm({
  userId,
  initialUsername,
  initialBio,
  initialAvatarUrl,
  bare = false,
  onSaved,
}: ProfileFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  const [savedUsername, setSavedUsername] = useState(initialUsername);
  const [savedBio, setSavedBio] = useState(initialBio);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [isPending, startTransition] = useTransition();

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedBio = bio.trim();

  const isDirty =
    normalizedUsername !== savedUsername || normalizedBio !== savedBio;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isDirty || isPending) {
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateProfile({
        username,
        bio,
      });

      if (!result.success) {
        setError(result.error ?? "Could not save changes.");
        return;
      }

      setSavedUsername(normalizedUsername);
      setSavedBio(normalizedBio);
      setUsername(normalizedUsername);
      setBio(normalizedBio);

      posthog.capture("profile_updated", {
        username_changed: normalizedUsername !== savedUsername,
        bio_changed: normalizedBio !== savedBio,
      });
      setSuccess(true);
      onSaved?.();
    });
  }

  const Wrapper = bare ? "div" : Card;

  return (
    <Wrapper className="flex flex-col gap-6">
      <AvatarUpload
        userId={userId}
        username={username || initialUsername}
        avatarUrl={avatarUrl}
        onChange={setAvatarUrl}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              value={username}
              onChange={(event) => {
                setUsername(event.target.value.toLowerCase());
                setSuccess(false);
              }}
              className={`${INPUT_CLASS} pl-7`}
              required
              minLength={3}
              maxLength={24}
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="bio"
            className="mb-1.5 block text-[13px] font-semibold text-ink"
          >
            Bio
          </label>

          <textarea
            id="bio"
            value={bio}
            onChange={(event) => {
              setBio(event.target.value.slice(0, BIO_MAX_LENGTH));
              setSuccess(false);
            }}
            rows={3}
            placeholder="A short line about you"
            className={`${INPUT_CLASS} resize-none`}
          />

          <p className="mt-1 text-right text-xs text-muted">
            {bio.length} / {BIO_MAX_LENGTH}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600"
          >
            {error}
          </p>
        )}

        {success && (
          <p className="text-[13px] font-medium text-green-700">
            Profile updated.
          </p>
        )}

        <Button
          type="submit"
          disabled={isPending || !isDirty}
          className="self-start"
        >
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Wrapper>
  );
}
