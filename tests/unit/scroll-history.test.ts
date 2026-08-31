import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearCurrentHistoryEntryScrollRestore,
  markCurrentHistoryEntryForScrollRestore,
  shouldRestoreCurrentHistoryEntry,
} from "@/lib/navigation/scroll-history";

describe("scroll-history without window (SSR)", () => {
  it("markCurrentHistoryEntryForScrollRestore does not throw", () => {
    expect(() => markCurrentHistoryEntryForScrollRestore("/")).not.toThrow();
  });

  it("shouldRestoreCurrentHistoryEntry returns false", () => {
    expect(shouldRestoreCurrentHistoryEntry("/")).toBe(false);
  });
});

describe("scroll-history with a window present", () => {
  let state: Record<string, unknown> | null;
  let navigationType: string;

  beforeEach(() => {
    state = null;
    navigationType = "navigate";

    (globalThis as { window?: unknown }).window = {
      history: {
        get state() {
          return state;
        },
        replaceState: (
          newState: Record<string, unknown>,
          _title: string,
          _url: string,
        ) => {
          state = newState;
        },
      },
      location: { href: "http://localhost/" },
    };

    (globalThis as { performance?: unknown }).performance = {
      getEntriesByType: () => [{ type: navigationType }],
    };
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { performance?: unknown }).performance;
  });

  it("marks the current entry and reports it should restore for the same key", () => {
    markCurrentHistoryEntryForScrollRestore("/?category=adventure");
    expect(shouldRestoreCurrentHistoryEntry("/?category=adventure")).toBe(true);
  });

  it("does not restore for a different key", () => {
    markCurrentHistoryEntryForScrollRestore("/?category=adventure");
    expect(shouldRestoreCurrentHistoryEntry("/?category=food")).toBe(false);
  });

  it("does not restore when no marker was ever set", () => {
    expect(shouldRestoreCurrentHistoryEntry("/")).toBe(false);
  });

  it("preserves other existing history state fields", () => {
    state = { unrelated: "value" };
    markCurrentHistoryEntryForScrollRestore("/");
    expect(state).toMatchObject({ unrelated: "value" });
  });

  it("stops reporting a restore after the marker is cleared", () => {
    markCurrentHistoryEntryForScrollRestore("/");
    clearCurrentHistoryEntryScrollRestore();
    expect(shouldRestoreCurrentHistoryEntry("/")).toBe(false);
  });
});
