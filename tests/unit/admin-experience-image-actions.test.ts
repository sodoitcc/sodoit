import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  createAdminClientMock,
  findExperiencesMissingImagesMock,
  regenerateExperienceImageMock,
  runExperienceImageEnrichmentMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  findExperiencesMissingImagesMock: vi.fn(),
  regenerateExperienceImageMock: vi.fn(),
  runExperienceImageEnrichmentMock: vi.fn(),
}));

vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../../scripts/lib/experience-image-service.mjs", () => ({
  findExperiencesMissingImages: findExperiencesMissingImagesMock,
  regenerateExperienceImage: regenerateExperienceImageMock,
  runExperienceImageEnrichment: runExperienceImageEnrichmentMock,
}));

import {
  countMissingExperienceImages,
  generateExperienceImagesForIds,
  generateMissingExperienceImagesChunk,
  regenerateSingleExperienceImage,
} from "@/lib/admin/experiences/image-actions";

const VALID_UUID_A = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_B = "22222222-2222-4222-8222-222222222222";

function fakeCountClient(count: number) {
  return {
    from() {
      return {
        select() {
          return { or: () => Promise.resolve({ count, error: null }) };
        },
      };
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ ok: true, userId: "admin-user" });
});

describe("countMissingExperienceImages", () => {
  it("returns 0 when the caller is not an admin", async () => {
    requireAdminMock.mockResolvedValue({ ok: false, error: "nope" });
    const count = await countMissingExperienceImages();
    expect(count).toBe(0);
  });

  it("returns the count from the database", async () => {
    createAdminClientMock.mockReturnValue(fakeCountClient(7));
    const count = await countMissingExperienceImages();
    expect(count).toBe(7);
  });
});

describe("generateMissingExperienceImagesChunk", () => {
  it("rejects when the caller is not an admin", async () => {
    requireAdminMock.mockResolvedValue({ ok: false, error: "Admin access required." });
    const result = await generateMissingExperienceImagesChunk({});
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(findExperiencesMissingImagesMock).not.toHaveBeenCalled();
  });

  it("clamps chunkSize instead of processing everything at once", async () => {
    createAdminClientMock.mockReturnValue(fakeCountClient(0));
    findExperiencesMissingImagesMock.mockResolvedValue([]);
    runExperienceImageEnrichmentMock.mockResolvedValue({
      attempted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      failures: [],
      stoppedReason: null,
    });

    await generateMissingExperienceImagesChunk({ chunkSize: 9999 });

    expect(findExperiencesMissingImagesMock).toHaveBeenCalledWith(
      expect.anything(),
      { limit: 25 },
    );
  });

  it("reports done when no Experiences remain missing an image", async () => {
    createAdminClientMock.mockReturnValue(fakeCountClient(0));
    findExperiencesMissingImagesMock.mockResolvedValue([]);
    runExperienceImageEnrichmentMock.mockResolvedValue({
      attempted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      failures: [],
      stoppedReason: null,
    });

    const result = await generateMissingExperienceImagesChunk({});
    expect(result).toMatchObject({ success: true, done: true, remainingCount: 0 });
  });
});

describe("generateExperienceImagesForIds", () => {
  it("filters out invalid ids before querying", async () => {
    const result = await generateExperienceImagesForIds({
      ids: ["not-a-uuid", "also-bad"],
    });
    expect(result).toEqual({
      success: false,
      error: "No valid Experience ids provided.",
    });
  });

  it("processes only a bounded chunk of the given ids", async () => {
    const client = {
      from() {
        return {
          select() {
            return {
              in(_col: string, ids: string[]) {
                return {
                  or: () =>
                    Promise.resolve({
                      data: ids.map((id) => ({ id })),
                      error: null,
                    }),
                };
              },
            };
          },
        };
      },
    };
    createAdminClientMock.mockReturnValue(client);
    runExperienceImageEnrichmentMock.mockResolvedValue({
      attempted: 1,
      updated: 1,
      skipped: 0,
      failed: 0,
      failures: [],
      stoppedReason: null,
    });

    const result = await generateExperienceImagesForIds({
      ids: [VALID_UUID_A, VALID_UUID_B],
      chunkSize: 1,
    });

    expect(result).toMatchObject({ success: true, nextCursor: 1, done: false });
    expect(runExperienceImageEnrichmentMock).toHaveBeenCalledWith(
      client,
      [{ id: VALID_UUID_A }],
    );
  });
});

describe("regenerateSingleExperienceImage", () => {
  it("rejects when the caller is not an admin", async () => {
    requireAdminMock.mockResolvedValue({ ok: false, error: "Admin access required." });
    const result = await regenerateSingleExperienceImage(VALID_UUID_A);
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(regenerateExperienceImageMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid id", async () => {
    const result = await regenerateSingleExperienceImage("not-a-uuid");
    expect(result).toEqual({ success: false, error: "Invalid Experience id." });
    expect(regenerateExperienceImageMock).not.toHaveBeenCalled();
  });

  it("targets exactly the given Experience id", async () => {
    createAdminClientMock.mockReturnValue({});
    regenerateExperienceImageMock.mockResolvedValue({
      ok: true,
      imageUrl: "https://cdn/new.webp",
      imageAlt: "New alt",
    });

    await regenerateSingleExperienceImage(VALID_UUID_A);

    expect(regenerateExperienceImageMock).toHaveBeenCalledWith(
      {},
      VALID_UUID_A,
    );
  });

  it("surfaces a clean error without mutating on failure", async () => {
    createAdminClientMock.mockReturnValue({});
    regenerateExperienceImageMock.mockResolvedValue({
      ok: false,
      error: "no_results",
    });

    const result = await regenerateSingleExperienceImage(VALID_UUID_A);
    expect(result).toEqual({
      success: false,
      error: "No matching image was found.",
    });
  });
});
