import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildExperiencesWorkbook,
  workbookToBlob,
  type ExperienceExcelRow,
} from "@/lib/admin/experiences/excel";
import { fingerprintExperience } from "@/lib/admin/experiences/import";
import type { ExperienceExportItem } from "@/lib/admin/experiences/queries";

const { listExportMock, rpcMock } = vi.hoisted(() => ({
  listExportMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("@/lib/admin/experiences/queries", () => ({
  listExperiencesForExport: listExportMock,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: rpcMock }),
}));

import { applyExperienceImport } from "@/lib/admin/experiences/apply";

function row(overrides: Partial<ExperienceExcelRow> = {}): ExperienceExcelRow {
  return {
    id: "",
    title: "Watch a sunrise",
    slug: "watch-a-sunrise",
    description: "Wake up early",
    category: "Nature",
    difficulty: "Easy",
    location_type: "global",
    country_code: "",
    city: "",
    image_url: "",
    image_alt: "",
    why_it_matters: "",
    what_to_know: "",
    best_time: "",
    duration_text: "",
    location_note: "",
    featured: false,
    is_public: true,
    ...overrides,
  };
}

async function bufferFromRows(
  rows: ExperienceExcelRow[],
): Promise<ArrayBuffer> {
  const workbook = buildExperiencesWorkbook(rows);
  const blob = await workbookToBlob(workbook);
  return blob.arrayBuffer();
}

function existingItem(
  overrides: Partial<ExperienceExportItem> = {},
): ExperienceExportItem {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Watch a sunrise",
    slug: "watch-a-sunrise",
    description: "Wake up early",
    category: "Nature",
    difficulty: "Easy",
    location_type: "global",
    country_code: null,
    city: null,
    image_url: null,
    image_alt: null,
    why_it_matters: null,
    what_to_know: null,
    best_time: null,
    duration_text: null,
    location_note: null,
    featured: false,
    is_public: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  rpcMock.mockResolvedValue({
    data: { created_ids: [], updated_count: 0 },
    error: null,
  });
});

describe("applyExperienceImport — revalidation", () => {
  it("rejects an invalid workbook without calling the database", async () => {
    listExportMock.mockResolvedValue([]);
    const buffer = new TextEncoder().encode("not a workbook").buffer;

    const result = await applyExperienceImport(buffer, {});

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("invalid_file");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown non-empty id", async () => {
    listExportMock.mockResolvedValue([]);
    const buffer = await bufferFromRows([
      row({ id: "99999999-9999-4999-8999-999999999999" }),
    ]);

    const result = await applyExperienceImport(buffer, {});

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("validation_error");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate ids in the workbook", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    const buffer = await bufferFromRows([
      row({ id: existing.id, slug: "a" }),
      row({ id: existing.id, slug: "b", title: "Second" }),
    ]);

    const result = await applyExperienceImport(buffer, {
      [existing.id]: fingerprintExperience(existing),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("validation_error");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate slugs in the workbook", async () => {
    listExportMock.mockResolvedValue([]);
    const buffer = await bufferFromRows([
      row({ id: "", slug: "shared", title: "First" }),
      row({ id: "", slug: "shared", title: "Second" }),
    ]);

    const result = await applyExperienceImport(buffer, {});

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("validation_error");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects a slug collision with an existing DB experience", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    const buffer = await bufferFromRows([
      row({ id: "", slug: existing.slug, title: "Different" }),
    ]);

    const result = await applyExperienceImport(buffer, {});

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("validation_error");
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("applyExperienceImport — concurrency", () => {
  it("allows apply when the DB row is unchanged since preview", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Hard" }),
    ]);

    const result = await applyExperienceImport(buffer, {
      [existing.id]: fingerprintExperience(existing),
    });

    expect(result.ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledOnce();
  });

  it("rejects apply when the update target changed after preview", async () => {
    const existing = existingItem();
    const staleFingerprint = fingerprintExperience(
      existingItem({ difficulty: "Easy" }),
    );
    // Simulate the DB having moved on to "Hard" since the preview was taken.
    listExportMock.mockResolvedValue([existingItem({ difficulty: "Hard" })]);
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Medium" }),
    ]);

    const result = await applyExperienceImport(buffer, {
      [existing.id]: staleFingerprint,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("stale_preview");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("treats a deleted experience as a blocking conflict with zero writes", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([]); // deleted since preview
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Hard" }),
    ]);

    const result = await applyExperienceImport(buffer, {
      [existing.id]: fingerprintExperience(existing),
    });

    expect(result.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("treats a slug that became occupied after preview as a blocking conflict", async () => {
    const target = existingItem();
    const other = existingItem({
      id: "22222222-2222-4222-8222-222222222222",
      slug: "taken-since-preview",
    });
    listExportMock.mockResolvedValue([target, other]);
    const buffer = await bufferFromRows([
      row({ id: target.id, slug: "taken-since-preview" }),
    ]);

    const result = await applyExperienceImport(buffer, {
      [target.id]: fingerprintExperience(target),
    });

    expect(result.ok).toBe(false);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("blocks apply when no fingerprint was supplied for an update row", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Hard" }),
    ]);

    const result = await applyExperienceImport(buffer, {});

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("stale_preview");
    expect(rpcMock).not.toHaveBeenCalled();
  });
});

describe("applyExperienceImport — apply semantics", () => {
  it("succeeds for a create-only import and returns DB-generated ids", async () => {
    listExportMock.mockResolvedValue([]);
    rpcMock.mockResolvedValue({
      data: { created_ids: ["new-id-1"], updated_count: 0 },
      error: null,
    });
    const buffer = await bufferFromRows([row({ id: "", slug: "brand-new" })]);

    const result = await applyExperienceImport(buffer, {});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.created).toEqual([
        { id: "new-id-1", title: "Watch a sunrise" },
      ]);
      expect(result.updated).toEqual([]);
    }

    const payload = rpcMock.mock.calls[0][1];
    expect(payload.creates[0].id).toBeUndefined();
  });

  it("succeeds for an update-only import", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Hard" }),
    ]);

    const result = await applyExperienceImport(buffer, {
      [existing.id]: fingerprintExperience(existing),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.updated).toEqual([
        { id: existing.id, title: existing.title },
      ]);
      expect(result.created).toEqual([]);
    }
  });

  it("succeeds for a mixed create/update import", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    rpcMock.mockResolvedValue({
      data: { created_ids: ["new-id-2"], updated_count: 1 },
      error: null,
    });
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Hard" }),
      row({ id: "", slug: "another-new-row", title: "Another" }),
    ]);

    const result = await applyExperienceImport(buffer, {
      [existing.id]: fingerprintExperience(existing),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.created).toHaveLength(1);
      expect(result.updated).toHaveLength(1);
    }
  });

  it("does not send unchanged rows to the database", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    const buffer = await bufferFromRows([row({ id: existing.id })]);

    const result = await applyExperienceImport(buffer, {});

    expect(result.ok).toBe(true);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("leaves rows absent from the workbook out of the write payload", async () => {
    const existing = existingItem();
    const untouched = existingItem({
      id: "33333333-3333-4333-8333-333333333333",
      slug: "untouched-row",
    });
    listExportMock.mockResolvedValue([existing, untouched]);
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Hard" }),
    ]);

    await applyExperienceImport(buffer, {
      [existing.id]: fingerprintExperience(existing),
    });

    const payload = rpcMock.mock.calls[0][1];
    const updatedIds = payload.updates.map((u: { id: string }) => u.id);
    expect(updatedIds).toEqual([existing.id]);
    expect(updatedIds).not.toContain(untouched.id);
  });
});

describe("applyExperienceImport — atomicity boundary", () => {
  it("performs exactly one RPC call for a mixed import, never sequential writes", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Hard" }),
      row({ id: "", slug: "another-new-row", title: "Another" }),
    ]);

    await applyExperienceImport(buffer, {
      [existing.id]: fingerprintExperience(existing),
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(
      "apply_experience_import",
      expect.objectContaining({
        creates: expect.any(Array),
        updates: expect.any(Array),
      }),
    );
  });

  it("reports apply_failed and makes no other calls when the RPC fails", async () => {
    const existing = existingItem();
    listExportMock.mockResolvedValue([existing]);
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "simulated failure mid-transaction" },
    });
    const buffer = await bufferFromRows([
      row({ id: existing.id, difficulty: "Hard" }),
      row({ id: "", slug: "another-new-row", title: "Another" }),
    ]);

    const result = await applyExperienceImport(buffer, {
      [existing.id]: fingerprintExperience(existing),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("apply_failed");
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });
});
