import { beforeEach, describe, expect, it, vi } from "vitest";

const { getGuideBySlugMock } = vi.hoisted(() => ({
  getGuideBySlugMock: vi.fn(),
}));

vi.mock("@/lib/guides/queries", () => ({
  getGuideBySlug: getGuideBySlugMock,
  getGuideResolvedImages: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/guides/saved", () => ({
  isGuideSaved: vi.fn().mockResolvedValue(false),
}));

import { generateMetadata } from "@/app/(app)/guides/[slug]/page";
import { SITE_URL } from "@/lib/site";

const BASE_GUIDE = {
  id: "guide-1",
  slug: "prague-on-a-budget",
  title: "Prague on a Budget",
  description: "A weekend guide to Prague",
  city: "Prague",
  country_code: "CZ",
  cover_image_url: null,
  cover_image_alt: null,
  duration_label: null,
  is_public: true,
  featured: false,
  items: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Guide generateMetadata", () => {
  it("returns the guide title without a manually appended site suffix", async () => {
    getGuideBySlugMock.mockResolvedValue(BASE_GUIDE);
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_GUIDE.slug }),
    });
    expect(metadata.title).toBe("Prague on a Budget");
  });

  it("sets the canonical URL to the guide's slug route", async () => {
    getGuideBySlugMock.mockResolvedValue(BASE_GUIDE);
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_GUIDE.slug }),
    });
    expect(metadata.alternates?.canonical).toBe(
      `${SITE_URL}/guides/prague-on-a-budget`,
    );
  });

  it("uses the real cover image when valid, and omits it otherwise", async () => {
    getGuideBySlugMock.mockResolvedValue({
      ...BASE_GUIDE,
      cover_image_url: "https://cdn.sodoit.cc/prague.jpg",
      cover_image_alt: "Prague skyline",
    });
    let metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_GUIDE.slug }),
    });
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://cdn.sodoit.cc/prague.jpg", alt: "Prague skyline" },
    ]);

    getGuideBySlugMock.mockResolvedValue(BASE_GUIDE);
    metadata = await generateMetadata({
      params: Promise.resolve({ slug: BASE_GUIDE.slug }),
    });
    expect(metadata.openGraph?.images).toBeUndefined();
  });

  it("marks a nonexistent guide as noindex without a duplicated site suffix", async () => {
    getGuideBySlugMock.mockResolvedValue(null);
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(metadata.title).toBe("Guide not found");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
