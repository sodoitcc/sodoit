"use client";

import {
  ArrowLeft,
  BookOpen,
  FileSpreadsheet,
  LayoutDashboard,
  MapPin,
  Sparkles,
  Tag,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../ui";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/experiences",
    label: "Ticks",
    icon: Sparkles,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: Tag,
  },
  {
    href: "/admin/tags",
    label: "Tags",
    icon: Tags,
  },
  {
    href: "/admin/guides",
    label: "Guides",
    icon: BookOpen,
  },
  {
    href: "/admin/places",
    label: "Places",
    icon: MapPin,
  },
  {
    href: "/admin/imports",
    label: "Imports",
    icon: FileSpreadsheet,
  },
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Logo size="sm" />

          <div>
            <p className="mt-1 text-[11px] font-medium leading-none text-muted">
              Admin
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-3 py-5">
        <nav>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "group flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent-wash text-accent-dark"
                        : "text-secondary hover:bg-surface-subtle hover:text-ink",
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-4 w-4 shrink-0",
                        active
                          ? "text-accent"
                          : "text-muted transition-colors group-hover:text-secondary",
                      ].join(" ")}
                    />

                    <span className="flex-1">{item.label}</span>

                    {active && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border p-3">
        <Link
          href="/"
          className="flex h-10 items-center gap-3 rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sodoit
        </Link>
      </div>
    </aside>
  );
}
