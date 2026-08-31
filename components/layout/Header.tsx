"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { Avatar, Logo } from "../ui";

interface HeaderProps {
  signedIn: boolean;
  username?: string | null;
  avatarUrl?: string | null;
}

const BASE_NAV = [
  { href: "/", label: "Browse" },
  { href: "/discovery", label: "Discovery" },
  { href: "/feed", label: "Feed" },
] as const;

const AUTHENTICATED_NAV = [
  ...BASE_NAV,
  { href: "/list", label: "My List" },
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "/browse";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ signedIn, username, avatarUrl }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const nav = signedIn ? AUTHENTICATED_NAV : BASE_NAV;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-[60] border-b border-border bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Sodoit home"
            className={[
              "relative z-[70] flex min-h-11 shrink-0 items-center",
              "rounded-control outline-none",
              "focus-visible:ring-2 focus-visible:ring-accent/30",
            ].join(" ")}
          >
            <span className="lg:hidden">
              <Logo size="md" />
            </span>

            <span className="hidden lg:block">
              <Logo size="lg" />
            </span>
          </Link>

          {!isAuthRoute && (
            <nav
              aria-label="Primary navigation"
              className={[
                "absolute left-1/2 hidden h-16 -translate-x-1/2",
                "items-center gap-1 lg:flex",
              ].join(" ")}
            >
              {nav.map((item) => {
                const active = isActiveRoute(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative inline-flex h-11 items-center justify-center px-3",
                      "rounded-control text-sm font-semibold",
                      "outline-none transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-accent/30",
                      active
                        ? "text-ink"
                        : "text-secondary hover:bg-surface-subtle hover:text-ink",
                    ].join(" ")}
                  >
                    {item.label}

                    <span
                      aria-hidden="true"
                      className={[
                        "absolute bottom-0 left-3 right-3 h-0.5 rounded-pill bg-accent",
                        "origin-center transition-transform duration-200",
                        active ? "scale-x-100" : "scale-x-0",
                      ].join(" ")}
                    />
                  </Link>
                );
              })}
            </nav>
          )}

          {!isAuthRoute && (
            <>
              <div className="ml-auto hidden items-center lg:flex">
                {signedIn ? (
                  <Link
                    href={username ? `/u/${username}` : "/settings/profile"}
                    aria-label="Your profile"
                    className={[
                      "flex h-11 w-11 shrink-0 items-center justify-center",
                      "rounded-full outline-none transition-colors",
                      "hover:bg-surface-subtle",
                      "focus-visible:ring-2 focus-visible:ring-accent/30",
                    ].join(" ")}
                  >
                    <Avatar
                      name={username ?? "You"}
                      src={avatarUrl}
                      size="sm"
                    />
                  </Link>
                ) : (
                  <div className="flex items-center gap-1">
                    <Link
                      href="/login"
                      className={[
                        "inline-flex h-11 items-center justify-center rounded-control px-4",
                        "text-sm font-semibold text-secondary transition-colors",
                        "hover:bg-surface-subtle hover:text-ink",
                        "outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                      ].join(" ")}
                    >
                      Log in
                    </Link>

                    <Link
                      href="/signup"
                      className={[
                        "inline-flex h-11 items-center justify-center rounded-control",
                        "bg-accent px-4 text-sm font-semibold text-white",
                        "transition-colors hover:bg-accent-hover",
                        "outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                      ].join(" ")}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                className={[
                  "relative z-[70] ml-auto flex h-12 w-12 items-center justify-center lg:hidden",
                  "rounded-control text-ink transition-colors",
                  mobileMenuOpen
                    ? "bg-accent-wash text-accent-dark"
                    : "hover:bg-surface-subtle",
                  "outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                ].join(" ")}
              >
                <span className="relative h-5 w-5">
                  <Menu
                    aria-hidden="true"
                    className={[
                      "absolute inset-0 h-5 w-5 transition-all duration-200",
                      mobileMenuOpen
                        ? "rotate-90 scale-75 opacity-0"
                        : "rotate-0 scale-100 opacity-100",
                    ].join(" ")}
                  />

                  <X
                    aria-hidden="true"
                    className={[
                      "absolute inset-0 h-5 w-5 transition-all duration-200",
                      mobileMenuOpen
                        ? "rotate-0 scale-100 opacity-100"
                        : "-rotate-90 scale-75 opacity-0",
                    ].join(" ")}
                  />
                </span>
              </button>
            </>
          )}
        </div>
      </header>

      {!isAuthRoute && (
        <div
          className={[
            "fixed inset-x-0 bottom-0 top-16 z-50 lg:hidden",
            "transition-[visibility] duration-200",
            mobileMenuOpen ? "visible" : "pointer-events-none invisible",
          ].join(" ")}
          aria-hidden={!mobileMenuOpen}
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className={[
              "absolute inset-0 bg-black/20 transition-opacity duration-200",
              mobileMenuOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />

          <div
            id="mobile-navigation"
            className={[
              "relative w-full border-b border-border bg-surface",
              "shadow-[0_12px_30px_rgba(0,0,0,0.06)]",
              "transition-all duration-200 ease-out",
              mobileMenuOpen
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0",
            ].join(" ")}
          >
            <div className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6">
              <nav aria-label="Mobile navigation" className="space-y-1">
                {nav.map((item) => {
                  const active = isActiveRoute(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={[
                        "flex min-h-14 items-center justify-between px-3",
                        "rounded-control text-base font-bold tracking-[-0.015em]",
                        "outline-none transition-colors",
                        active
                          ? "bg-accent-wash text-accent-dark"
                          : "text-ink hover:bg-surface-subtle",
                        "focus-visible:ring-2 focus-visible:ring-accent/30",
                      ].join(" ")}
                    >
                      <span>{item.label}</span>

                      {active && (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full bg-accent"
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-3 border-t border-border pt-3">
                {signedIn ? (
                  <Link
                    href={username ? `/u/${username}` : "/settings/profile"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      "flex min-h-14 items-center gap-3 rounded-control px-3",
                      "text-sm font-bold text-ink",
                      "outline-none transition-colors hover:bg-surface-subtle",
                      "focus-visible:ring-2 focus-visible:ring-accent/30",
                    ].join(" ")}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                      <Avatar
                        name={username ?? "You"}
                        src={avatarUrl}
                        size="md"
                      />
                    </span>

                    <div className="min-w-0">
                      <div className="truncate">
                        {username ?? "Your account"}
                      </div>

                      <div className="mt-0.5 text-xs font-medium text-secondary">
                        View profile
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className={[
                        "inline-flex h-12 items-center justify-center rounded-control",
                        "text-sm font-bold text-secondary",
                        "outline-none transition-colors",
                        "hover:bg-surface-subtle hover:text-ink",
                        "focus-visible:ring-2 focus-visible:ring-accent/30",
                      ].join(" ")}
                    >
                      Log in
                    </Link>

                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className={[
                        "inline-flex h-12 items-center justify-center rounded-control",
                        "bg-accent px-4 text-sm font-bold text-white",
                        "outline-none transition-colors hover:bg-accent-hover",
                        "focus-visible:ring-2 focus-visible:ring-accent/30",
                      ].join(" ")}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
