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
            className="relative z-[70] shrink-0 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <span className="sm:hidden">
              <Logo size="sm" />
            </span>

            <span className="hidden sm:block">
              <Logo size="lg" />
            </span>
          </Link>

          {!isAuthRoute && (
            <nav
              aria-label="Primary navigation"
              className="absolute left-1/2 hidden h-16 -translate-x-1/2 items-center gap-6 sm:flex md:gap-8"
            >
              {nav.map((item) => {
                const active = isActiveRoute(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "relative flex h-full items-center text-sm font-semibold",
                      "outline-none transition-colors",
                      "focus-visible:text-accent",
                      active ? "text-ink" : "text-secondary hover:text-ink",
                    ].join(" ")}
                  >
                    {item.label}

                    <span
                      aria-hidden="true"
                      className={[
                        "absolute inset-x-0 bottom-0 h-0.5 rounded-pill bg-accent",
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
              <div className="ml-auto hidden items-center sm:flex">
                {signedIn && username ? (
                  <Link
                    href={`/u/${username}`}
                    aria-label="Your profile"
                    className="shrink-0 rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-accent/30"
                  >
                    <Avatar name={username} src={avatarUrl} size="sm" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className={[
                        "inline-flex h-10 items-center justify-center rounded-control px-3",
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
                        "inline-flex h-10 items-center justify-center rounded-control bg-accent px-4",
                        "text-sm font-semibold text-white transition-colors",
                        "hover:bg-accent-hover",
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
                  "relative z-[70] ml-auto flex h-10 w-10 items-center justify-center sm:hidden",
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
            "fixed inset-0 z-50 sm:hidden",
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
              "absolute inset-0 bg-black/20",
              "transition-opacity duration-200",
              mobileMenuOpen ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />

          <div
            id="mobile-navigation"
            className={[
              "absolute inset-x-3 top-[76px]",
              "overflow-hidden rounded-control border border-border",
              "bg-[#FFFDF9]",
              "transition-all duration-250 ease-out",
              mobileMenuOpen
                ? "translate-y-0 opacity-100"
                : "-translate-y-3 opacity-0",
            ].join(" ")}
          >
            <nav aria-label="Mobile navigation" className="p-3">
              {nav.map((item) => {
                const active = isActiveRoute(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      "flex min-h-14 items-center justify-between rounded-control px-4",
                      "text-base font-extrabold tracking-[-0.02em]",
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

            <div className="border-t border-border p-3">
              {signedIn && username ? (
                <Link
                  href={`/u/${username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={[
                    "flex min-h-14 items-center gap-3 rounded-control px-4",
                    "text-sm font-bold text-ink",
                    "transition-colors hover:bg-surface-subtle",
                    "outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  ].join(" ")}
                >
                  <Avatar name={username} src={avatarUrl} size="sm" />

                  <div className="min-w-0">
                    <div className="truncate">{username}</div>

                    <div className="text-xs font-medium text-secondary">
                      View profile
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="grid grid-cols-[0.9fr_1.1fr] gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      "inline-flex h-11 items-center justify-center rounded-control",
                      "text-sm font-bold text-secondary",
                      "transition-colors hover:bg-surface-subtle hover:text-ink",
                      "outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    ].join(" ")}
                  >
                    Log in
                  </Link>

                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      "inline-flex h-11 items-center justify-center rounded-control",
                      "bg-accent px-4 text-sm font-bold text-white",
                      "transition-colors hover:bg-accent-hover",
                      "outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                    ].join(" ")}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
