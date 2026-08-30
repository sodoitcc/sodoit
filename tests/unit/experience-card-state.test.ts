import { describe, expect, it } from "vitest";
import { resolveExperienceCardActionState } from "../../app/(app)/browse/experience-card-state";

describe("resolveExperienceCardActionState", () => {
  it("is unsaved when neither saved nor completed", () => {
    expect(resolveExperienceCardActionState(false, false)).toBe("unsaved");
  });

  it("is saved when saved but not completed", () => {
    expect(resolveExperienceCardActionState(true, false)).toBe("saved");
  });

  it("is completed when completed but not saved", () => {
    expect(resolveExperienceCardActionState(false, true)).toBe("completed");
  });

  it("completed wins over saved when both are true", () => {
    expect(resolveExperienceCardActionState(true, true)).toBe("completed");
  });
});
