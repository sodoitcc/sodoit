import { describe, expect, it } from "vitest";
import { buildItemQuery } from "../../scripts/enrich-guide-item-images.mjs";
import { selectUnusedPhoto } from "../../scripts/enrich-guide-images.mjs";

describe("buildItemQuery", () => {
  it("does not duplicate the city when it already appears in the title", () => {
    const query = buildItemQuery(
      { title: "Letná Prague viewpoint" },
      { city: "Prague" },
    );
    expect(query).toBe("Letná Prague viewpoint");
    expect(query.match(/Prague/g)).toHaveLength(1);
  });

  it("appends the city when it is not present in the title", () => {
    const query = buildItemQuery(
      { title: "Letná viewpoint" },
      { city: "Prague" },
    );
    expect(query).toBe("Letná viewpoint Prague");
  });

  it("normalizes punctuation such as colons and quotes", () => {
    const query = buildItemQuery(
      { title: "Vyšehrad: A local's walk" },
      { city: "Prague" },
    );
    expect(query).not.toContain(":");
    expect(query).not.toContain("'");
    expect(query).toBe("Vyšehrad A local s walk Prague");
  });

  it("matches the city case-insensitively", () => {
    const query = buildItemQuery(
      { title: "Sunset over prague" },
      { city: "Prague" },
    );
    expect(query.match(/prague/gi)).toHaveLength(1);
  });

  it("falls back to just the title when the guide has no city", () => {
    const query = buildItemQuery({ title: "Riegrovy sady" }, { city: null });
    expect(query).toBe("Riegrovy sady");
  });

  it("falls back to just the title when guide context is missing", () => {
    const query = buildItemQuery({ title: "Riegrovy sady" }, undefined);
    expect(query).toBe("Riegrovy sady");
  });
});

describe("selectUnusedPhoto (shared with guide cover enrichment)", () => {
  const photoA = { id: 1 };
  const photoB = { id: 2 };
  const photoC = { id: 3 };

  it("prefers an unused photo over an already-selected one", () => {
    const used = new Set([1]);
    const photo = selectUnusedPhoto([photoA, photoB, photoC], used);
    expect(photo).toBe(photoB);
  });

  it("selection is deterministic for the same input", () => {
    const first = selectUnusedPhoto([photoA, photoB, photoC], new Set([1]));
    const second = selectUnusedPhoto([photoA, photoB, photoC], new Set([1]));
    expect(first).toBe(second);
  });

  it("falls back to the first result when every result is already used", () => {
    const used = new Set([1, 2, 3]);
    const photo = selectUnusedPhoto([photoA, photoB, photoC], used);
    expect(photo).toBe(photoA);
  });
});
