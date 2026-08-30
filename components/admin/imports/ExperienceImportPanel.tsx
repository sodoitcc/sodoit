"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { GenerateImagesButton } from "@/components/admin/experiences/GenerateImagesButton";
import type {
  ExperienceImportChange,
  ExperienceImportPreview,
  ExperienceImportPreviewRow,
} from "@/lib/admin/experiences/import";
import type { ApplyConflict } from "@/lib/admin/experiences/apply";

type PreviewResponse =
  { ok: true; preview: ExperienceImportPreview } | { ok: false; error: string };

type ApplyResponse =
  | {
      ok: true;
      created: { id: string; title: string }[];
      updated: { id: string; title: string }[];
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
      conflicts: ApplyConflict[];
    };

type ApplyState =
  | { status: "idle" }
  | { status: "pending" }
  | {
      status: "success";
      created: { id: string; title: string }[];
      updated: { id: string; title: string }[];
    }
  | { status: "stale"; conflicts: ApplyConflict[] }
  | { status: "error"; message: string };

const STATUS_BADGE: Record<
  ExperienceImportPreviewRow["status"],
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
  return String(value);
}

export function ExperienceImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExperienceImportPreview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applyState, setApplyState] = useState<ApplyState>({
    status: "idle",
  });

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
      const response = await fetch("/admin/imports/experiences/preview", {
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

    const fingerprints = Object.fromEntries(
      preview.rows
        .filter((row) => row.status === "update")
        .map((row) => [row.id, row.baseFingerprint]),
    );

    const formData = new FormData();
    formData.set("file", file);
    formData.set("fingerprints", JSON.stringify(fingerprints));

    try {
      const response = await fetch("/admin/imports/experiences/apply", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as ApplyResponse;

      if (result.ok) {
        setApplyState({
          status: "success",
          created: result.created,
          updated: result.updated,
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

  const errorRows = preview?.rows.filter((row) => row.status === "error") ?? [];
  const createRows =
    preview?.rows.filter((row) => row.status === "create") ?? [];
  const updateRows =
    preview?.rows.filter((row) => row.status === "update") ?? [];
  const unchangedCount = preview?.summary.unchanged ?? 0;

  const canApply =
    Boolean(preview) &&
    preview!.summary.error === 0 &&
    preview!.summary.create + preview!.summary.update > 0;

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
            Some Experiences changed since this preview was created. Choose the
            file again to generate a fresh preview.
          </p>
          {applyState.conflicts.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-[13px] text-danger">
              {applyState.conflicts.map((conflict) => (
                <li key={conflict.id}>
                  {conflict.title || conflict.id}
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
          <div className="mt-2 flex gap-4 text-sm text-success">
            <span>Created {applyState.created.length}</span>
            <span>Updated {applyState.updated.length}</span>
          </div>
          {(applyState.created.length > 0 || applyState.updated.length > 0) && (
            <ul className="mt-2 list-inside list-disc text-[13px] text-success">
              {[...applyState.created, ...applyState.updated]
                .slice(0, 8)
                .map((row) => (
                  <li key={row.id}>{row.title}</li>
                ))}
            </ul>
          )}
          <div className="mt-3 flex items-center gap-3">
            <a
              href="/admin/imports/experiences/export"
              className="text-sm font-medium text-secondary hover:text-ink"
            >
              Export current data again
            </a>
          </div>

          {applyState.created.length > 0 && (
            <div className="mt-3">
              <GenerateImagesButton
                mode="ids"
                ids={applyState.created
                  .map((row) => row.id)
                  .filter((id) => id.length > 0)}
                initialCount={applyState.created.length}
                label={`Generate images for ${applyState.created.length} new experience${
                  applyState.created.length === 1 ? "" : "s"
                }`}
              />
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold text-ink">
              {preview.summary.total} rows analyzed
            </p>
            <p className="mt-1 text-sm text-muted">
              No changes have been applied yet.
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-pill bg-success-light px-2.5 py-1 text-success">
                {preview.summary.create} create
              </span>
              <span className="rounded-pill bg-accent-wash px-2.5 py-1 text-accent-dark">
                {preview.summary.update} update
              </span>
              <span className="rounded-pill bg-surface-subtle px-2.5 py-1 text-muted">
                {preview.summary.unchanged} unchanged
              </span>
              <span className="rounded-pill bg-danger-light px-2.5 py-1 text-danger">
                {preview.summary.error} errors
              </span>
            </div>

            {canApply && !confirmOpen && (
              <Button
                type="button"
                className="mt-4"
                onClick={() => setConfirmOpen(true)}
              >
                Apply changes
              </Button>
            )}

            {canApply && confirmOpen && (
              <div className="mt-4 rounded-control border border-border bg-surface-subtle p-3.5">
                <p className="text-sm font-semibold text-ink">
                  Apply {preview.summary.create + preview.summary.update}{" "}
                  changes?
                </p>
                <p className="mt-1 text-[13px] text-secondary">
                  {preview.summary.create} Experiences will be created.{" "}
                  {preview.summary.update} Experiences will be updated.
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
          </div>

          {errorRows.length > 0 && (
            <PreviewSection title={`Errors (${errorRows.length})`}>
              {errorRows.map((row) => (
                <div
                  key={row.rowNumber}
                  className="rounded-control border border-border bg-surface p-3"
                >
                  <div className="flex items-center gap-2">
                    <StatusBadge status="error" />
                    <span className="text-xs text-muted">
                      Row {row.rowNumber}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-ink">
                    {row.status === "error"
                      ? row.title || row.slug || "Untitled row"
                      : ""}
                  </p>
                  <ul className="mt-1 list-inside list-disc text-sm text-danger">
                    {row.status === "error" &&
                      row.errors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                  </ul>
                </div>
              ))}
            </PreviewSection>
          )}

          {updateRows.length > 0 && (
            <PreviewSection title={`Updates (${updateRows.length})`}>
              {updateRows.map((row) =>
                row.status === "update" ? (
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
                ) : null,
              )}
            </PreviewSection>
          )}

          {createRows.length > 0 && (
            <PreviewSection title={`Creates (${createRows.length})`}>
              {createRows.map((row) =>
                row.status === "create" ? (
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
                      {row.candidate.slug} · {row.candidate.category || "—"}
                      {row.candidate.difficulty
                        ? ` · ${row.candidate.difficulty}`
                        : ""}{" "}
                      · {row.candidate.is_public ? "Published" : "Hidden"}
                    </p>
                  </div>
                ) : null,
              )}
            </PreviewSection>
          )}

          {unchangedCount > 0 && (
            <p className="text-sm text-muted">
              {unchangedCount} row{unchangedCount === 1 ? "" : "s"} unchanged.
            </p>
          )}
        </div>
      )}
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

function StatusBadge({
  status,
}: {
  status: ExperienceImportPreviewRow["status"];
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

function ChangeLine({ change }: { change: ExperienceImportChange }) {
  return (
    <div className="text-xs text-secondary">
      <span className="font-semibold text-ink">{change.field}</span>{" "}
      <span className="text-muted">{formatValue(change.before)}</span>
      {" → "}
      <span className="text-ink">{formatValue(change.after)}</span>
    </div>
  );
}
