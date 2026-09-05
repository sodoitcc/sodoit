import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface CategoryNavItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  active: boolean;
  href?: string;
  onClick?: () => void;
}

interface CategoryNavProps {
  items: CategoryNavItem[];
  ariaLabel: string;
}

function ItemContent({
  icon: Icon,
  label,
  active,
}: Pick<CategoryNavItem, "icon" | "label" | "active">) {
  return (
    <>
      {Icon && (
        <Icon
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 ${
            active ? "text-accent" : "text-muted"
          }`}
          strokeWidth={2}
        />
      )}

      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
          active ? "bg-accent" : "bg-transparent"
        }`}
      />

      <span>{label}</span>
    </>
  );
}

export function CategoryNav({ items, ariaLabel }: CategoryNavProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={[
        "scrollbar-hide flex min-w-0 items-center overflow-x-auto",
        "-mx-4 px-4 sm:-mx-6 sm:px-6",
        "lg:mx-0 lg:gap-0 lg:overflow-visible lg:px-0",
      ].join(" ")}
    >
      {items.map((item) => {
        const className = [
          "inline-flex h-11 shrink-0 items-center whitespace-nowrap",
          "gap-1.5 px-2.5 text-sm",
          "transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
          "lg:px-2",
          item.active
            ? "font-semibold text-ink"
            : "font-medium text-secondary hover:text-ink",
        ].join(" ");

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={className}
            >
              <ItemContent
                icon={item.icon}
                label={item.label}
                active={item.active}
              />
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={item.active}
            onClick={item.onClick}
            className={className}
          >
            <ItemContent
              icon={item.icon}
              label={item.label}
              active={item.active}
            />
          </button>
        );
      })}
    </div>
  );
}
