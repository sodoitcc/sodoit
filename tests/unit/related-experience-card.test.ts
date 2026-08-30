import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { resolveExperienceCardActionState } from "../../app/(app)/browse/experience-card-state";
import type { ListStatus } from "../../app/(app)/browse/types";

const ROOT = path.resolve(__dirname, "../..");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

function deriveSavedCompleted(status: ListStatus | null) {
  return { saved: status === "saved", done: status === "completed" };
}

describe("RelatedExperienceCard status derivation", () => {
  it("maps null status to unsaved", () => {
    const { saved, done } = deriveSavedCompleted(null);
    expect(resolveExperienceCardActionState(saved, done)).toBe("unsaved");
  });

  it("maps saved status to the saved (bookmark) state", () => {
    const { saved, done } = deriveSavedCompleted("saved");
    expect(resolveExperienceCardActionState(saved, done)).toBe("saved");
  });

  it("maps completed status to the completed (check) state", () => {
    const { saved, done } = deriveSavedCompleted("completed");
    expect(resolveExperienceCardActionState(saved, done)).toBe("completed");
  });

  it("never derives saved and completed as simultaneously true from one status value", () => {
    for (const status of ["saved", "completed", null] as const) {
      const { saved, done } = deriveSavedCompleted(status);
      expect(saved && done).toBe(false);
    }
  });

  it("completed still wins in the resolver even if both were somehow true", () => {
    expect(resolveExperienceCardActionState(true, true)).toBe("completed");
  });
});

describe("RelatedExperienceCard architecture", () => {
  const source = read("app/(app)/experiences/[slug]/RelatedExperienceCard.tsx");

  it("wires the shared list-state props so ExperienceCard renders ExperienceListStateControl", () => {
    expect(source).toMatch(/saved=\{saved\}/);
    expect(source).toMatch(/onSave=\{save\}/);
    expect(source).toMatch(/onRemoveSaved=\{removeSaved\}/);
  });

  it("reuses the canonical mutation path instead of writing to user_lists directly", () => {
    expect(source).toMatch(/from "@\/app\/\(app\)\/browse\/actions"/);
    expect(source).not.toMatch(/\.from\("user_lists"\)/);
    expect(source).not.toMatch(/\.upsert\(/);
  });

  it("does not define its own ExperienceListStateControl or resolver", () => {
    expect(source).not.toMatch(/function ExperienceListStateControl/);
    expect(source).not.toMatch(/function resolveExperienceCardActionState/);
  });
});
