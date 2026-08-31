"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Check } from "lucide-react";

import { loginHrefWithNext } from "@/lib/auth-redirect";
import type { ExperienceCardActionState } from "../experience-card-state";

interface SaveDoneButtonsProps {
  state: ExperienceCardActionState;
  guest: boolean;
  title: string;
  onSave: () => void;
  onRemoveSaved: () => void;
  onComplete: () => void;
  onUncomplete: () => void;
  disabled?: boolean;
  className?: string;
}

const BASE_CLASS = [
  "pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center",
  "rounded-control border backdrop-blur-sm",
  "transition-colors duration-200 outline-none",
  "focus-visible:ring-2 focus-visible:ring-accent/30",
  "disabled:pointer-events-none disabled:opacity-60",
];

export function SaveDoneButtons({
  state,
  guest,
  title,
  onSave,
  onRemoveSaved,
  onComplete,
  onUncomplete,
  disabled = false,
  className = "",
}: SaveDoneButtonsProps) {
  const pathname = usePathname();

  const saved = state === "saved";
  const completed = state === "completed";

  const saveLabel = saved
    ? `Remove ${title} from My List`
    : completed
      ? `Move ${title} to Saved`
      : `Save ${title} to My List`;

  const completeLabel = completed
    ? `Mark ${title} as not completed`
    : `Mark ${title} as completed`;

  const saveClass = saved
    ? "border-accent/50 bg-accent-wash text-accent-dark"
    : "border-border/70 bg-surface/90 text-ink hover:border-border-strong hover:bg-surface";

  const completeClass = completed
    ? "border-accent bg-accent text-white"
    : "border-border/70 bg-surface/90 text-ink hover:border-border-strong hover:bg-surface";

  if (guest) {
    const href = loginHrefWithNext(pathname);

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Link
          href={href}
          aria-label={saveLabel}
          className={[...BASE_CLASS, saveClass].join(" ")}
        >
          <Bookmark aria-hidden="true" className="h-4 w-4" />
        </Link>

        <Link
          href={href}
          aria-label={completeLabel}
          className={[...BASE_CLASS, completeClass].join(" ")}
        >
          <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saveLabel}
        disabled={disabled}
        onClick={saved ? onRemoveSaved : onSave}
        className={[...BASE_CLASS, saveClass].join(" ")}
      >
        <Bookmark
          aria-hidden="true"
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
        />
      </button>

      <button
        type="button"
        aria-pressed={completed}
        aria-label={completeLabel}
        disabled={disabled}
        onClick={completed ? onUncomplete : onComplete}
        className={[...BASE_CLASS, completeClass].join(" ")}
      >
        <Check
          aria-hidden="true"
          className="h-4 w-4"
          strokeWidth={completed ? 3 : 2.5}
        />
      </button>
    </div>
  );
}
