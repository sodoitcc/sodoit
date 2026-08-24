import type { ButtonHTMLAttributes } from "react";

export const CONTROL_BASE = [
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5",
  "rounded-control border text-[13px] font-semibold transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
  "sm:h-9",
].join(" ");

export const CONTROL_IDLE =
  "border-border bg-surface text-secondary hover:border-border-strong hover:text-ink";

export const CONTROL_ACTIVE =
  "border-accent/40 bg-accent-wash text-accent-dark";

interface BrowseChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function BrowseChip({
  selected = false,
  className = "",
  ...props
}: BrowseChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        CONTROL_BASE,
        "px-4",
        selected ? CONTROL_ACTIVE : CONTROL_IDLE,
        className,
      ].join(" ")}
      {...props}
    />
  );
}
