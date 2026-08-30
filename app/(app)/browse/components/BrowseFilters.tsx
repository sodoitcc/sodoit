"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import { EXPERIENCE_TYPES, LOCATION_SCOPES } from "@/lib/experiences/taxonomy";
import { BrowseChip } from "./BrowseChip";
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
}

const DIFFICULTY_OPTIONS = ["All", ...DIFFICULTIES.map(({ label }) => label)];

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
}: BrowseFiltersProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/20 sm:hidden"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-label="Browse filters"
        tabIndex={-1}
        className={[
          "fixed inset-x-0 bottom-0 z-50 bg-surface p-5 outline-none",
          "rounded-t-panel border-t border-border",

          "sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2",
          "sm:w-[300px] sm:rounded-panel sm:border sm:border-border",
          "sm:p-4 sm:shadow-popover",
        ].join(" ")}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Filters</h2>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-semibold text-accent-dark hover:text-accent"
            >
              Clear all
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="inline-flex h-8 w-8 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Type
            </h3>

            <div
              role="group"
              aria-label="Type"
              className="flex flex-wrap gap-1"
            >
              <BrowseChip
                selected={type === null}
                onClick={() => onTypeChange(null)}
              >
                All
              </BrowseChip>
              {EXPERIENCE_TYPES.map((option) => (
                <BrowseChip
                  key={option}
                  selected={option === type}
                  onClick={() => onTypeChange(option)}
                >
                  {TYPE_LABELS[option]}
                </BrowseChip>
              ))}
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Intensity
            </h3>

            <div
              role="group"
              aria-label="Intensity"
              className="flex flex-wrap gap-1"
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <BrowseChip
                  key={option}
                  selected={option === (difficulty ?? "All")}
                  onClick={() =>
                    onDifficultyChange(option === "All" ? null : option)
                  }
                >
                  {option}
                </BrowseChip>
              ))}
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              Location
            </h3>

            <div
              role="group"
              aria-label="Location"
              className="flex flex-wrap gap-1"
            >
              <BrowseChip
                selected={locationScope === null}
                onClick={() => onLocationScopeChange(null)}
              >
                All
              </BrowseChip>
              {LOCATION_SCOPES.map((option) => (
                <BrowseChip
                  key={option}
                  selected={option === locationScope}
                  onClick={() => onLocationScopeChange(option)}
                >
                  {LOCATION_LABELS[option]}
                </BrowseChip>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
