import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getGuideRenderer } from "@/lib/guides/types";

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("worth_it_or_skip_it renderer mapping", () => {
  it("maps to the comparison renderer", () => {
    expect(getGuideRenderer("worth_it_or_skip_it")).toBe("comparison");
  });
});

describe("GuideComparisonDetail architecture", () => {
  const source = read("components/guides/GuideComparisonDetail.tsx");

  it("reuses the shared header, sidebar, actions and briefing", () => {
    expect(source).toContain("<GuideHeader");
    expect(source).toContain("<GuideSidebar");
    expect(source).toContain("<GuideActions");
    expect(source).toContain("<GuideBriefing");
  });

  it("does not pass a routeUrl anywhere", () => {
    expect(source).not.toContain("routeUrl");
    expect(source).not.toMatch(/buildGoogleMapsDirectionsUrl/);
  });

  it("uses a swaps-specific briefing heading", () => {
    expect(source).toContain('heading="Why these swaps?"');
  });

  it("page.tsx dispatches worth_it_or_skip_it to GuideComparisonDetail", () => {
    const page = read("app/(app)/guides/[slug]/page.tsx");
    expect(page).toContain("<GuideComparisonDetail");
    expect(page).toMatch(/renderer === "comparison"/);
  });
});

describe("GuideComparisonPairRow structure", () => {
  const source = read("components/guides/GuideComparisonPairRow.tsx");

  it("renders both sides through the shared GuideComparisonSide", () => {
    const matches = source.match(/<GuideComparisonSide/g) ?? [];
    expect(matches.length).toBe(2);
    expect(source).toContain('kind="skip"');
    expect(source).toContain('kind="instead"');
  });

  it("renders the reason only when present", () => {
    expect(source).toMatch(/{pair\.reason && \(/);
  });
});

describe("GuideComparisonSide", () => {
  const source = read("components/guides/GuideComparisonSide.tsx");

  it("labels each side Skip or Instead", () => {
    expect(source).toContain('"Skip"');
    expect(source).toContain('"Instead"');
  });

  it("has no structural dependency on an image being present", () => {
    expect(source).not.toMatch(/GuideCover|image_url|imageUrl/);
  });

  it("only builds per-side Maps links, never a route/directions link", () => {
    expect(source).not.toMatch(/buildGoogleMapsDirectionsUrl/);
    expect(source).toContain("buildGoogleMapsUrl");
  });

  it("uses safe rel/target attributes for every external link", () => {
    const anchorBlocks = source.split("<a\n");
    expect(anchorBlocks.length).toBeGreaterThan(1);
    for (const block of anchorBlocks.slice(1)) {
      expect(block).toContain('target="_blank"');
      expect(block).toContain('rel="noopener noreferrer"');
    }
  });
});
