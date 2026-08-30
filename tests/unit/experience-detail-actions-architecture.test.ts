import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

describe("experience detail actions architecture", () => {
  it("reuses the canonical browse mutation path instead of writing its own", () => {
    const source = read("app/(app)/experiences/[slug]/ExperienceDetailActions.tsx");
    expect(source).toMatch(/from "@\/app\/\(app\)\/browse\/actions"/);
    expect(source).not.toMatch(/\.upsert\(/);
    expect(source).not.toMatch(/from\("user_lists"\)/);
  });

  it("reuses the browse list-state resolver instead of a duplicate one", () => {
    const source = read("app/(app)/experiences/[slug]/ExperienceDetailActions.tsx");
    expect(source).toMatch(
      /from "@\/app\/\(app\)\/browse\/experience-card-state"/,
    );
  });

  it("reuses the browse completion-toggle hook for achievement-consistent completion", () => {
    const source = read("app/(app)/experiences/[slug]/ExperienceDetailActions.tsx");
    expect(source).toMatch(
      /from "@\/app\/\(app\)\/browse\/hooks\/useCompletionToggle"/,
    );
  });

  it("the old ActionPanel implementation no longer exists", () => {
    expect(
      fs.existsSync(path.join(ROOT, "app/(app)/experiences/[slug]/ActionPanel.tsx")),
    ).toBe(false);
  });

  it("setListStatus and removeFromMyList surface write failures instead of swallowing them", () => {
    const source = read("app/(app)/browse/actions.ts");
    const setListStatusBody = source.slice(
      source.indexOf("export async function setListStatus"),
      source.indexOf("export async function removeFromMyList"),
    );
    const removeFromMyListBody = source.slice(
      source.indexOf("export async function removeFromMyList"),
    );

    expect(setListStatusBody.match(/if \(error\) throw/g)?.length).toBe(2);
    expect(removeFromMyListBody).toMatch(/if \(error\) throw/);
  });
});
