import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { searchPexelsPhotoMock, downloadImageMock, optimizeImageMock } =
  vi.hoisted(() => ({
    searchPexelsPhotoMock: vi.fn(),
    downloadImageMock: vi.fn(),
    optimizeImageMock: vi.fn(),
  }));

vi.mock("../../scripts/lib/pexels.mjs", async () => {
  const actual = await vi.importActual<
    typeof import("../../scripts/lib/pexels.mjs")
  >("../../scripts/lib/pexels.mjs");
  return {
    ...actual,
    searchPexelsPhoto: searchPexelsPhotoMock,
    downloadImage: downloadImageMock,
    delay: () => Promise.resolve(),
  };
});

vi.mock("../../scripts/lib/optimize-image.mjs", () => ({
  optimizeImage: optimizeImageMock,
  formatKB: (n: number) => `${n}KB`,
  percentSaved: () => 0,
}));

import {
  buildExperienceImageQuery,
  findExperiencesMissingImages,
  generateExperienceImage,
  hasUsableImage,
  regenerateExperienceImage,
  runExperienceImageEnrichment,
  PexelsRateLimitError,
} from "../../scripts/lib/experience-image-service.mjs";

interface Row {
  [key: string]: unknown;
}

function makeSelectQuery(rows: Row[]) {
  let data = [...rows];

  const builder = {
    select() {
      return builder;
    },
    or(clause: string) {
      if (clause.includes("image_url.is.null")) {
        data = data.filter(
          (row) => row.image_url === null || row.image_url === "",
        );
      }
      return builder;
    },
    eq(col: string, val: unknown) {
      data = data.filter((row) => row[col] === val);
      return builder;
    },
    in(col: string, vals: unknown[]) {
      data = data.filter((row) => vals.includes(row[col]));
      return builder;
    },
    order() {
      return builder;
    },
    range(from: number, to: number) {
      return Promise.resolve({ data: data.slice(from, to + 1), error: null });
    },
    maybeSingle() {
      return Promise.resolve({ data: data[0] ?? null, error: null });
    },
  };

  return builder;
}

function makeFakeSupabase(rows: Row[]) {
  const updateCalls: { id: string; payload: Row }[] = [];
  const uploadCalls: { path: string }[] = [];

  const client = {
    from(table: string) {
      if (table !== "experiences") throw new Error(`unexpected table ${table}`);
      return {
        select: (...args: unknown[]) =>
          (makeSelectQuery(rows).select as (...a: unknown[]) => unknown)(
            ...args,
          ),
        update(payload: Row) {
          return {
            eq(_col: string, id: string) {
              updateCalls.push({ id, payload });
              const row = rows.find((r) => r.id === id);
              if (row) Object.assign(row, payload);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
    storage: {
      from() {
        return {
          upload(path: string) {
            uploadCalls.push({ path });
            return Promise.resolve({ error: null });
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://cdn.example/${path}` } };
          },
        };
      },
    },
  };

  return { client, updateCalls, uploadCalls, rows };
}

function experienceRow(overrides: Row): Row {
  return {
    id: "exp-1",
    title: "Title",
    category: "Adventure",
    image_query: null,
    image_url: null,
    ...overrides,
  };
}

beforeEach(() => {
  searchPexelsPhotoMock.mockReset();
  downloadImageMock.mockReset();
  optimizeImageMock.mockReset();
  optimizeImageMock.mockResolvedValue(Buffer.from("optimized"));
  downloadImageMock.mockResolvedValue(Buffer.from("original"));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("buildExperienceImageQuery", () => {
  it("prefers an explicit image_query", () => {
    const query = buildExperienceImageQuery(
      experienceRow({ image_query: "custom query" }),
    );
    expect(query).toBe("custom query");
  });

  it("falls back to title + category", () => {
    const query = buildExperienceImageQuery(
      experienceRow({ title: "Visit Petra", category: "Travel" }),
    );
    expect(query).toBe("Visit Petra Travel");
  });

  it("rejects an obviously empty query", () => {
    const query = buildExperienceImageQuery(
      experienceRow({ title: "", category: null }),
    );
    expect(query).toBe("");
  });
});

describe("hasUsableImage", () => {
  it("is false for null and blank strings", () => {
    expect(hasUsableImage(experienceRow({ image_url: null }))).toBe(false);
    expect(hasUsableImage(experienceRow({ image_url: "  " }))).toBe(false);
  });

  it("is true for a real url", () => {
    expect(
      hasUsableImage(experienceRow({ image_url: "https://cdn/x.webp" })),
    ).toBe(true);
  });
});

describe("findExperiencesMissingImages", () => {
  it("excludes Experiences that already have a usable image", async () => {
    const { client } = makeFakeSupabase([
      experienceRow({ id: "missing-1", image_url: null }),
      experienceRow({ id: "has-image", image_url: "https://cdn/x.webp" }),
      experienceRow({ id: "missing-2", image_url: "" }),
    ]);

    const result = await findExperiencesMissingImages(client);
    const ids = result.map((r: Row) => r.id);
    expect(ids).toEqual(["missing-1", "missing-2"]);
  });

  it("respects an explicit limit", async () => {
    const { client } = makeFakeSupabase([
      experienceRow({ id: "a", image_url: null }),
      experienceRow({ id: "b", image_url: null }),
      experienceRow({ id: "c", image_url: null }),
    ]);

    const result = await findExperiencesMissingImages(client, { limit: 2 });
    expect(result).toHaveLength(2);
  });
});

describe("generateExperienceImage", () => {
  it("returns ok:false without side effects when the search finds nothing", async () => {
    searchPexelsPhotoMock.mockResolvedValue(null);
    const { client, updateCalls } = makeFakeSupabase([]);

    const result = await generateExperienceImage(
      client,
      experienceRow({ id: "exp-1" }),
    );

    expect(result.ok).toBe(false);
    expect(updateCalls).toHaveLength(0);
  });

  it("returns ok:true with an image url on success", async () => {
    searchPexelsPhotoMock.mockResolvedValue({
      id: "photo-1",
      alt: "A nice photo",
      src: { large2x: "https://pexels.example/photo.jpg" },
    });

    const { client } = makeFakeSupabase([]);
    const result = await generateExperienceImage(
      client,
      experienceRow({ id: "exp-1" }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.imageUrl).toContain("exp-1-photo-1.webp");
      expect(result.imageAlt).toBe("A nice photo");
    }
  });
});

describe("regenerateExperienceImage", () => {
  it("targets exactly the requested Experience", async () => {
    searchPexelsPhotoMock.mockResolvedValue({
      id: "photo-1",
      alt: "Alt",
      src: { large2x: "https://pexels.example/photo.jpg" },
    });

    const { client, updateCalls } = makeFakeSupabase([
      experienceRow({ id: "exp-1", image_url: "https://old.example/a.webp" }),
      experienceRow({ id: "exp-2", image_url: "https://old.example/b.webp" }),
    ]);

    await regenerateExperienceImage(client, "exp-1");

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].id).toBe("exp-1");
  });

  it("replaces the image on success", async () => {
    searchPexelsPhotoMock.mockResolvedValue({
      id: "photo-2",
      alt: "New alt",
      src: { large2x: "https://pexels.example/new.jpg" },
    });

    const { client, rows } = makeFakeSupabase([
      experienceRow({ id: "exp-1", image_url: "https://old.example/a.webp" }),
    ]);

    const result = await regenerateExperienceImage(client, "exp-1");

    expect(result.ok).toBe(true);
    expect(rows[0].image_url).not.toBe("https://old.example/a.webp");
  });

  it("keeps the previous image when regeneration fails", async () => {
    searchPexelsPhotoMock.mockResolvedValue(null);

    const { client, rows, updateCalls } = makeFakeSupabase([
      experienceRow({ id: "exp-1", image_url: "https://old.example/a.webp" }),
    ]);

    const result = await regenerateExperienceImage(client, "exp-1");

    expect(result.ok).toBe(false);
    expect(updateCalls).toHaveLength(0);
    expect(rows[0].image_url).toBe("https://old.example/a.webp");
  });

  it("returns not_found for a nonexistent Experience", async () => {
    const { client } = makeFakeSupabase([]);
    const result = await regenerateExperienceImage(client, "does-not-exist");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("not_found");
  });
});

describe("runExperienceImageEnrichment", () => {
  it("processes Experiences sequentially, not concurrently", async () => {
    const activeCalls: number[] = [];
    let concurrentPeak = 0;
    let active = 0;

    searchPexelsPhotoMock.mockImplementation(async () => {
      active += 1;
      concurrentPeak = Math.max(concurrentPeak, active);
      activeCalls.push(active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return {
        id: "p",
        alt: "alt",
        src: { large2x: "https://pexels.example/p.jpg" },
      };
    });

    const { client } = makeFakeSupabase([]);
    const experiences = [
      experienceRow({ id: "a" }),
      experienceRow({ id: "b" }),
      experienceRow({ id: "c" }),
    ];

    await runExperienceImageEnrichment(client, experiences, { delayMs: 0 });

    expect(concurrentPeak).toBe(1);
  });

  it("keeps successful updates when one item fails", async () => {
    searchPexelsPhotoMock
      .mockResolvedValueOnce({
        id: "p1",
        alt: "a",
        src: { large2x: "https://pexels.example/1.jpg" },
      })
      .mockRejectedValueOnce(new Error("provider exploded"))
      .mockResolvedValueOnce({
        id: "p3",
        alt: "c",
        src: { large2x: "https://pexels.example/3.jpg" },
      });

    const { client, rows } = makeFakeSupabase([
      experienceRow({ id: "a" }),
      experienceRow({ id: "b" }),
      experienceRow({ id: "c" }),
    ]);

    const summary = await runExperienceImageEnrichment(
      client,
      [rows[0], rows[1], rows[2]],
      { delayMs: 0 },
    );

    expect(summary.updated).toBe(2);
    expect(summary.failed).toBe(1);
    expect(rows[0].image_url).toContain("a-p1.webp");
    expect(rows[2].image_url).toContain("c-p3.webp");
  });

  it("stops on a rate limit but keeps prior successes", async () => {
    searchPexelsPhotoMock
      .mockResolvedValueOnce({
        id: "p1",
        alt: "a",
        src: { large2x: "https://pexels.example/1.jpg" },
      })
      .mockRejectedValueOnce(new PexelsRateLimitError(30));

    const { client, rows } = makeFakeSupabase([
      experienceRow({ id: "a" }),
      experienceRow({ id: "b" }),
      experienceRow({ id: "c" }),
    ]);

    const summary = await runExperienceImageEnrichment(
      client,
      [rows[0], rows[1], rows[2]],
      { delayMs: 0 },
    );

    expect(summary.updated).toBe(1);
    expect(summary.stoppedReason).toBe("rate_limited");
    expect(searchPexelsPhotoMock).toHaveBeenCalledTimes(2);
  });
});
