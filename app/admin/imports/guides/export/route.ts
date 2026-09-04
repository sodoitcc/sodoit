import { requireAdminForRequest } from "@/lib/admin/httpAuth";
import { listGuidesForExport } from "@/lib/admin/guides/queries";
import {
  buildGuidesWorkbook,
  guideExportFilename,
  toGuideComparisonExcelRow,
  toGuideExcelRow,
  toGuideSpotExcelRow,
  workbookToBlob,
} from "@/lib/admin/guides/excel";

export async function GET() {
  const admin = await requireAdminForRequest();
  if (!admin.ok) return admin.response;

  const { guides, items, comparisons } = await listGuidesForExport();
  const guideSlugById = new Map(guides.map((guide) => [guide.id, guide.slug]));

  const workbook = buildGuidesWorkbook(
    guides.map(toGuideExcelRow),
    items.map((item) => toGuideSpotExcelRow(item, guideSlugById)),
    comparisons.map((pair) => toGuideComparisonExcelRow(pair, guideSlugById)),
  );
  const blob = await workbookToBlob(workbook);

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="${guideExportFilename()}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
