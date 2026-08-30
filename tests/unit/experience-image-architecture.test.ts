import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

describe("experience image enrichment architecture", () => {
  it("CLI seed script reuses the shared enrichment service instead of duplicating logic", () => {
    const script = read("scripts/seed-experience-images.mjs");
    expect(script).toMatch(/from ["']\.\/lib\/experience-image-service\.mjs["']/);
    expect(script).not.toMatch(/searchPexelsPhoto\(/);
  });

  it("PEXELS_API_KEY is referenced only in the server-only provider module", () => {
    const provider = read("scripts/lib/pexels.mjs");
    expect(provider).toMatch(/PEXELS_API_KEY/);

    const clientComponents = [
      "components/admin/experiences/GenerateImagesButton.tsx",
      "components/admin/experiences/RegenerateImageButton.tsx",
    ];

    for (const componentPath of clientComponents) {
      const source = read(componentPath);
      expect(source).toMatch(/^"use client";/);
      expect(source).not.toMatch(/PEXELS_API_KEY/);
      expect(source).not.toMatch(/pexels\.mjs/);
    }
  });

  it("admin image actions are server actions gated by requireAdmin", () => {
    const actions = read("lib/admin/experiences/image-actions.ts");
    expect(actions).toMatch(/^"use server";/);
    expect(actions.match(/requireAdmin\(\)/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it("bulk chunk processing does not use Promise.all for provider requests", () => {
    const service = read("scripts/lib/experience-image-service.mjs");
    expect(service).not.toMatch(/Promise\.all/);
  });
});
