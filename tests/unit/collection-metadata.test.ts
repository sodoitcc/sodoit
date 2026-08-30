import { describe, expect, it } from "vitest";
import { buildCollectionMetadata } from "../../app/(app)/list/collections/metadata";

const origin = "https://sodoit.example";

describe("buildCollectionMetadata", () => {
  it("returns noindex/nofollow with no fields when the collection is null (inaccessible)", () => {
    const metadata = buildCollectionMetadata({
      username: "amina",
      slug: "prague-weekend",
      origin,
      collection: null,
    });

    expect(metadata).toEqual({ robots: { index: false, follow: false } });
  });

  it("returns noindex/nofollow and leaks nothing when the collection is private", () => {
    const metadata = buildCollectionMetadata({
      username: "amina",
      slug: "private-plans",
      origin,
      collection: {
        visibility: "private",
        name: "Secret Trip",
        description: "Don't tell anyone",
        coverImages: ["https://cdn.example/secret.jpg"],
      },
    });

    expect(metadata).toEqual({ robots: { index: false, follow: false } });
    expect(JSON.stringify(metadata)).not.toMatch(
      /Secret Trip|Don't tell anyone|secret\.jpg/,
    );
  });

  it("builds full public metadata with the collection's own description", () => {
    const metadata = buildCollectionMetadata({
      username: "amina",
      slug: "prague-weekend",
      origin,
      collection: {
        visibility: "public",
        name: "Prague Weekend",
        description: "48 hours in Prague",
        coverImages: ["https://cdn.example/prague.jpg"],
      },
    });

    expect(metadata.title).toBe("Prague Weekend by @amina");
    expect(metadata.description).toBe("48 hours in Prague");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({
      canonical: "https://sodoit.example/u/amina/collections/prague-weekend",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Prague Weekend by @amina",
      url: "https://sodoit.example/u/amina/collections/prague-weekend",
      images: [{ url: "https://cdn.example/prague.jpg" }],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://cdn.example/prague.jpg"],
    });
  });

  it("falls back to a safe generic description when the collection has none, and a plain summary card when there's no image", () => {
    const metadata = buildCollectionMetadata({
      username: "amina",
      slug: "no-description",
      origin,
      collection: {
        visibility: "public",
        name: "No Description",
        description: null,
        coverImages: [],
      },
    });

    expect(metadata.description).toBe(
      "Explore No Description, a collection of experiences curated by @amina on Sodoit.",
    );
    expect(metadata.twitter).toMatchObject({ card: "summary" });
    expect(metadata.openGraph).not.toHaveProperty("images");
  });

  it("treats a blank description the same as no description", () => {
    const metadata = buildCollectionMetadata({
      username: "amina",
      slug: "blank-description",
      origin,
      collection: {
        visibility: "public",
        name: "Blank Description",
        description: "   ",
        coverImages: [],
      },
    });

    expect(metadata.description).toBe(
      "Explore Blank Description, a collection of experiences curated by @amina on Sodoit.",
    );
  });
});
