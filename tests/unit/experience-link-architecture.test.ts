import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      listSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const EXEMPT = new Set([
  path.join(ROOT, "app/(app)/tasks/[id]/page.tsx"),
  path.join(ROOT, "app/(app)/browse/actions.ts"),
  path.join(ROOT, "app/sitemap.ts"),
  path.join(ROOT, "lib/experiences/href.ts"),
]);

describe("public Experience links use the canonical slug route", () => {
  it("no source file outside the legacy compat route builds a /tasks/{id} href", () => {
    const files = [
      ...listSourceFiles(path.join(ROOT, "app")),
      ...listSourceFiles(path.join(ROOT, "lib")),
      ...listSourceFiles(path.join(ROOT, "components")),
    ];

    const offenders: string[] = [];

    for (const file of files) {
      if (EXEMPT.has(file)) continue;
      if (file.includes(`${path.sep}tests${path.sep}`)) continue;

      const source = fs.readFileSync(file, "utf-8");
      if (/[`'"]\/tasks\/\$?\{?/.test(source)) {
        offenders.push(path.relative(ROOT, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("getExperienceHref is the only place that builds the canonical Experience path", () => {
    const source = fs.readFileSync(
      path.join(ROOT, "lib/experiences/href.ts"),
      "utf-8",
    );
    expect(source).toMatch(/`\/experiences\/\$\{slug\}`/);
  });
});
