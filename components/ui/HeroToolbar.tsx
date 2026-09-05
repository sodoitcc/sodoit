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
    <div className={`relative w-full ${className}`}>
      <div className="w-full lg:max-w-[640px]">{search}</div>

      <div className="mt-3 min-w-0 sm:mt-4">{children}</div>
    </div>
  );
}
