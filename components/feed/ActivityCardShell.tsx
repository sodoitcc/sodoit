import type { HTMLAttributes } from "react";

export function ActivityCardShell({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={[
        "overflow-hidden rounded-card border border-border bg-surface",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
