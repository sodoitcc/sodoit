"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Check, Plus } from "lucide-react";
import { loginHrefWithNext } from "@/lib/auth-redirect";
import type { ExperienceCardActionState } from "../experience-card-state";

interface ExperienceListStateControlProps {
  state: ExperienceCardActionState;
  guest: boolean;
  onSave: () => void;
  onRemoveSaved: () => void;
  onUncomplete: () => void;
  disabled?: boolean;
  title: string;
}

const BASE_CLASS = [
  "pointer-events-auto relative z-20 inline-flex h-9 w-9 shrink-0",
  "items-center justify-center rounded-control border backdrop-blur-sm",
  "transition-colors duration-200 outline-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
];

const STATE_CLASS: Record<ExperienceCardActionState, string> = {
  unsaved: "border-border/70 bg-surface/90 text-ink hover:border-border-strong",
  saved: "border-accent/40 bg-accent-wash text-accent-dark hover:border-accent/60",
  completed: "border-accent bg-accent text-white",
};

const STATE_ICON: Record<ExperienceCardActionState, React.ReactNode> = {
  unsaved: <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />,
  saved: (
    <Bookmark aria-hidden="true" className="h-4 w-4" fill="currentColor" />
  ),
  completed: <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />,
};

export function stateLabel(
  state: ExperienceCardActionState,
  title: string,
): string {
  if (state === "saved") return `Remove ${title} from My List`;
  if (state === "completed") return `${title}: Completed`;
  return `Add ${title} to My List`;
}

export type ExperienceListStateAction = "save" | "removeSaved" | "uncomplete";

export function resolveClickAction(
  state: ExperienceCardActionState,
): ExperienceListStateAction {
  if (state === "saved") return "removeSaved";
  if (state === "completed") return "uncomplete";
  return "save";
}

export function ExperienceListStateControl({
  state,
  guest,
  onSave,
  onRemoveSaved,
  onUncomplete,
  disabled = false,
  title,
}: ExperienceListStateControlProps) {
  const pathname = usePathname();
  const label = stateLabel(state, title);
  const className = [...BASE_CLASS, STATE_CLASS[state]].join(" ");

  if (guest) {
    return (
      <Link
        href={loginHrefWithNext(pathname)}
        role="button"
        aria-label={label}
        className={className}
      >
        {STATE_ICON[state]}
      </Link>
    );
  }

  function handleClick() {
    const action = resolveClickAction(state);
    if (action === "removeSaved") return onRemoveSaved();
    if (action === "uncomplete") return onUncomplete();
    return onSave();
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleClick}
      disabled={disabled}
      className={[
        ...BASE_CLASS,
        STATE_CLASS[state],
        "disabled:pointer-events-none disabled:opacity-60",
      ].join(" ")}
    >
      {STATE_ICON[state]}
    </button>
  );
}
