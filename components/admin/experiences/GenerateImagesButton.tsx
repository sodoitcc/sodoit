"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import {
  generateExperienceImagesForIds,
  generateMissingExperienceImagesChunk,
  type ImageEnrichmentSummary,
} from "@/lib/admin/experiences/image-actions";

interface GenerateImagesButtonProps {
  mode: "missing" | "ids";
  ids?: string[];
  initialCount: number;
  label?: string;
}

interface AccumulatedProgress {
  processed: number;
  updated: number;
  failed: number;
}

type JobState =
  | { status: "idle" }
  | { status: "running"; progress: AccumulatedProgress }
  | { status: "done"; progress: AccumulatedProgress }
  | { status: "error"; message: string };

function mergeSummary(
  progress: AccumulatedProgress,
  summary: ImageEnrichmentSummary,
): AccumulatedProgress {
  return {
    processed: progress.processed + summary.attempted,
    updated: progress.updated + summary.updated,
    failed: progress.failed + summary.failed,
  };
}

export function GenerateImagesButton({
  mode,
  ids,
  initialCount,
  label,
}: GenerateImagesButtonProps) {
  const [state, setState] = useState<JobState>({ status: "idle" });

  if (initialCount === 0) return null;

  async function runMissingMode() {
    let progress: AccumulatedProgress = { processed: 0, updated: 0, failed: 0 };
    setState({ status: "running", progress });

    for (;;) {
      const result = await generateMissingExperienceImagesChunk({});
      if (!result.success) {
        setState({ status: "error", message: result.error });
        return;
      }

      progress = mergeSummary(progress, result.summary);
      setState({ status: "running", progress });

      if (result.done || result.summary.stoppedReason) break;
    }

    setState({ status: "done", progress });
  }

  async function runIdsMode(targetIds: string[]) {
    let progress: AccumulatedProgress = { processed: 0, updated: 0, failed: 0 };
    setState({ status: "running", progress });

    let cursor = 0;
    for (;;) {
      const result = await generateExperienceImagesForIds({
        ids: targetIds,
        cursor,
      });
      if (!result.success) {
        setState({ status: "error", message: result.error });
        return;
      }

      progress = mergeSummary(progress, result.summary);
      cursor = result.nextCursor;
      setState({ status: "running", progress });

      if (result.done || result.summary.stoppedReason) break;
    }

    setState({ status: "done", progress });
  }

  function start() {
    if (state.status === "running") return;
    if (mode === "missing") {
      runMissingMode();
    } else if (ids) {
      runIdsMode(ids);
    }
  }

  const buttonLabel =
    label ??
    (mode === "missing" ? "Generate missing images" : "Generate images");

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={start}
        disabled={state.status === "running"}
      >
        {state.status === "running"
          ? `Generating... (${state.progress.processed}/${initialCount})`
          : `${buttonLabel} (${initialCount})`}
      </Button>

      {state.status === "done" && (
        <p className="text-[13px] text-secondary">
          Generated {state.progress.updated} of {state.progress.processed}{" "}
          processed
          {state.progress.failed > 0 ? `, ${state.progress.failed} failed` : ""}
          .
        </p>
      )}

      {state.status === "error" && (
        <p role="alert" className="text-[13px] text-danger">
          {state.message}
        </p>
      )}
    </div>
  );
}
