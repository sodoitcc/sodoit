import type { ReactNode } from "react";

interface GuideHeaderProps {
  typeLabel: string;
  title: string;
  description: string | null;
  metaParts: string[];
  actions: ReactNode;
}

export function GuideHeader({
  typeLabel,
  title,
  description,
  metaParts,
  actions,
}: GuideHeaderProps) {
  return (
    <header className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent-dark">
        Discovery · {typeLabel}
      </p>

      <h1 className="mt-1.5 text-[34px] leading-[1.15] font-extrabold tracking-[-0.02em] text-ink sm:text-4xl sm:leading-tight lg:text-5xl">
        {title}
      </h1>

      {description && (
        <p className="mt-2 line-clamp-2 text-[15px] leading-6 text-secondary sm:text-base">
          {description}
        </p>
      )}

      {metaParts.length > 0 && (
        <p className="mt-2 text-[13px] text-muted sm:text-sm">
          {metaParts.join(" · ")}
        </p>
      )}

      <div className="mt-2.5 sm:mt-3">{actions}</div>
    </header>
  );
}
