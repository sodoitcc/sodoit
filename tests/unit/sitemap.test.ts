import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/site";

const EXPERIENCES = [
  {
    slug: "exp-public",
    is_public: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    slug: "exp-private",
    is_public: false,
    created_at: "2026-01-01T00:00:00Z",
  },
];

const GUIDES = [
  { slug: "prague-guide", is_public: true, updated_at: "2026-02-01T00:00:00Z" },
  {
    slug: "hidden-guide",
    is_public: false,
    updated_at: "2026-02-01T00:00:00Z",
  },
];

const PROFILES = [
  { username: "publicuser", created_at: "2026-01-05T00:00:00Z" },
];

const COLLECTIONS = [
  {
    slug: "summer-plans",
    visibility: "public",
    updated_at: "2026-03-01T00:00:00Z",
    profiles: { username: "publicuser" },
  },
  {
    slug: "secret-plans",
    visibility: "private",
    updated_at: "2026-03-01T00:00:00Z",
    profiles: { username: "publicuser" },
  },
];

function tableClient(table: string) {
  const filters: { column: string; value: unknown }[] = [];

  const builder = {
    select() {
      return builder;
    },
    eq(column: string, value: unknown) {
      filters.push({ column, value });
      return builder;
    },
    not() {
      return builder;
    },
    then(resolve: (result: { data: unknown[] }) => void) {
      const source =
        table === "experiences"
          ? EXPERIENCES
          : table === "guides"
            ? GUIDES
            : table === "profiles"
              ? PROFILES
              : COLLECTIONS;

      const data = source.filter((row) =>
        filters.every(
          (filter) =>
            (row as Record<string, unknown>)[filter.column] === filter.value,
        ),
      );

      resolve({ data });
    },
  };

  return builder;
}

beforeEach(() => {
  vi.clearAllMocks();
  createAdminClientMock.mockReturnValue({
    from: (table: string) => tableClient(table),
  });
});

describe("sitemap", () => {
  it("includes the homepage", async () => {
    const entries = await sitemap();
    expect(entries.some((entry) => entry.url === SITE_URL)).toBe(true);
  });

  it("includes a public experience and excludes a private one", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/experiences/exp-public`);
    expect(urls).not.toContain(`${SITE_URL}/experiences/exp-private`);
  });

  it("never emits a legacy /tasks/{uuid} experience URL", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.every((url) => !url.includes("/tasks/"))).toBe(true);
  });

  it("includes a public guide and excludes a private one", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/guides/prague-guide`);
    expect(urls).not.toContain(`${SITE_URL}/guides/hidden-guide`);
  });

  it("includes a public profile", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/u/publicuser`);
  });

  it("includes a public collection and excludes a private one", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/u/publicuser/collections/summer-plans`);
    expect(urls).not.toContain(
      `${SITE_URL}/u/publicuser/collections/secret-plans`,
    );
  });

  it("uses the trusted production origin for every URL", async () => {
    const entries = await sitemap();
    for (const entry of entries) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
    }
  });

  it("never emits a filtered Browse query URL", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.every((url) => !url.includes("?"))).toBe(true);
  });

  it("does not fabricate a lastModified value for rows without one", async () => {
    createAdminClientMock.mockReturnValue({
      from: () => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        not() {
          return this;
        },
        then(resolve: (result: { data: unknown[] }) => void) {
          resolve({
            data: [{ slug: "exp-no-date", is_public: true, created_at: null }],
          });
        },
      }),
    });

    const entries = await sitemap();
    const entry = entries.find((item) => item.url.includes("exp-no-date"));
    expect(entry?.lastModified).toBeUndefined();
  });

  it("skips a malformed row instead of breaking the whole sitemap", async () => {
    createAdminClientMock.mockReturnValue({
      from: () => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        not() {
          return this;
        },
        then(resolve: (result: { data: unknown[] }) => void) {
          resolve({
            data: [
              { slug: "", is_public: true, created_at: null },
              { slug: "exp-ok", is_public: true, created_at: null },
            ],
          });
        },
      }),
    });

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${SITE_URL}/experiences/exp-ok`);
    expect(urls.some((url) => url === `${SITE_URL}/experiences/`)).toBe(false);
  });

  it("treats a genuinely empty table as zero entries, not an error", async () => {
    createAdminClientMock.mockReturnValue({
      from: () => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        not() {
          return this;
        },
        then(resolve: (result: { data: unknown[]; error: null }) => void) {
          resolve({ data: [], error: null });
        },
      }),
    });

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toEqual([
      SITE_URL,
      `${SITE_URL}/discovery`,
      `${SITE_URL}/guides`,
    ]);
  });

  it("logs and omits a section's entries on a genuine query failure, without crashing the whole sitemap", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    createAdminClientMock.mockReturnValue({
      from: () => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        not() {
          return this;
        },
        then(
          resolve: (result: { data: null; error: { message: string } }) => void,
        ) {
          resolve({ data: null, error: { message: "connection refused" } });
        },
      }),
    });

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual([
      SITE_URL,
      `${SITE_URL}/discovery`,
      `${SITE_URL}/guides`,
    ]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("returns hundreds of dynamic entries for a successful, populated dataset", async () => {
    const manyExperiences = Array.from({ length: 250 }, (_, index) => ({
      slug: `experience-${index}`,
      is_public: true,
      created_at: "2026-01-01T00:00:00Z",
    }));

    createAdminClientMock.mockReturnValue({
      from: (table: string) => ({
        select() {
          return this;
        },
        eq() {
          return this;
        },
        not() {
          return this;
        },
        then(resolve: (result: { data: unknown[]; error: null }) => void) {
          resolve({
            data: table === "experiences" ? manyExperiences : [],
            error: null,
          });
        },
      }),
    });

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(200);
  });
});
