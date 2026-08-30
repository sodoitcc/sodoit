import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { generateMetadata } from "@/app/(app)/experiences/[slug]/page";
import { SITE_URL } from "@/lib/site";

function client(row: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: row }),
          }),
        }),
      }),
    }),
  };
}

const BASE_ROW = {
  id: "exp-1",
  slug: "swim-with-whale-sharks",
  title: "Swim with whale sharks",
  category: "Adventure",
  description: null,
  difficulty: "Hard",
  image_url: null,
  image_alt: null,
  location_type: "global",
  city: null,
  country_code: null,
  saved_count: 0,
  why_it_matters: null,
  what_to_know: null,
  best_time: null,
  duration_text: null,
  location_note: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Experience generateMetadata", () => {
  it("returns just the title, letting the root template append the site name", async () => {
    createClientMock.mockResolvedValue(client(BASE_ROW));
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_ROW.slug }),
    });
    expect(metadata.title).toBe("Swim with whale sharks");
  });

  it("prefers description, then why_it_matters, then a deterministic fallback", async () => {
    createClientMock.mockResolvedValue(
      client({ ...BASE_ROW, description: "Real description" }),
    );
    let metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_ROW.slug }),
    });
    expect(metadata.description).toBe("Real description");

    createClientMock.mockResolvedValue(
      client({ ...BASE_ROW, why_it_matters: "Because it matters" }),
    );
    metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_ROW.slug }),
    });
    expect(metadata.description).toBe("Because it matters");

    createClientMock.mockResolvedValue(client(BASE_ROW));
    metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_ROW.slug }),
    });
    expect(metadata.description).toContain("Swim with whale sharks");
  });

  it("sets the canonical URL to the slug route", async () => {
    createClientMock.mockResolvedValue(client(BASE_ROW));
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_ROW.slug }),
    });
    expect(metadata.alternates?.canonical).toBe(
      `${SITE_URL}/experiences/swim-with-whale-sharks`,
    );
  });

  it("includes an OG/Twitter image when a valid public image exists", async () => {
    createClientMock.mockResolvedValue(
      client({
        ...BASE_ROW,
        image_url: "https://cdn.sodoit.cc/photo.jpg",
        image_alt: "A whale shark",
      }),
    );
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_ROW.slug }),
    });
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://cdn.sodoit.cc/photo.jpg", alt: "A whale shark" },
    ]);
    expect(metadata.twitter?.images).toEqual([
      "https://cdn.sodoit.cc/photo.jpg",
    ]);
    expect((metadata.twitter as { card?: string })?.card).toBe(
      "summary_large_image",
    );
  });

  it("omits image metadata when no valid image exists", async () => {
    createClientMock.mockResolvedValue(client(BASE_ROW));
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_ROW.slug }),
    });
    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter?.images).toBeUndefined();
    expect((metadata.twitter as { card?: string })?.card).toBe("summary");
  });

  it("returns empty metadata for a nonexistent or private experience", async () => {
    createClientMock.mockResolvedValue(client(null));
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(metadata).toEqual({});
  });
});
