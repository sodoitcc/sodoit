import { describe, expect, it } from "vitest";
import {
  resolveClickAction,
  stateLabel,
} from "../../app/(app)/browse/components/ExperienceListStateControl";

describe("stateLabel", () => {
  it("labels the unsaved (plus) state as Add to My List", () => {
    expect(stateLabel("unsaved", "Visit Petra")).toBe(
      "Add Visit Petra to My List",
    );
  });

  it("labels the saved (bookmark) state as Remove from My List", () => {
    expect(stateLabel("saved", "Visit Petra")).toBe(
      "Remove Visit Petra from My List",
    );
  });

  it("labels the completed (check) state as Completed", () => {
    expect(stateLabel("completed", "Visit Petra")).toBe(
      "Visit Petra: Completed",
    );
  });
});

describe("resolveClickAction", () => {
  it("clicking the unsaved plus invokes save, not complete", () => {
    expect(resolveClickAction("unsaved")).toBe("save");
  });

  it("clicking the saved bookmark removes the saved entry", () => {
    expect(resolveClickAction("saved")).toBe("removeSaved");
  });

  it("clicking the completed check uncompletes rather than saving", () => {
    expect(resolveClickAction("completed")).toBe("uncomplete");
  });
});
