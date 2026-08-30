import { X } from "lucide-react";
import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";
import { LOCATION_LABELS, TYPE_LABELS } from "../browse-filters";

interface ActiveFilterSummaryProps {
  type: ExperienceType | null;
  difficulty: string | null;
  locationScope: LocationScope | null;
  onRemoveType: () => void;
  onRemoveDifficulty: () => void;
  onRemoveLocationScope: () => void;
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-secondary hover:bg-surface-subtle"
    >
      {label}
      <X aria-hidden="true" className="h-3 w-3" />
    </button>
  );
}

export function ActiveFilterSummary({
  type,
  difficulty,
  locationScope,
  onRemoveType,
  onRemoveDifficulty,
  onRemoveLocationScope,
}: ActiveFilterSummaryProps) {
  const hasAny = Boolean(type || difficulty || locationScope);
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {type && <FilterPill label={TYPE_LABELS[type]} onRemove={onRemoveType} />}
      {difficulty && (
        <FilterPill label={difficulty} onRemove={onRemoveDifficulty} />
      )}
      {locationScope && (
        <FilterPill
          label={LOCATION_LABELS[locationScope]}
          onRemove={onRemoveLocationScope}
        />
      )}
    </div>
  );
}
