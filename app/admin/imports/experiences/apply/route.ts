import { requireAdminForRequest } from "@/lib/admin/httpAuth";
import { readXlsxUpload } from "@/lib/admin/uploadGuard";
import { applyExperienceImport } from "@/lib/admin/experiences/apply";

function badRequest(error: string, extra: Record<string, unknown> = {}) {
  return Response.json({ ok: false, error, ...extra }, { status: 400 });
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

  let clientFingerprints: Record<string, string> = {};
  const rawFingerprints = formData.get("fingerprints");
  if (typeof rawFingerprints === "string" && rawFingerprints.length > 0) {
    try {
      const parsed = JSON.parse(rawFingerprints);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        clientFingerprints = Object.fromEntries(
          Object.entries(parsed).filter(
            ([, value]) => typeof value === "string",
          ),
        ) as Record<string, string>;
      }
    } catch {
      return badRequest("Could not read the import fingerprints.");
    }
  }

  const result = await applyExperienceImport(upload.buffer, clientFingerprints);

  if (result.ok) {
    return Response.json({
      ok: true,
      created: result.created,
      updated: result.updated,
    });
  }

  if (result.kind === "invalid_file") {
    return badRequest(result.error, { kind: result.kind });
  }

  if (result.kind === "validation_error") {
    return Response.json(
      {
        ok: false,
        kind: result.kind,
        error:
          "This file has validation errors. Review the import again before applying.",
        preview: result.preview,
      },
      { status: 400 },
    );
  }

  if (result.kind === "stale_preview") {
    return Response.json(
      {
        ok: false,
        kind: result.kind,
        error:
          "Some Ticks changed since this preview was created. Review the import again before applying.",
        conflicts: result.conflicts,
      },
      { status: 409 },
    );
  }

  return Response.json(
    { ok: false, kind: result.kind, error: result.error },
    { status: 500 },
  );
}
