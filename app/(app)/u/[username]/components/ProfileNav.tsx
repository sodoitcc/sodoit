import Link from "next/link";

type View = "overview" | "list" | "collections" | "achievements";

const TABS: { key: View; label: string; view?: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "list", label: "My List", view: "list" },
  { key: "collections", label: "Collections", view: "collections" },
  { key: "achievements", label: "Achievements", view: "achievements" },
];

export function ProfileNav({
  username,
  active,
}: {
  username: string;
  active: View;
}) {
  return (
    <div
      role="tablist"
      aria-label="Profile sections"
      className="-mx-1 overflow-x-auto border-b border-border px-1"
    >
      <div className="flex min-w-max gap-5">
        {TABS.map((tab) => {
          const href = tab.view
            ? `/u/${username}?view=${tab.view}`
            : `/u/${username}`;
          const selected = active === tab.key;

          return (
            <Link
              key={tab.key}
              href={href}
              role="tab"
              aria-selected={selected}
              className={`border-b-2 py-3 text-xs font-semibold transition-colors ${
                selected
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
