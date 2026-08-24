import type { ReactNode } from "react";

interface HeroLayoutProps {
  visual: ReactNode;
  children: ReactNode;
  className?: string;
}

export function HeroLayout({
  visual,
  children,
  className = "",
}: HeroLayoutProps) {
  return (
    <div
      className={[
        "mx-auto grid w-full max-w-[1440px] items-center gap-5 px-4",
        "sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:gap-8 lg:px-8",
        className,
      ].join(" ")}
    >
      <div className="relative z-10 max-w-[640px]">{children}</div>

      <div className="relative hidden h-[240px] sm:block lg:h-[330px]">
        {visual}
      </div>
    </div>
  );
}
