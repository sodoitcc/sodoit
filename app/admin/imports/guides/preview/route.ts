import { requireAdminForRequest } from "@/lib/admin/httpAuth";
import { listGuidesForExport } from "@/lib/admin/guides/queries";
import {
  buildGuideImportPreview,
  parseGuidesWorkbook,
} from "@/lib/admin/guides/import";
import { readXlsxUpload } from "@/lib/admin/uploadGuard";
import { logger } from "@/lib/logger";

function badRequest(error: string) {
  return Response.json({ ok: false, error }, { status: 400 });
}

export async function POST(request: Request) {
  const admin = await requireAdminForRequest();
  if (!admin.ok) return admin.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("Could not read the upload.");
  }

  const upload = await readXlsxUpload(formData);
  if (!upload.ok) return badRequest(upload.error);

  const parseResult = await parseGuidesWorkbook(upload.buffer);
  if (!parseResult.ok) {
    return badRequest(parseResult.error);
  }

  try {
    const { guides, items, comparisons } = await listGuidesForExport();
    const preview = buildGuideImportPreview(
      parseResult.guideRows,
      parseResult.spotRows,
      parseResult.comparisonRows,
      guides,
      items,
      comparisons,
    );
    return Response.json({ ok: true, preview });
  } catch (error) {
    logger.error("admin.guides.import_preview_failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return Response.json(
      { ok: false, error: "Could not build the import preview." },
      { status: 500 },
    );
  }
}
