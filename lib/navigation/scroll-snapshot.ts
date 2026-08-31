const PREFIX = "sodoit:scroll:";

export interface ScrollSnapshot<T = undefined> {
  scrollY: number;
  extra?: T;
}

export function scrollSnapshotKey(pathname: string, search: string): string {
  return `${PREFIX}${pathname}${search ? `?${search}` : ""}`;
}

export function readScrollSnapshot<T = undefined>(
  key: string,
): ScrollSnapshot<T> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ScrollSnapshot<T>) : null;
  } catch {
    return null;
  }
}

export function writeScrollSnapshot<T = undefined>(
  key: string,
  snapshot: ScrollSnapshot<T>,
): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(snapshot));
  } catch {}
}
