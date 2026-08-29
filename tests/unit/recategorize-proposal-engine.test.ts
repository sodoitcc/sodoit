import { describe, expect, it } from "vitest";
import {
  defaultSelected,
  generateProposal,
  hasProposedChange,
} from "../../lib/admin/recategorize/proposal-engine";

function input(
  title: string,
  overrides: Partial<{
    category: string | null;
    locationType: "global" | "country" | "city";
  }> = {},
) {
  return {
    title,
    category: overrides.category ?? null,
    locationType: overrides.locationType ?? "global",
  };
}

describe("generateProposal", () => {
  it("maps a landmark title to Places/place/specific_place", () => {
    const proposal = generateProposal(input("Cross Shibuya Crossing"));
    expect(proposal.categorySlug).toBe("places");
    expect(proposal.experienceType).toBe("place");
    expect(proposal.locationScope).toBe("specific_place");
    expect(proposal.status).toBe("high");
  });

  it("maps a proper-noun visit title to Places/place/specific_place", () => {
    const proposal = generateProposal(input("Visit Petra"));
    expect(proposal.categorySlug).toBe("places");
    expect(proposal.locationScope).toBe("specific_place");
    expect(proposal.status).toBe("high");
  });

  it("maps karaoke to Fun & Entertainment", () => {
    const proposal = generateProposal(input("Sing karaoke"));
    expect(proposal.categorySlug).toBe("fun-entertainment");
    expect(proposal.status).toBe("high");
  });

  it("resolves a generic activity title to anywhere", () => {
    const proposal = generateProposal(input("Sing karaoke"));
    expect(proposal.locationScope).toBe("anywhere");
  });

  it("maps an extreme active experience to Adventure/activity", () => {
    const proposal = generateProposal(input("Go skydiving over the coast"));
    expect(proposal.categorySlug).toBe("adventure");
    expect(proposal.experienceType).toBe("activity");
    expect(proposal.status).toBe("high");
  });

  it("maps a food experience to Food & Drink", () => {
    const proposal = generateProposal(input("Try a wine tasting tour"));
    expect(proposal.categorySlug).toBe("food-drink");
    expect(proposal.status).toBe("high");
  });

  it("maps a nature/outdoor experience to Nature & Outdoors", () => {
    const proposal = generateProposal(input("See a waterfall at sunrise"));
    expect(proposal.categorySlug).toBe("nature-outdoors");
    expect(proposal.status).toBe("high");
  });

  it("maps a class/learning title to Learn & Create/skill", () => {
    const proposal = generateProposal(input("Take a pottery class"));
    expect(proposal.categorySlug).toBe("learn-create");
    expect(proposal.experienceType).toBe("skill");
    expect(proposal.status).toBe("high");
  });

  it("maps a wellness/fitness title to Wellness & Active", () => {
    const proposal = generateProposal(input("Try a sunrise yoga session"));
    expect(proposal.categorySlug).toBe("wellness-active");
    expect(proposal.status).toBe("high");
  });

  it("does not classify a cooking class as Food & Drink", () => {
    const proposal = generateProposal(input("Take a cooking class"));
    expect(proposal.categorySlug).toBe("learn-create");
  });

  it("returns review status for an ambiguous title matching multiple categories", () => {
    const proposal = generateProposal(
      input("Cook a meal at a cooking class then go karaoke"),
    );
    expect(proposal.status).toBe("review");
  });

  it("returns review status with null fields for completely unmatched input", () => {
    const proposal = generateProposal(input("Do something undefined"));
    expect(proposal.status).toBe("review");
    expect(proposal.categorySlug).toBeNull();
    expect(proposal.experienceType).toBeNull();
    expect(proposal.locationScope).toBeNull();
  });

  it("falls back to the legacy category at medium confidence when no keyword matches", () => {
    const proposal = generateProposal(
      input("Do something outdoorsy", { category: "Nature" }),
    );
    expect(proposal.categorySlug).toBe("nature-outdoors");
    expect(proposal.status).toBe("medium");
  });

  it("uses location_type city/country to refine a non-landmark scope", () => {
    const proposal = generateProposal(
      input("Try local street food", { locationType: "city" }),
    );
    expect(proposal.locationScope).toBe("city");
  });

  it("falls back Culture legacy category to Fun & Entertainment", () => {
    const proposal = generateProposal(
      input("Watch flamenco in Seville", {
        category: "Culture",
        locationType: "city",
      }),
    );
    expect(proposal.categorySlug).toBe("fun-entertainment");
    expect(proposal.status).toBe("medium");
  });

  it("falls back Social legacy category to Fun & Entertainment", () => {
    const proposal = generateProposal(
      input("Join a pub quiz team", { category: "Social" }),
    );
    expect(proposal.categorySlug).toBe("fun-entertainment");
    expect(proposal.status).toBe("medium");
  });

  it("does not force a generic legacy-fallback travel title to specific_place", () => {
    const proposal = generateProposal(
      input("Visit a country you have never been to", { category: "Travel" }),
    );
    expect(proposal.categorySlug).toBe("places");
    expect(proposal.locationScope).toBe("anywhere");
    expect(proposal.status).toBe("medium");
  });

  it("maps a wildlife safari title to Nature & Outdoors, not Adventure", () => {
    const proposal = generateProposal(input("Go on safari in the Serengeti"));
    expect(proposal.categorySlug).toBe("nature-outdoors");
    expect(proposal.status).toBe("high");
  });

  it("does not treat a generic obstacle course as a Learn & Create class", () => {
    const proposal = generateProposal(input("Run an obstacle course race"));
    expect(proposal.categorySlug).toBe("wellness-active");
    expect(proposal.status).toBe("high");
  });

  it("recognizes a landmark title with an article between verb and proper noun", () => {
    const proposal = generateProposal(input("See the Taj Mahal at sunrise"));
    expect(proposal.categorySlug).toBe("places");
    expect(proposal.locationScope).toBe("specific_place");
    expect(proposal.status).toBe("high");
  });

  it("recognizes plural pyramid and canyon as place nouns", () => {
    const pyramids = generateProposal(input("See the Pyramids of Giza"));
    expect(pyramids.locationScope).toBe("specific_place");

    const canyon = generateProposal(input("See the Grand Canyon from the rim"));
    expect(canyon.locationScope).toBe("specific_place");
  });

  it("does not treat a generic indefinite article as a landmark signal", () => {
    const proposal = generateProposal(
      input("Visit a UNESCO World Heritage Site", { category: "Travel" }),
    );
    expect(proposal.locationScope).toBe("anywhere");
  });
});

describe("hasProposedChange", () => {
  it("is false when every field matches", () => {
    const state = {
      primaryCategoryId: "cat-1",
      experienceType: "activity",
      locationScope: "anywhere",
    };
    expect(hasProposedChange(state, { ...state })).toBe(false);
  });

  it("is true when any field differs", () => {
    const current = {
      primaryCategoryId: null,
      experienceType: null,
      locationScope: null,
    };
    const proposed = {
      primaryCategoryId: "cat-1",
      experienceType: "activity",
      locationScope: "anywhere",
    };
    expect(hasProposedChange(current, proposed)).toBe(true);
  });
});

describe("defaultSelected", () => {
  it("is true only for a high-confidence proposal with an actual change", () => {
    expect(defaultSelected("high", true)).toBe(true);
  });

  it("is false for a high-confidence proposal with no actual change", () => {
    expect(defaultSelected("high", false)).toBe(false);
  });

  it("is false for medium confidence even with a change", () => {
    expect(defaultSelected("medium", true)).toBe(false);
  });

  it("is false for review status even with a change", () => {
    expect(defaultSelected("review", true)).toBe(false);
  });
});
