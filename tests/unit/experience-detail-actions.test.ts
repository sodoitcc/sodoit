import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/tasks/test",
}));

vi.mock(
  "@/app/(app)/achievements/components/AchievementUnlockProvider",
  () => ({
    useAchievementUnlock: () => ({ showAchievements: vi.fn() }),
  }),
);

vi.mock("@/app/(app)/achievements/actions", () => ({
  checkAndUnlockAchievements: vi.fn().mockResolvedValue([]),
}));

import {
  canToggleSave,
  nextSaveStatus,
  resolveCompleteLabel,
  resolveSaveLabel,
} from "../../app/(app)/tasks/[id]/ExperienceDetailActions";
import { resolveExperienceCardActionState } from "../../app/(app)/browse/experience-card-state";

describe("resolveExperienceCardActionState — detail states", () => {
  it("resolves unsaved when neither saved nor completed", () => {
    expect(resolveExperienceCardActionState(false, false)).toBe("unsaved");
  });

  it("resolves saved when saved but not completed", () => {
    expect(resolveExperienceCardActionState(true, false)).toBe("saved");
  });

  it("resolves completed when completed", () => {
    expect(resolveExperienceCardActionState(false, true)).toBe("completed");
  });

  it("completed wins visually when both saved and completed are true", () => {
    expect(resolveExperienceCardActionState(true, true)).toBe("completed");
  });
});

describe("resolveSaveLabel", () => {
  it("shows the add label when unsaved", () => {
    expect(resolveSaveLabel("unsaved")).toBe("Add to My List");
  });

  it("shows the saved label when saved", () => {
    expect(resolveSaveLabel("saved")).toBe("Saved to My List");
  });

  it("shows a non-actionable in-list label when completed", () => {
    expect(resolveSaveLabel("completed")).toBe("In My List");
  });
});

describe("resolveCompleteLabel", () => {
  it("shows Mark as done when not completed", () => {
    expect(resolveCompleteLabel(false)).toBe("Mark as done");
  });

  it("shows Completed when completed", () => {
    expect(resolveCompleteLabel(true)).toBe("Completed");
  });
});

describe("canToggleSave", () => {
  it("allows toggling when unsaved", () => {
    expect(canToggleSave("unsaved")).toBe(true);
  });

  it("allows toggling when saved", () => {
    expect(canToggleSave("saved")).toBe(true);
  });

  it("blocks toggling when completed, so Add to My List can never overwrite a completed state", () => {
    expect(canToggleSave("completed")).toBe(false);
  });
});

describe("nextSaveStatus", () => {
  it("moves to saved from unsaved", () => {
    expect(nextSaveStatus("unsaved")).toBe("saved");
  });

  it("moves to null (removed) from saved", () => {
    expect(nextSaveStatus("saved")).toBeNull();
  });
});
