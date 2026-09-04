"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import type {
  GuideComparisonImportChange,
  GuideComparisonImportPreviewRow,
  GuideImportChange,
  GuideImportPreview,
  GuideImportPreviewRow,
  GuideImportSummary,
  GuideSpotImportChange,
  GuideSpotImportPreviewRow,
} from "@/lib/admin/guides/import";
import type { GuideApplyConflict } from "@/lib/admin/guides/apply";

type PreviewResponse =
  { ok: true; preview: GuideImportPreview } | { ok: false; error: string };

interface ApplyEntitySummary {
  created: { id: string; title: string }[];
  updated: { id: string; title: string }[];
}

type ApplyResponse =
  | {
      ok: true;
      guides: ApplyEntitySummary;
      spots: ApplyEntitySummary;
      comparisons: ApplyEntitySummary;
    }
  | {
      ok: false;
      kind: "invalid_file" | "validation_error" | "apply_failed";
      error: string;
    }
  | {
      ok: false;
      kind: "stale_preview";
      error: string;
      conflicts: GuideApplyConflict[];
    };

type ApplyState =
  | { status: "idle" }
  | { status: "pending" }
  | {
      status: "success";
      guides: ApplyEntitySummary;
      spots: ApplyEntitySummary;
      comparisons: ApplyEntitySummary;
    }
  | { status: "stale"; conflicts: GuideApplyConflict[] }
  | { status: "error"; message: string };

const STATUS_BADGE: Record<
  "create" | "update" | "unchanged" | "error",
  { label: string; className: string }
> = {
  create: { label: "Create", className: "bg-success-light text-success" },
  update: { label: "Update", className: "bg-accent-wash text-accent-dark" },
  unchanged: { label: "Unchanged", className: "bg-surface-subtle text-muted" },
  error: { label: "Error", className: "bg-danger-light text-danger" },
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (Array.isArray(value))
    return value.length > 0 ? value.join(", ") : "(empty)";
  return String(value);
}

function StatusBadge({
  status,
}: {
  status: "create" | "update" | "unchanged" | "error";
}) {
  const badge = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

function SummaryPills({ summary }: { summary: GuideImportSummary }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-semibold">
      <span className="rounded-pill bg-success-light px-2.5 py-1 text-success">
        {summary.create} create
      </span>
      <span className="rounded-pill bg-accent-wash px-2.5 py-1 text-accent-dark">
        {summary.update} update
      </span>
      <span className="rounded-pill bg-surface-subtle px-2.5 py-1 text-muted">
        {summary.unchanged} unchanged
      </span>
      <span className="rounded-pill bg-danger-light px-2.5 py-1 text-danger">
        {summary.error} errors
      </span>
    </div>
  );
}

function PreviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ChangeLine({
  change,
}: {
  change:
    GuideImportChange | GuideSpotImportChange | GuideComparisonImportChange;
}) {
  return (
    <div className="text-xs text-secondary">
      <span className="font-semibold text-ink">{change.field}</span>{" "}
      <span className="text-muted">{formatValue(change.before)}</span>
      {" → "}
      <span className="text-ink">{formatValue(change.after)}</span>
    </div>
  );
}

export function GuideImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GuideImportPreview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyState, setApplyState] = useState<ApplyState>({ status: "idle" });

  function reset() {
    setFile(null);
    setPreviewError(null);
    setPreview(null);
    setConfirmOpen(false);
    setApplyState({ status: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewError(null);
    setPreview(null);
    setConfirmOpen(false);
    setApplyState({ status: "idle" });
    setIsAnalyzing(true);

    const formData = new FormData();
    formData.set("file", selected);

    try {
      const response = await fetch("/admin/imports/guides/preview", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as PreviewResponse;

      if (!result.ok) {
        setPreviewError(result.error);
        return;
      }

      setPreview(result.preview);
    } catch {
      setPreviewError("Could not analyze this file. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleApply() {
    if (!file || !preview || applyState.status === "pending") return;

    setApplyState({ status: "pending" });

    const guideFingerprints = Object.fromEntries(
      preview.guides
        .filter((row) => row.status === "update")
        .map((row) => [row.id, row.baseFingerprint]),
    );
    const spotFingerprints = Object.fromEntries(
      preview.spots
        .filter((row) => row.status === "update")
        .map((row) => [row.id, row.baseFingerprint]),
    );
    const comparisonFingerprints = Object.fromEntries(
      preview.comparisons
        .filter((row) => row.status === "update")
        .map((row) => [row.id, row.baseFingerprint]),
    );

    const formData = new FormData();
    formData.set("file", file);
    formData.set("guideFingerprints", JSON.stringify(guideFingerprints));
    formData.set("spotFingerprints", JSON.stringify(spotFingerprints));
    formData.set(
      "comparisonFingerprints",
      JSON.stringify(comparisonFingerprints),
    );

    try {
      const response = await fetch("/admin/imports/guides/apply", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as ApplyResponse;

      if (result.ok) {
        setApplyState({
          status: "success",
          guides: result.guides,
          spots: result.spots,
          comparisons: result.comparisons,
        });
        setPreview(null);
        setConfirmOpen(false);
        return;
      }

      if (result.kind === "stale_preview") {
        setApplyState({ status: "stale", conflicts: result.conflicts });
        setPreview(null);
        setConfirmOpen(false);
        return;
      }

      setApplyState({ status: "error", message: result.error });
    } catch {
      setApplyState({
        status: "error",
        message: "Could not apply this import. Please try again.",
      });
    }
  }

  const guideErrors =
    preview?.guides.filter(
      (row): row is Extract<GuideImportPreviewRow, { status: "error" }> =>
        row.status === "error",
    ) ?? [];
  const guideUpdates =
    preview?.guides.filter(
      (row): row is Extract<GuideImportPreviewRow, { status: "update" }> =>
        row.status === "update",
    ) ?? [];
  const guideCreates =
    preview?.guides.filter(
      (row): row is Extract<GuideImportPreviewRow, { status: "create" }> =>
        row.status === "create",
    ) ?? [];

  const spotErrors =
    preview?.spots.filter(
      (row): row is Extract<GuideSpotImportPreviewRow, { status: "error" }> =>
        row.status === "error",
    ) ?? [];
  const spotUpdates =
    preview?.spots.filter(
      (row): row is Extract<GuideSpotImportPreviewRow, { status: "update" }> =>
        row.status === "update",
    ) ?? [];
  const spotCreates =
    preview?.spots.filter(
      (row): row is Extract<GuideSpotImportPreviewRow, { status: "create" }> =>
        row.status === "create",
    ) ?? [];

  const comparisonErrors =
    preview?.comparisons.filter(
      (
        row,
      ): row is Extract<GuideComparisonImportPreviewRow, { status: "error" }> =>
        row.status === "error",
    ) ?? [];
  const comparisonUpdates =
    preview?.comparisons.filter(
      (
        row,
      ): row is Extract<
        GuideComparisonImportPreviewRow,
        { status: "update" }
      > => row.status === "update",
    ) ?? [];
  const comparisonCreates =
    preview?.comparisons.filter(
      (
        row,
      ): row is Extract<
        GuideComparisonImportPreviewRow,
        { status: "create" }
      > => row.status === "create",
    ) ?? [];

  const totalErrors =
    (preview?.summary.guides.error ?? 0) +
    (preview?.summary.spots.error ?? 0) +
    (preview?.summary.comparisons.error ?? 0);

  const totalChanges = preview
    ? preview.summary.guides.create +
      preview.summary.guides.update +
      preview.summary.spots.create +
      preview.summary.spots.update +
      preview.summary.comparisons.create +
      preview.summary.comparisons.update
    : 0;

  const canApply = Boolean(preview) && totalErrors === 0 && totalChanges > 0;

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={isAnalyzing || applyState.status === "pending"}
        >
          {isAnalyzing ? "Analyzing..." : "Import Excel"}
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileChange}
        />

        {file && <span className="text-sm text-muted">{file.name}</span>}

        {(preview || previewError || applyState.status !== "idle") && (
          <button
            type="button"
            onClick={reset}
            className="text-sm font-medium text-secondary hover:text-ink"
          >
            Choose another file
          </button>
        )}
      </div>

      {previewError && (
        <p
          role="alert"
          className="mt-4 rounded-control border border-danger/20 bg-danger-light px-3.5 py-2.5 text-[13px] text-danger"
        >
          {previewError}
        </p>
      )}

      {applyState.status === "stale" && (
        <div className="mt-4 rounded-control border border-danger/20 bg-danger-light p-3.5">
          <p className="text-sm font-semibold text-danger">
            Import needs review
          </p>
          <p className="mt-1 text-[13px] text-danger">
            Some rows changed since this preview was generated. Choose the
            workbook again and review the latest diff before applying.
          </p>
          {applyState.conflicts.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-[13px] text-danger">
              {applyState.conflicts.map((conflict) => (
                <li key={`${conflict.entity}-${conflict.id}`}>
                  {conflict.entity}: {conflict.title || conflict.id}
                  {conflict.reason === "changed"
                    ? " — changed in the database"
                    : " — could not verify against the database"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {applyState.status === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-control border border-danger/20 bg-danger-light px-3.5 py-2.5 text-[13px] text-danger"
        >
          {applyState.message}
        </p>
      )}

      {applyState.status === "success" && (
        <div className="mt-4 rounded-control border border-success/20 bg-success-light p-3.5">
          <p className="text-sm font-semibold text-success">Import completed</p>
          <div className="mt-2 flex flex-col gap-1 text-sm text-success">
            <div className="flex gap-4">
              <span>Guides created {applyState.guides.created.length}</span>
              <span>Guides updated {applyState.guides.updated.length}</span>
            </div>
            <div className="flex gap-4">
              <span>Spots created {applyState.spots.created.length}</span>
              <span>Spots updated {applyState.spots.updated.length}</span>
            </div>
            <div className="flex gap-4">
              <span>
                Comparisons created {applyState.comparisons.created.length}
              </span>
              <span>
                Comparisons updated {applyState.comparisons.updated.length}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <a
              href="/admin/imports/guides/export"
              className="text-sm font-medium text-secondary hover:text-ink"
            >
              Export current data again
            </a>
          </div>
        </div>
      )}

      {preview && (
        <div className="mt-6 flex flex-col gap-8">
          <p className="text-sm text-muted">
            No changes have been applied yet.
          </p>

          <div>
            <p className="text-sm font-semibold text-ink">
              Guides — {preview.summary.guides.total} analyzed
            </p>
            <div className="mt-2">
              <SummaryPills summary={preview.summary.guides} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">
              Spots — {preview.summary.spots.total} analyzed
            </p>
            <div className="mt-2">
              <SummaryPills summary={preview.summary.spots} />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">
              Comparisons — {preview.summary.comparisons.total} analyzed
            </p>
            <div className="mt-2">
              <SummaryPills summary={preview.summary.comparisons} />
            </div>
          </div>

          {canApply && !confirmOpen && (
            <Button
              type="button"
              className="self-start"
              onClick={() => setConfirmOpen(true)}
            >
              Apply changes
            </Button>
          )}

          {!canApply && totalErrors > 0 && (
            <p className="text-sm text-danger">
              Fix the errors below before this workbook can be applied.
            </p>
          )}

          {canApply && confirmOpen && (
            <div className="rounded-control border border-border bg-surface-subtle p-3.5">
              <p className="text-sm font-semibold text-ink">
                Apply {totalChanges} changes?
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleApply}
                  disabled={applyState.status === "pending"}
                >
                  {applyState.status === "pending"
                    ? "Applying..."
                    : "Apply changes"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmOpen(false)}
                  disabled={applyState.status === "pending"}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {guideErrors.length > 0 && (
            <PreviewSection title={`Guide errors (${guideErrors.length})`}>
              {guideErrors.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="error" />
                    <span className="text-xs text-muted">
                      Guide · Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.title || row.slug || "Untitled row"}
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-danger">
                    {row.errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </PreviewSection>
          )}

          {spotErrors.length > 0 && (
            <PreviewSection title={`Spot errors (${spotErrors.length})`}>
              {spotErrors.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="error" />
                    <span className="text-xs text-muted">
                      Spot · Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.title || row.guideSlug || "Untitled row"}
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-danger">
                    {row.errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </PreviewSection>
          )}

          {comparisonErrors.length > 0 && (
            <PreviewSection
              title={`Comparison errors (${comparisonErrors.length})`}
            >
              {comparisonErrors.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="error" />
                    <span className="text-xs text-muted">
                      Comparison · Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.skipTitle || row.guideSlug || "Untitled row"}
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-danger">
                    {row.errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </PreviewSection>
          )}

          {guideUpdates.length > 0 && (
            <PreviewSection title={`Guide updates (${guideUpdates.length})`}>
              {guideUpdates.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="update" />
                    <span className="text-xs text-muted">
                      Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.candidate.title}
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {row.changes.map((change) => (
                      <ChangeLine key={change.field} change={change} />
                    ))}
                  </div>
                </div>
              ))}
            </PreviewSection>
          )}

          {spotUpdates.length > 0 && (
            <PreviewSection title={`Spot updates (${spotUpdates.length})`}>
              {spotUpdates.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="update" />
                    <span className="text-xs text-muted">
                      Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.candidate.title}
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {row.changes.map((change) => (
                      <ChangeLine key={change.field} change={change} />
                    ))}
                  </div>
                </div>
              ))}
            </PreviewSection>
          )}

          {comparisonUpdates.length > 0 && (
            <PreviewSection
              title={`Comparison updates (${comparisonUpdates.length})`}
            >
              {comparisonUpdates.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="update" />
                    <span className="text-xs text-muted">
                      Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.candidate.skip_title} →{" "}
                    {row.candidate.go_instead_title}
                  </p>
                  <div className="mt-2 flex flex-col gap-1">
                    {row.changes.map((change) => (
                      <ChangeLine key={change.field} change={change} />
                    ))}
                  </div>
                </div>
              ))}
            </PreviewSection>
          )}

          {guideCreates.length > 0 && (
            <PreviewSection title={`Guide creates (${guideCreates.length})`}>
              {guideCreates.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="create" />
                    <span className="text-xs text-muted">
                      Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.candidate.title}
                  </p>
                  <p className="text-xs text-muted">
                    {row.candidate.slug} · {row.candidate.type || "—"} ·{" "}
                    {row.candidate.city}
                  </p>
                </div>
              ))}
            </PreviewSection>
          )}

          {spotCreates.length > 0 && (
            <PreviewSection title={`Spot creates (${spotCreates.length})`}>
              {spotCreates.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="create" />
                    <span className="text-xs text-muted">
                      Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.candidate.title}
                  </p>
                  <p className="text-xs text-muted">
                    → {row.candidate.guideSlug}
                  </p>
                </div>
              ))}
            </PreviewSection>
          )}

          {comparisonCreates.length > 0 && (
            <PreviewSection
              title={`Comparison creates (${comparisonCreates.length})`}
            >
              {comparisonCreates.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="create" />
                    <span className="text-xs text-muted">
                      Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.candidate.skip_title} →{" "}
                    {row.candidate.go_instead_title}
                  </p>
                  <p className="text-xs text-muted">
                    → {row.candidate.guideSlug}
                  </p>
                </div>
              ))}
            </PreviewSection>
          )}

          {preview.summary.guides.unchanged > 0 && (
            <p className="text-sm text-muted">
              {preview.summary.guides.unchanged} Guide
              {preview.summary.guides.unchanged === 1 ? "" : "s"} unchanged.
            </p>
          )}
          {preview.summary.spots.unchanged > 0 && (
            <p className="text-sm text-muted">
              {preview.summary.spots.unchanged} Spot
              {preview.summary.spots.unchanged === 1 ? "" : "s"} unchanged.
            </p>
          )}
          {preview.summary.comparisons.unchanged > 0 && (
            <p className="text-sm text-muted">
              {preview.summary.comparisons.unchanged} Comparison
              {preview.summary.comparisons.unchanged === 1 ? "" : "s"}{" "}
              unchanged.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
