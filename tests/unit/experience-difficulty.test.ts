import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_DIFFICULTIES,
  getDifficultyPresentation,
  isExperienceDifficulty,
} from "../../lib/experiences/difficulty.mjs";
import { DIFFICULTIES } from "../../app/(app)/browse/types";
import {
  DIFFICULTY_VALUES,
  validateExperienceInput,
  type ExperienceInput,
} from "../../lib/admin/experiences/validation";

function validInput(overrides: Partial<ExperienceInput> = {}): ExperienceInput {
  return {
    title: "Cross Shibuya Crossing",
    slug: "cross-shibuya-crossing",
    description: "",
    category: "Travel",
    difficulty: "Easy",
    location_type: "global",
    country_code: "",
    city: "",
    image_url: "",
    image_alt: "",
    why_it_matters: "",
    what_to_know: [],
    best_time: "",
    duration_text: "",
    location_note: "",
    featured: false,
    is_public: true,
    ...overrides,
  };
}

describe("EXPERIENCE_DIFFICULTIES", () => {
  it("is the four-level scale with Extreme as the highest", () => {
    expect(EXPERIENCE_DIFFICULTIES).toEqual([
      "Easy",
      "Medium",
      "Hard",
      "Extreme",
    ]);
  });
});

describe("isExperienceDifficulty", () => {
  it("accepts the four canonical values", () => {
    for (const value of EXPERIENCE_DIFFICULTIES) {
      expect(isExperienceDifficulty(value)).toBe(true);
    }
  });

  it.each(["hard", "HARD", "Super Hard", "", null, undefined])(
    "rejects %j",
    (value) => {
      expect(isExperienceDifficulty(value)).toBe(false);
    },
  );
});

describe("getDifficultyPresentation", () => {
  it("returns null for an invalid difficulty", () => {
    expect(getDifficultyPresentation("Super Hard")).toBeNull();
    expect(getDifficultyPresentation(null)).toBeNull();
  });

  it.each([
    ["Easy", 1, "positive"],
    ["Medium", 2, "caution"],
    ["Hard", 3, "warning"],
    ["Extreme", 4, "critical"],
  ] as const)("presents %s at level %d with tone %s", (label, level, tone) => {
    expect(getDifficultyPresentation(label)).toEqual({ label, level, tone });
  });

  it("levels strictly increase from Easy to Extreme", () => {
    const levels = EXPERIENCE_DIFFICULTIES.map(
      (value) => getDifficultyPresentation(value)!.level,
    );

    expect(levels).toEqual([1, 2, 3, 4]);
  });
});

describe("no duplicated difficulty definitions", () => {
  it("Browse's DIFFICULTIES derives from the canonical list", () => {
    expect(DIFFICULTIES.map((d) => d.label)).toEqual([
      ...EXPERIENCE_DIFFICULTIES,
    ]);
  });

  it("admin's DIFFICULTY_VALUES is the canonical list", () => {
    expect(DIFFICULTY_VALUES).toBe(EXPERIENCE_DIFFICULTIES);
  });
});

describe("admin validation accepts Extreme, rejects arbitrary strings", () => {
  it("accepts Extreme", () => {
    expect(
      validateExperienceInput(validInput({ difficulty: "Extreme" })),
    ).toBeNull();
  });

  it("rejects an unknown difficulty string", () => {
    expect(
      validateExperienceInput(validInput({ difficulty: "Super Hard" })),
    ).toBe("Choose a valid difficulty.");
  });

  it("still accepts the pre-Extreme values", () => {
    for (const difficulty of ["Easy", "Medium", "Hard"] as const) {
      expect(validateExperienceInput(validInput({ difficulty }))).toBeNull();
    }
  });
});
