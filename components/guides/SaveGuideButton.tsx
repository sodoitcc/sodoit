"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark } from "lucide-react";
import { loginHrefWithNext } from "@/lib/auth-redirect";
import { saveGuideAction, unsaveGuideAction } from "@/app/(app)/guides/actions";

const BASE_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-60";

interface SaveGuideButtonProps {
  guideId: string;
  signedIn: boolean;
  initialSaved: boolean;
}

export function SaveGuideButton({
  guideId,
  signedIn,
  initialSaved,
}: SaveGuideButtonProps) {
  const pathname = usePathname();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  const stateClass = saved
    ? "border-accent/50 bg-accent-wash text-accent-dark"
    : "border-border bg-surface text-ink hover:border-border-strong";

  if (!signedIn) {
    return (
      <Link
        href={loginHrefWithNext(pathname)}
        className={`${BASE_CLASS} ${stateClass}`}
      >
        <Bookmark aria-hidden="true" className="h-4 w-4" />
        Save guide
      </Link>
    );
  }

  function toggle() {
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      try {
        await (next ? saveGuideAction(guideId) : unsaveGuideAction(guideId));
      } catch {
        setSaved(!next);
      }
    });
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      disabled={isPending}
      onClick={toggle}
      className={`${BASE_CLASS} ${stateClass}`}
    >
      <Bookmark
        aria-hidden="true"
        className="h-4 w-4"
        fill={saved ? "currentColor" : "none"}
      />
      {saved ? "Saved" : "Save guide"}
    </button>
  );
}
