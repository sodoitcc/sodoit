import { requireAdminForRequest } from "@/lib/admin/httpAuth";
import { readXlsxUpload } from "@/lib/admin/uploadGuard";
import { applyGuideImport } from "@/lib/admin/guides/apply";

function badRequest(error: string, extra: Record<string, unknown> = {}) {
  return Response.json({ ok: false, error, ...extra }, { status: 400 });
}

function parseFingerprintField(
  formData: FormData,
  field: string,
): Record<string, string> | null {
  const raw = formData.get(field);
  if (typeof raw !== "string" || raw.length === 0) return {};

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => typeof value === "string"),
      ) as Record<string, string>;
    }
    return null;
  } catch {
    return null;
  }
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

  const guideFingerprints = parseFingerprintField(
    formData,
    "guideFingerprints",
  );
  if (guideFingerprints === null) {
    return badRequest("Could not read the import fingerprints.");
  }

  const spotFingerprints = parseFingerprintField(formData, "spotFingerprints");
  if (spotFingerprints === null) {
    return badRequest("Could not read the import fingerprints.");
  }

  const comparisonFingerprints = parseFingerprintField(
    formData,
    "comparisonFingerprints",
  );
  if (comparisonFingerprints === null) {
    return badRequest("Could not read the import fingerprints.");
  }

  const result = await applyGuideImport(
    upload.buffer,
    guideFingerprints,
    spotFingerprints,
    comparisonFingerprints,
  );

  if (result.ok) {
    return Response.json({
      ok: true,
      guides: result.guides,
      spots: result.spots,
      comparisons: result.comparisons,
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
          "Some rows changed since this preview was generated. Review the import again before applying.",
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
