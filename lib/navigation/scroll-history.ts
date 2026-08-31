const RESTORE_KEY = "__sodoitScrollRestoreKey";

export function markCurrentHistoryEntryForScrollRestore(key: string): void {
  if (typeof window === "undefined") return;

  window.history.replaceState(
    {
      ...window.history.state,
      [RESTORE_KEY]: key,
    },
    "",
    window.location.href,
  );
}

export function shouldRestoreCurrentHistoryEntry(key: string): boolean {
  if (typeof window === "undefined") return false;

  return window.history.state?.[RESTORE_KEY] === key;
}

export function clearCurrentHistoryEntryScrollRestore(): void {
  if (typeof window === "undefined") return;

  const state = { ...window.history.state };

  delete state[RESTORE_KEY];

  window.history.replaceState(state, "", window.location.href);
}
