"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { ADMIN_INPUT_CLASS } from "@/components/admin/AdminField";
import { applyExperienceRecategorization } from "@/lib/admin/recategorize/actions";
import type { RecategorizeRow } from "@/lib/admin/recategorize/queries";
import { EXPERIENCE_TYPES, LOCATION_SCOPES } from "@/lib/experiences/taxonomy";
import type { ExperienceCategory } from "@/lib/experiences/taxonomy";

interface RecategorizeTableProps {
  rows: RecategorizeRow[];
  categories: ExperienceCategory[];
}

type FilterValue = "all" | "review" | "missing";

interface RowState {
  selected: boolean;
  categoryId: string;
  experienceType: string;
  locationScope: string;
}

function buildInitialState(rows: RecategorizeRow[]): Record<string, RowState> {
  const state: Record<string, RowState> = {};
  for (const row of rows) {
    state[row.id] = {
      selected: row.defaultSelected,
      categoryId: row.proposedCategoryId ?? row.currentCategoryId ?? "",
      experienceType:
        row.proposedExperienceType ?? row.currentExperienceType ?? "",
      locationScope:
        row.proposedLocationScope ?? row.currentLocationScope ?? "",
    };
  }
  return state;
}

function matchesFilter(row: RecategorizeRow, filter: FilterValue): boolean {
  if (filter === "review") return row.status === "review";
  if (filter === "missing") return row.currentCategoryId === null;
  return true;
}

export function RecategorizeTable({
  rows,
  categories,
}: RecategorizeTableProps) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");
  const [rowState, setRowState] = useState(() => buildInitialState(rows));
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active),
    [categories],
  );

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (query && !row.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [rows, filter, search]);

  const selectedCount = Object.values(rowState).filter(
    (row) => row.selected,
  ).length;

  function updateRow(id: string, patch: Partial<RowState>) {
    setRowState((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  function handleApply() {
    setError(null);
    setSummary(null);

    const updates = rows
      .filter((row) => rowState[row.id]?.selected)
      .map((row) => ({
        id: row.id,
        primary_category_id: rowState[row.id].categoryId || null,
        experience_type: rowState[row.id].experienceType || null,
        location_scope: rowState[row.id].locationScope || null,
      }));

    if (updates.length === 0) {
      setError("Select at least one row to apply.");
      return;
    }

    startTransition(async () => {
      const result = await applyExperienceRecategorization(updates);

      if (!result.success) {
        setError(result.error ?? "Could not apply the changes.");
        return;
      }

      setSummary(`Applied changes to ${result.updatedCount} tick(s).`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as FilterValue)}
          className={`${ADMIN_INPUT_CLASS} w-auto`}
        >
          <option value="all">All</option>
          <option value="review">Needs review</option>
          <option value="missing">Missing primary category</option>
        </select>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title..."
          className={`${ADMIN_INPUT_CLASS} w-64`}
        />

        <span className="text-sm text-muted">
          {selectedCount} of {rows.length} selected
        </span>

        <Button type="button" onClick={handleApply} disabled={isPending}>
          {isPending ? "Applying..." : "Apply selected"}
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-control border border-danger/20 bg-danger-light px-3.5 py-2.5 text-[13px] text-danger"
        >
          {error}
        </p>
      )}

      {summary && (
        <p className="text-[13px] font-medium text-success">{summary}</p>
      )}

      {visibleRows.length === 0 ? (
        <p className="rounded-control border border-dashed border-border p-6 text-center text-sm text-muted">
          No ticks match this filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-border">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-3">Apply</th>
                <th className="px-3 py-3">Tick</th>
                <th className="px-3 py-3">Current category</th>
                <th className="px-3 py-3">Proposed category</th>
                <th className="px-3 py-3">Proposed type</th>
                <th className="px-3 py-3">Proposed scope</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {visibleRows.map((row) => {
                const state = rowState[row.id];
                const currentCategory = row.currentCategoryId
                  ? (categoryById.get(row.currentCategoryId)?.name ?? "—")
                  : "—";

                return (
                  <tr
                    key={row.id}
                    className="align-top hover:bg-surface-subtle"
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={(event) =>
                          updateRow(row.id, { selected: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink">{row.title}</p>
                      <p className="text-xs text-muted">
                        {row.legacyCategory ?? "No legacy category"}
                        {row.difficulty ? ` · ${row.difficulty}` : ""}
                        {row.isPublic ? "" : " · Hidden"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-secondary">
                      {currentCategory}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={state.categoryId}
                        onChange={(event) =>
                          updateRow(row.id, { categoryId: event.target.value })
                        }
                        className={ADMIN_INPUT_CLASS}
                      >
                        <option value="">—</option>
                        {activeCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={state.experienceType}
                        onChange={(event) =>
                          updateRow(row.id, {
                            experienceType: event.target.value,
                          })
                        }
                        className={ADMIN_INPUT_CLASS}
                      >
                        <option value="">—</option>
                        {EXPERIENCE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={state.locationScope}
                        onChange={(event) =>
                          updateRow(row.id, {
                            locationScope: event.target.value,
                          })
                        }
                        className={ADMIN_INPUT_CLASS}
                      >
                        <option value="">—</option>
                        {LOCATION_SCOPES.map((scope) => (
                          <option key={scope} value={scope}>
                            {scope}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                          row.status === "high"
                            ? "bg-success-light text-success"
                            : row.status === "medium"
                              ? "bg-accent-wash text-accent-dark"
                              : "bg-surface-subtle text-secondary",
                        ].join(" ")}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
