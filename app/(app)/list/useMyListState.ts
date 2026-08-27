"use client";

import { useState } from "react";
import { setListStatus, removeFromMyList } from "@/app/(app)/browse/actions";
import type { Experience, ListStatus } from "@/app/(app)/browse/types";

export type MyListStatus = "all" | ListStatus;

interface Entry {
  experience: Experience;
  status: ListStatus;
}

export function useMyListState(saved: Experience[], completed: Experience[]) {
  const [entries, setEntries] = useState<Entry[]>(() => [
    ...saved.map((experience) => ({ experience, status: "saved" as const })),
    ...completed.map((experience) => ({
      experience,
      status: "completed" as const,
    })),
  ]);

  const [status, setStatus] = useState<MyListStatus>("all");
  const [search, setSearch] = useState("");

  const isEmpty = entries.length === 0;

  const searched = search.trim()
    ? entries.filter((entry) =>
        entry.experience.title
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      )
    : entries;

  const visible = searched.filter(
    (entry) => status === "all" || entry.status === status,
  );

  const completedIds = new Set(
    entries
      .filter((entry) => entry.status === "completed")
      .map((entry) => entry.experience.id),
  );

  async function toggle(id: string): Promise<void> {
    const entry = entries.find((row) => row.experience.id === id);
    if (!entry) return;

    const nextStatus: ListStatus =
      entry.status === "completed" ? "saved" : "completed";

    setEntries((previous) =>
      previous.map((row) =>
        row.experience.id === id ? { ...row, status: nextStatus } : row,
      ),
    );

    try {
      await setListStatus(id, nextStatus);
    } catch (error) {
      setEntries((previous) =>
        previous.map((row) =>
          row.experience.id === id ? { ...row, status: entry.status } : row,
        ),
      );
      throw error;
    }
  }

  async function remove(id: string): Promise<void> {
    const removedEntry = entries.find((row) => row.experience.id === id);

    setEntries((previous) =>
      previous.filter((row) => row.experience.id !== id),
    );

    try {
      await removeFromMyList(id);
    } catch (error) {
      if (removedEntry) {
        setEntries((previous) => [...previous, removedEntry]);
      }
      throw error;
    }
  }

  return {
    entries,
    status,
    setStatus,
    search,
    setSearch,
    isEmpty,
    visible,
    completedIds,
    toggle,
    remove,
  };
}
