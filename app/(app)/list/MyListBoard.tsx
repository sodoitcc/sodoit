"use client";

import { useState } from "react";
import { TaskRow } from "@/app/(app)/browse/components/TaskRow";
import { toggleCompletion, removeFromMyList } from "@/app/(app)/browse/actions";
import type { Experience, ListStatus } from "@/app/(app)/browse/types";

const TABS: { key: ListStatus; label: string }[] = [
  { key: "saved", label: "Want to do" },
  { key: "completed", label: "Completed" },
];

const ANIMATION_DELAY_MS = 700;

interface Row {
  experience: Experience;
  status: ListStatus;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function MyListBoard({
  saved,
  completed,
}: {
  saved: Experience[];
  completed: Experience[];
}) {
  const [tab, setTab] = useState<ListStatus>("saved");

  const [rows, setRows] = useState<Row[]>(() => [
    ...saved.map((experience) => ({
      experience,
      status: "saved" as const,
    })),
    ...completed.map((experience) => ({
      experience,
      status: "completed" as const,
    })),
  ]);

  const [pending, setPending] = useState<Set<string>>(() => new Set());

  async function toggle(id: string, currentStatus: ListStatus): Promise<void> {
    const wasCompleted = currentStatus === "completed";

    setPending((previous) => {
      const next = new Set(previous);
      next.add(id);
      return next;
    });

    const nextStatus: ListStatus = wasCompleted ? "saved" : "completed";

    try {
      await toggleCompletion(id, wasCompleted);

      await delay(ANIMATION_DELAY_MS);

      setRows((previous) =>
        previous.map((row) =>
          row.experience.id === id ? { ...row, status: nextStatus } : row,
        ),
      );
    } finally {
      setPending((previous) => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    }
  }

  async function remove(id: string): Promise<void> {
    const removedRow = rows.find((row) => row.experience.id === id);

    setRows((previous) => previous.filter((row) => row.experience.id !== id));

    try {
      await removeFromMyList(id);
    } catch (error) {
      if (removedRow) {
        setRows((previous) => [...previous, removedRow]);
      }

      throw error;
    }
  }

  const visible = rows.filter((row) => row.status === tab);

  const savedCount = rows.filter((row) => row.status === "saved").length;

  const completedCount = rows.filter(
    (row) => row.status === "completed",
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">My List</h1>

        <div
          role="tablist"
          aria-label="My List sections"
          className="flex w-fit gap-1 rounded-control border border-border bg-white p-1"
        >
          {TABS.map(({ key, label }) => {
            const count = key === "saved" ? savedCount : completedCount;

            const selected = tab === key;

            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(key)}
                className={`h-8 rounded-control px-3 text-xs font-semibold transition-colors ${
                  selected
                    ? "bg-accent text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          {tab === "saved"
            ? "Nothing saved yet. Add tasks from Browse to see them here."
            : "Nothing completed yet."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((row) => {
            const isPending = pending.has(row.experience.id);
            const actualDone = row.status === "completed";
            const done = isPending ? !actualDone : actualDone;

            return (
              <TaskRow
                key={row.experience.id}
                experience={row.experience}
                done={done}
                onToggle={() => toggle(row.experience.id, row.status)}
                onRemove={() => void remove(row.experience.id)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
