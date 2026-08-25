import type { ReactNode } from "react";

interface HeroToolbarProps {
  search: ReactNode;
  children: ReactNode;
  className?: string;
}

export function HeroToolbar({
  search,
  children,
  className = "",
}: HeroToolbarProps) {
  return (
    <div
      className={[
        "relative w-full max-w-[640px] overflow-visible",
        "sm:rounded-panel sm:border sm:border-border/60 sm:bg-surface/90",
        "sm:p-3.5 sm:shadow-md sm:backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      {search}

      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 overflow-visible sm:mt-3 sm:flex-nowrap sm:gap-2">
        {children}
      </div>
    </div>
  );
}
