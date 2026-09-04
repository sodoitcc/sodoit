import { requireAdminForRequest } from "@/lib/admin/httpAuth";
import {
  buildGuidesWorkbook,
  GUIDE_TEMPLATE_FILENAME,
  workbookToBlob,
} from "@/lib/admin/guides/excel";

export async function GET() {
  const admin = await requireAdminForRequest();
  if (!admin.ok) return admin.response;

  const workbook = buildGuidesWorkbook([], [], []);
  const blob = await workbookToBlob(workbook);

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="${GUIDE_TEMPLATE_FILENAME}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
