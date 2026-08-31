import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readScrollSnapshot,
  scrollSnapshotKey,
  writeScrollSnapshot,
} from "@/lib/navigation/scroll-snapshot";

describe("scrollSnapshotKey", () => {
  it("combines pathname and search into a stable key", () => {
    expect(scrollSnapshotKey("/", "category=adventure")).toBe(
      "sodoit:scroll:/?category=adventure",
    );
  });

  it("omits the query separator when there is no search", () => {
    expect(scrollSnapshotKey("/discovery", "")).toBe(
      "sodoit:scroll:/discovery",
    );
  });

  it("produces different keys for different pathnames", () => {
    expect(scrollSnapshotKey("/", "")).not.toBe(scrollSnapshotKey("/list", ""));
  });

  it("produces different keys for the same pathname with different search params", () => {
    expect(scrollSnapshotKey("/", "category=adventure")).not.toBe(
      scrollSnapshotKey("/", "category=food"),
    );
  });
});

describe("readScrollSnapshot without window (SSR)", () => {
  it("returns null instead of throwing", () => {
    expect(readScrollSnapshot(scrollSnapshotKey("/", ""))).toBeNull();
  });
});

describe("writeScrollSnapshot without window (SSR)", () => {
  it("does not throw", () => {
    expect(() =>
      writeScrollSnapshot(scrollSnapshotKey("/", ""), { scrollY: 10 }),
    ).not.toThrow();
  });
});

describe("read/writeScrollSnapshot with a window present", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    (globalThis as { window?: unknown }).window = {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
      },
    };
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("round-trips a snapshot with extra data", () => {
    const key = scrollSnapshotKey("/", "category=adventure");
    writeScrollSnapshot(key, { scrollY: 1234, extra: { count: 48 } });

    expect(readScrollSnapshot<{ count: number }>(key)).toEqual({
      scrollY: 1234,
      extra: { count: 48 },
    });
  });

  it("returns null for a key that was never written", () => {
    expect(readScrollSnapshot(scrollSnapshotKey("/never", ""))).toBeNull();
  });

  it("returns null instead of throwing on corrupted stored JSON", () => {
    const key = scrollSnapshotKey("/broken", "");
    store.set(key, "{not json");

    expect(readScrollSnapshot(key)).toBeNull();
  });
});
