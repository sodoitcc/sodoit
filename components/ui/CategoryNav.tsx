"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  CONTROL_ACTIVE,
  CONTROL_BASE,
  CONTROL_IDLE,
} from "@/app/(app)/browse/components/BrowseChip";

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
  primaryCount?: number;
  mobilePrimaryCount?: number;
}

const DEFAULT_PRIMARY_COUNT = 4;
const DEFAULT_MOBILE_PRIMARY_COUNT = 2;
const DESKTOP_BREAKPOINT_PX = 640;

function useIsDesktop(breakpointPx: number) {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(`(min-width: ${breakpointPx}px)`);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(`(min-width: ${breakpointPx}px)`).matches,
    () => false,
  );
}

const MENU_ITEM_CLASS =
  "flex w-full items-center rounded-control px-3 py-1.5 text-left text-xs font-semibold text-secondary transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

const MOBILE_PANEL_ITEM_CLASS =
  "flex items-center rounded-control border border-border/60 bg-surface px-3 py-2 text-left text-xs font-semibold text-secondary transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

function splitItems(items: CategoryNavItem[], primaryCount: number) {
  const primary = items.slice(0, primaryCount);
  const overflow = items.slice(primaryCount);

  const activeOverflow = overflow.find((item) => item.active);
  if (!activeOverflow) return { primary, overflow };

  return {
    primary: [...primary, activeOverflow],
    overflow: overflow.filter((item) => item.key !== activeOverflow.key),
  };
}

function ChipLabel({
  icon: Icon,
  label,
}: Pick<CategoryNavItem, "icon" | "label">) {
  return (
    <>
      {Icon && (
        <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      {label}
    </>
  );
}

function NavChip({ item }: { item: CategoryNavItem }) {
  const className = [
    CONTROL_BASE,
    "gap-1 px-3 sm:gap-1.5 sm:px-4",
    item.active ? CONTROL_ACTIVE : CONTROL_IDLE,
  ].join(" ");

  if (item.href) {
    return (
      <Link
        href={item.href}
        aria-current={item.active ? "page" : undefined}
        className={className}
      >
        <ChipLabel icon={item.icon} label={item.label} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={item.active}
      onClick={item.onClick}
      className={className}
    >
      <ChipLabel icon={item.icon} label={item.label} />
    </button>
  );
}

export function CategoryNav({
  items,
  ariaLabel,
  primaryCount = DEFAULT_PRIMARY_COUNT,
  mobilePrimaryCount = DEFAULT_MOBILE_PRIMARY_COUNT,
}: CategoryNavProps) {
  const [open, setOpen] = useState(false);
  const mobilePanelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop(DESKTOP_BREAKPOINT_PX);

  // On mobile, render one extra "soft" chip beyond mobilePrimaryCount and
  // let CSS reveal it once there's a bit more width (>=400px) — pure CSS,
  // no extra JS breakpoint tier.
  const { primary, overflow } = splitItems(
    items,
    isDesktop ? primaryCount : mobilePrimaryCount + 1,
  );
  const softChipIndex = isDesktop ? -1 : mobilePrimaryCount;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectOverflow(item: CategoryNavItem) {
    setOpen(false);
    item.onClick?.();
  }

  const showDesktopDropdown = open && isDesktop;
  const showMobilePanel = open && !isDesktop;

  return (
    <>
      <div
        role="group"
        aria-label={ariaLabel}
        className="flex shrink-0 items-center gap-1"
      >
        <div className="flex items-center gap-1">
          {primary.map((item, index) =>
            index === softChipIndex ? (
              <span
                key={item.key}
                className="hidden min-[400px]:inline-flex sm:hidden"
              >
                <NavChip item={item} />
              </span>
            ) : (
              <NavChip key={item.key} item={item} />
            ),
          )}
        </div>

        {overflow.length > 0 && (
          <div ref={containerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-haspopup={isDesktop ? "menu" : undefined}
              aria-controls={!isDesktop ? mobilePanelId : undefined}
              className={[
                CONTROL_BASE,
                "px-3 sm:px-3.5",
                open ? CONTROL_ACTIVE : CONTROL_IDLE,
              ].join(" ")}
            >
              More
              <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
            </button>

            {showDesktopDropdown && (
              <div
                role="menu"
                aria-label={`More ${ariaLabel}`}
                className="absolute right-0 top-full z-40 mt-1 w-44 rounded-panel border border-border bg-surface p-1"
              >
                {overflow.map((item) =>
                  item.href ? (
                    <Link
                      key={item.key}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={MENU_ITEM_CLASS}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.key}
                      type="button"
                      role="menuitem"
                      onClick={() => selectOverflow(item)}
                      className={MENU_ITEM_CLASS}
                    >
                      {item.label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showMobilePanel && (
        <div
          id={mobilePanelId}
          className="order-[99] mt-2 w-full basis-full rounded-control border border-border/60 bg-surface/95 p-1.5 sm:hidden"
        >
          <div
            role="group"
            aria-label={`More ${ariaLabel}`}
            className="grid grid-cols-2 gap-1.5"
          >
            {overflow.map((item) =>
              item.href ? (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={MOBILE_PANEL_ITEM_CLASS}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => selectOverflow(item)}
                  className={MOBILE_PANEL_ITEM_CLASS}
                >
                  {item.label}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </>
  );
}
