import { describe, expect, it } from "vitest";
import {
  buildQuery,
  selectUnusedPhoto,
} from "../../scripts/enrich-guide-images.mjs";

describe("buildQuery", () => {
  it("1. does not duplicate the city when it already appears in the title", () => {
    const query = buildQuery({
      title: "48 Hours in Prague",
      city: "Prague",
    });
    expect(query).toBe("48 Hours in Prague");
    expect(query.match(/Prague/g)).toHaveLength(1);
  });

  it("appends the city when it is not present in the title", () => {
    const query = buildQuery({
      title: "Best Sunset Spots",
      city: "Prague",
    });
    expect(query).toBe("Best Sunset Spots Prague");
  });

  it("normalizes punctuation such as colons", () => {
    const query = buildQuery({
      title: "Prague: A Local's Guide",
      city: "Prague",
    });
    expect(query).not.toContain(":");
    expect(query).not.toContain("'");
    expect(query).toBe("Prague A Local s Guide");
  });

  it("matches the city case-insensitively", () => {
    const query = buildQuery({
      title: "A Weekend in prague",
      city: "Prague",
    });
    expect(query.match(/prague/gi)).toHaveLength(1);
  });
});

describe("selectUnusedPhoto", () => {
  const photoA = { id: 1 };
  const photoB = { id: 2 };
  const photoC = { id: 3 };

  it("2. prefers an unused photo over an already-selected one", () => {
    const used = new Set([1]);
    const photo = selectUnusedPhoto([photoA, photoB, photoC], used);
    expect(photo).toBe(photoB);
  });

  it("3. selection is deterministic for the same input", () => {
    const used = new Set([1]);
    const first = selectUnusedPhoto([photoA, photoB, photoC], used);
    const second = selectUnusedPhoto([photoA, photoB, photoC], new Set([1]));
    expect(first).toBe(second);
  });

  it("4. falls back to the first result when every result is already used", () => {
    const used = new Set([1, 2, 3]);
    const photo = selectUnusedPhoto([photoA, photoB, photoC], used);
    expect(photo).toBe(photoA);
  });

  it("returns null for an empty result list", () => {
    expect(selectUnusedPhoto([], new Set())).toBeNull();
  });

  it("returns the only photo when nothing is used yet", () => {
    expect(selectUnusedPhoto([photoA], new Set())).toBe(photoA);
  });
});
