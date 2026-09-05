import { ReactNode } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/contact", label: "Contact" },
] as const;

type LegalHref = (typeof NAV_ITEMS)[number]["href"];

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  active: LegalHref;
  children: ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  active,
  children,
}: LegalLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 xl:px-8 xl:py-12">
      <header className="max-w-[800px]">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-secondary sm:text-base">
          {subtitle}
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <span>Sodoit Legal</span>
          <span aria-hidden="true">·</span>
          <span>Updated September 2026</span>
        </div>
      </header>

      <div className="mt-10 grid items-start gap-10 xl:grid-cols-[170px_800px_1fr] xl:gap-16">
        <nav
          aria-label="Legal pages"
          className="flex gap-5 overflow-x-auto pb-3 xl:sticky xl:top-24 xl:flex-col xl:gap-3 xl:overflow-visible xl:pb-0"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === active;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex shrink-0 items-center gap-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                  isActive
                    ? "font-semibold text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isActive
                      ? "bg-accent"
                      : "bg-transparent group-hover:bg-border"
                  }`}
                />

                {item.label}
              </Link>
            );
          })}
        </nav>

        <article className="w-full min-w-0">{children}</article>
      </div>
    </div>
  );
}
