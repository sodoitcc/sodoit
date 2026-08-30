import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

const CALL_SITES = [
  "app/(app)/browse/BrowseBoard.tsx",
  "app/(app)/experiences/[slug]/ExperienceDetailActions.tsx",
  "app/(app)/experiences/[slug]/RelatedExperienceCard.tsx",
  "app/(app)/list/useMyListState.ts",
  "app/(app)/list/MyListBoard.tsx",
];

describe("completion toggle domain consistency", () => {
  it("every completion toggle call site reuses the single canonical toggleCompletion action", () => {
    for (const filePath of CALL_SITES) {
      const source = read(filePath);
      expect(source).toMatch(/toggleCompletion\(/);
    }
  });

  it("no call site removes the row on uncomplete instead of reverting to saved", () => {
    for (const filePath of CALL_SITES) {
      const source = read(filePath);
      expect(source).not.toMatch(
        /wasCompleted\s*\)\s*[\s\S]{0,80}?removeFromMyList/,
      );
      expect(source).not.toMatch(
        /wasDone\s*\)\s*[\s\S]{0,80}?removeFromMyList/,
      );
    }
  });

  it("toggleCompletion itself is defined exactly once, in the canonical actions module, and reverts to saved rather than deleting", () => {
    const source = read("app/(app)/browse/actions.ts");
    expect(
      source.match(/export async function toggleCompletion/g)?.length,
    ).toBe(1);

    const body = source.slice(
      source.indexOf("export async function toggleCompletion"),
      source.indexOf("export async function removeFromMyList"),
    );
    expect(body).toMatch(/setListStatus\(experienceId, "saved"\)/);
    expect(body).toMatch(/setListStatus\(experienceId, "completed"\)/);
    expect(body).not.toMatch(/removeFromMyList/);
  });

  it("revalidates every route that renders persisted list status", () => {
    const source = read("app/(app)/browse/actions.ts");
    const body = source.slice(source.indexOf("function revalidateListPaths"));
    expect(body).toMatch(/revalidatePath\("\/"\)/);
    expect(body).toMatch(/revalidatePath\("\/list"\)/);
    expect(body).toMatch(/revalidatePath\(`\/tasks\//);
    expect(body).toMatch(/revalidatePath\("\/u\/\[username\]"/);
  });
});
