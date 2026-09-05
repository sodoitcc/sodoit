"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import { EXPERIENCE_TYPES, LOCATION_SCOPES } from "@/lib/experiences/taxonomy";
import { LOCATION_LABELS, TYPE_LABELS } from "../browse-filters";
import { DIFFICULTIES } from "../types";

interface BrowseFiltersProps {
  open: boolean;
  onClose: () => void;
  type: ExperienceType | null;
  onTypeChange: (type: ExperienceType | null) => void;
  difficulty: string | null;
  onDifficultyChange: (difficulty: string | null) => void;
  locationScope: LocationScope | null;
  onLocationScopeChange: (locationScope: LocationScope | null) => void;
  onClearAll: () => void;
  resultCount: number | null;
}

const DIFFICULTY_OPTIONS = ["All", ...DIFFICULTIES.map(({ label }) => label)];

function FilterOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        "inline-flex min-h-10 items-center rounded-lg px-3",
        "text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
        selected
          ? "bg-surface-subtle font-semibold text-ink"
          : "font-medium text-secondary hover:bg-surface-subtle hover:text-ink",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={[
            "h-1.5 w-1.5 rounded-full transition-colors",
            selected ? "bg-accent" : "bg-transparent",
          ].join(" ")}
        />
        {label}
      </span>
    </button>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div role="group" aria-label={title} className="mt-2 flex flex-wrap gap-1">
        {children}
      </div>
    </section>
  );
}

export function BrowseFilters({
  open,
  onClose,
  type,
  onTypeChange,
  difficulty,
  onDifficultyChange,
  locationScope,
  onLocationScopeChange,
  onClearAll,
  resultCount,
}: BrowseFiltersProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    panelRef.current?.focus();

    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const previousOverflow = document.body.style.overflow;

    if (isMobile) {
      document.body.style.overflow = "hidden";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/10 sm:hidden"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Filters"
        aria-modal="true"
        tabIndex={-1}
        className={[
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col",
          "rounded-t-3xl bg-surface outline-none",
          "pb-[env(safe-area-inset-bottom)]",
          "sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2",
          "sm:w-[340px] sm:max-h-none sm:rounded-2xl",
          "sm:border sm:border-border/70 sm:pb-0 sm:shadow-popover",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-5 sm:pt-4">
          <h2 className="text-base font-semibold text-ink">Filters</h2>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClearAll}
              className="min-h-10 px-2 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Clear all
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 sm:h-9 sm:w-9"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 sm:px-5">
          <div className="space-y-5">
            <FilterSection title="Type">
              <FilterOption
                label="All"
                selected={type === null}
                onClick={() => onTypeChange(null)}
              />

              {EXPERIENCE_TYPES.map((option) => (
                <FilterOption
                  key={option}
                  label={TYPE_LABELS[option]}
                  selected={option === type}
                  onClick={() => onTypeChange(option)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Intensity">
              {DIFFICULTY_OPTIONS.map((option) => (
                <FilterOption
                  key={option}
                  label={option}
                  selected={option === (difficulty ?? "All")}
                  onClick={() =>
                    onDifficultyChange(option === "All" ? null : option)
                  }
                />
              ))}
            </FilterSection>

            <FilterSection title="Location">
              <FilterOption
                label="All"
                selected={locationScope === null}
                onClick={() => onLocationScopeChange(null)}
              />

              {LOCATION_SCOPES.map((option) => (
                <FilterOption
                  key={option}
                  label={LOCATION_LABELS[option]}
                  selected={option === locationScope}
                  onClick={() => onLocationScopeChange(option)}
                />
              ))}
            </FilterSection>
          </div>
        </div>

        <div className="border-t border-border/70 px-5 pb-4 pt-3 sm:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            Show {resultCount === null ? "results" : `${resultCount} results`}
          </button>
        </div>
      </div>
    </>
  );
}
