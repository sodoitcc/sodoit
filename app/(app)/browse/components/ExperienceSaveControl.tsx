"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Check } from "lucide-react";
import { loginHrefWithNext } from "@/lib/auth-redirect";

interface ExperienceSaveControlProps {
  mode: "guest" | "toggle";
  done?: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  className?: string;
}

const BASE_CLASS = [
  "pointer-events-auto relative z-20 inline-flex h-9 w-9 shrink-0",
  "items-center justify-center rounded-control border backdrop-blur-sm",
  "transition-colors duration-200 outline-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
];

export function ExperienceSaveControl({
  mode,
  done = false,
  onClick,
  disabled = false,
  label,
  className = "",
}: ExperienceSaveControlProps) {
  const pathname = usePathname();
  const isComplete = mode === "toggle" && done;

  const icon = isComplete ? (
    <Check aria-hidden="true" className="h-4 w-4" strokeWidth={3} />
  ) : (
    <Bookmark aria-hidden="true" className="h-4 w-4" />
  );

  const stateClass = isComplete
    ? "border-accent bg-accent text-white"
    : "border-border/70 bg-surface/90 text-ink hover:border-border-strong";

  if (mode === "guest") {
    return (
      <Link
        href={loginHrefWithNext(pathname)}
        role="button"
        aria-label={label}
        className={[...BASE_CLASS, stateClass, className].join(" ")}
      >
        {icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        ...BASE_CLASS,
        "disabled:pointer-events-none disabled:opacity-60",
        stateClass,
        className,
      ].join(" ")}
    >
      {icon}
    </button>
  );
}
