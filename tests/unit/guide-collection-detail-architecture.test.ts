import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("GuideCollectionDetail architecture", () => {
  const source = read("components/guides/GuideCollectionDetail.tsx");

  it("does not pass a routeUrl to GuideActions", () => {
    expect(source).not.toContain("routeUrl");
    expect(source).not.toMatch(/buildGoogleMapsDirectionsUrl/);
  });

  it("renders GuideActions and GuideCollectionItems", () => {
    expect(source).toContain("<GuideActions");
    expect(source).toContain("<GuideCollectionItems");
  });
});

describe("GuideCollectionItem structure", () => {
  const source = read("components/guides/GuideCollectionItem.tsx");

  it("delegates spot presentation to the shared GuideSpotRow", () => {
    expect(source).toContain("<GuideSpotRow");
  });

  it("does not render a route connector or per-item card border", () => {
    expect(source).not.toMatch(/connector/i);
    expect(source).not.toMatch(/bg-border\/\d+"\s*\n\s*\/>/);
  });
});

describe("GuideSpotRow external link safety", () => {
  const source = read("components/guides/GuideSpotRow.tsx");

  it("only builds per-place links, never a route/directions link", () => {
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

  it("only reveals Maps/website links inside the expanded state, not on every collapsed row", () => {
    expect(source).toMatch(/{open && \(/);
    const beforeExpanded = source.split("{open && (")[0];
    expect(beforeExpanded).not.toContain("Open in Google Maps");
  });

  it("exposes expand state via aria-expanded on a real button", () => {
    expect(source).toMatch(/<button[\s\S]*aria-expanded={open}/);
  });
});

describe("Shared guide shell reuse", () => {
  it("itinerary and collection both use GuideHeader and GuideSidebar", () => {
    const itinerary = read("components/guides/GuideItineraryDetail.tsx");
    const collection = read("components/guides/GuideCollectionDetail.tsx");

    for (const source of [itinerary, collection]) {
      expect(source).toContain("<GuideHeader");
      expect(source).toContain("<GuideSidebar");
    }
  });

  it("only itinerary passes a routeUrl to the sidebar", () => {
    const itinerary = read("components/guides/GuideItineraryDetail.tsx");
    const collection = read("components/guides/GuideCollectionDetail.tsx");

    expect(itinerary).toMatch(/<GuideSidebar[\s\S]*routeUrl={routeUrl}/);
    expect(collection).not.toMatch(/<GuideSidebar[\s\S]*routeUrl/);
  });

  it("itinerary detail is the only place with a route timeline connector", () => {
    expect(read("components/guides/GuideItineraryStop.tsx")).toMatch(
      /bg-border/,
    );
    expect(read("components/guides/GuideCollectionItem.tsx")).not.toMatch(
      /bg-border\/\d+"\s*\n\s*\/>/,
    );
  });
});

describe("Compact itinerary timeline", () => {
  const itemsSource = read("components/guides/GuideItineraryItems.tsx");
  const stopSource = read("components/guides/GuideItineraryStop.tsx");

  it("derives node state from position instead of persisting it", () => {
    expect(itemsSource).toContain("deriveTimelineState");
  });

  it("gives start and finish nodes distinct fill treatment from regular nodes", () => {
    expect(stopSource).toContain("start:");
    expect(stopSource).toContain("finish:");
    expect(stopSource).toContain("regular:");
  });

  it("uses compact per-spot spacing, not large card padding", () => {
    expect(stopSource).not.toMatch(/pb-10/);
    expect(stopSource).not.toMatch(/text-3xl|text-4xl/);
  });
});

describe("GuideSidebar relevance", () => {
  const source = read("components/guides/GuideSidebar.tsx");

  it("only renders facts it is given, with no hardcoded dashboard metadata", () => {
    expect(source).toContain("facts.map");
    expect(source).not.toContain("Rating");
    expect(source).not.toContain("Price");
  });

  it("is sticky only on desktop", () => {
    expect(source).toContain("lg:sticky");
    expect(source).not.toMatch(/(?<!lg:)\bsticky\b/);
  });
});

describe("Why these spots briefing", () => {
  it("itinerary and collection both render GuideBriefing conditionally", () => {
    const itinerary = read("components/guides/GuideItineraryDetail.tsx");
    const collection = read("components/guides/GuideCollectionDetail.tsx");

    for (const source of [itinerary, collection]) {
      expect(source).toContain("hasBriefingContent(guide.description)");
      expect(source).toContain("<GuideBriefing");
    }
  });

  it("GuideBriefing takes its heading as a prop, not a hardcoded string", () => {
    const source = read("components/guides/GuideBriefing.tsx");
    expect(source).toContain("heading");
    expect(source).not.toContain("Why these spots?");
  });

  it("itinerary uses a route-specific briefing heading", () => {
    const source = read("components/guides/GuideItineraryDetail.tsx");
    expect(source).toContain('heading="Why this route works"');
  });

  it("collection uses a spots-specific briefing heading", () => {
    const source = read("components/guides/GuideCollectionDetail.tsx");
    expect(source).toContain('heading="Why these spots?"');
  });

  it("briefing is only rendered when it would add content beyond the hero summary", () => {
    for (const file of [
      "components/guides/GuideItineraryDetail.tsx",
      "components/guides/GuideCollectionDetail.tsx",
    ]) {
      expect(read(file)).toMatch(
        /{hasBriefingContent\(guide\.description\) && \(/,
      );
    }
  });
});

describe("No location hover popover", () => {
  const source = read("components/guides/GuideSpotRow.tsx");

  it("does not render a hover/focus location popover", () => {
    expect(source).not.toMatch(/group-hover:block/);
    expect(source).not.toContain('role="presentation"');
  });

  it("still gives the title hover/focus visual feedback", () => {
    expect(source).toMatch(/group-hover:text-accent-dark/);
  });

  it("shows the location line inside the expanded state instead", () => {
    const expandedBlock = source.split("{open && (")[1] ?? "";
    expect(expandedBlock).toContain("locationLine");
  });
});

describe("Mobile Guide details suppression", () => {
  const source = read("components/guides/GuideSidebar.tsx");

  it("hides facts and route CTA on mobile, showing them from lg up only", () => {
    expect(source).toMatch(/hidden lg:block/);
  });

  it("keeps the local tip visible outside the desktop-only block", () => {
    const [, afterHiddenBlock] = source.split("</div>\n\n        {localTip");
    expect(afterHiddenBlock ?? source).toBeDefined();
    expect(source).toContain("{localTip &&");
  });
});

describe("Mobile action hierarchy", () => {
  const source = read("components/guides/GuideActions.tsx");

  it("shortens the route CTA label on mobile while keeping it primary", () => {
    expect(source).toMatch(/sm:hidden">Open route</);
    expect(source).toMatch(/hidden sm:inline">Open route in Google Maps/);
  });
});

describe("Spots terminology", () => {
  it("uses 'spot(s)' rather than 'place(s)' or 'stop(s)' in guide detail UI copy", () => {
    for (const file of [
      "components/guides/GuideItineraryDetail.tsx",
      "components/guides/GuideCollectionDetail.tsx",
      "components/guides/GuideHeader.tsx",
      "components/guides/GuideSidebar.tsx",
    ]) {
      const source = read(file);
      expect(source.toLowerCase()).not.toMatch(/"place/);
      expect(source.toLowerCase()).not.toMatch(/"stop/);
    }
  });
});
