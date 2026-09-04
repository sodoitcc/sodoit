import Link from "next/link";
import { Logo } from "@/components/ui";

const LINKS = [
  { href: "/", label: "Browse" },
  { href: "/discovery", label: "Discovery" },
  { href: "/feed", label: "Feed" },
  { href: "/list", label: "My List" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Logo size="lg" />

            <p className="mt-4 max-w-md text-2xl font-semibold leading-tight tracking-tight text-ink">
              You made it to the bottom.
              <br />
              Now go do something.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex max-w-xl flex-wrap gap-x-5 gap-y-3 lg:justify-end"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-secondary transition-colors hover:text-orange-500"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
          <p className="text-xs text-muted">© 2026 Sodoit</p>

          <div className="flex items-center gap-2 text-xs font-medium text-secondary">
            <span className="text-orange-500">✿</span>
            <span>So do it.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
