import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminMock, listExportMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  listExportMock: vi.fn(),
}));

vi.mock("@/lib/admin/requireAdmin", () => ({
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/admin/guides/queries", () => ({
  listGuidesForExport: listExportMock,
}));

import { GET as exportRoute } from "@/app/admin/imports/guides/export/route";
import { GET as templateRoute } from "@/app/admin/imports/guides/template/route";

beforeEach(() => {
  vi.clearAllMocks();
  listExportMock.mockResolvedValue({ guides: [], items: [], comparisons: [] });
});

describe("guides export route", () => {
  it("returns 401 for an unauthenticated request", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "You must be signed in.",
    });

    const response = await exportRoute();

    expect(response.status).toBe(401);
    expect(listExportMock).not.toHaveBeenCalled();
  });

  it("returns 403 for an authenticated non-admin", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const response = await exportRoute();

    expect(response.status).toBe(403);
    expect(listExportMock).not.toHaveBeenCalled();
  });

  it("returns an xlsx attachment for an admin", async () => {
    requireAdminMock.mockResolvedValue({ ok: true, userId: "admin-1" });

    const response = await exportRoute();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("spreadsheetml");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="sodoit-guides-\d{4}-\d{2}-\d{2}\.xlsx"$/,
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(listExportMock).toHaveBeenCalledOnce();
  });
});

describe("guides template route", () => {
  it("returns 401 for an unauthenticated request", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "You must be signed in.",
    });

    const response = await templateRoute();

    expect(response.status).toBe(401);
  });

  it("returns 403 for an authenticated non-admin", async () => {
    requireAdminMock.mockResolvedValue({
      ok: false,
      error: "Admin access required.",
    });

    const response = await templateRoute();

    expect(response.status).toBe(403);
  });

  it("returns the template xlsx for an admin without querying the database", async () => {
    requireAdminMock.mockResolvedValue({ ok: true, userId: "admin-1" });

    const response = await templateRoute();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="sodoit-guides-template.xlsx"',
    );
    expect(listExportMock).not.toHaveBeenCalled();
  });
});
