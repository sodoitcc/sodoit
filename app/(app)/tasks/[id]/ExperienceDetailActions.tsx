"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";

import { Button, ShareButton } from "@/components/ui";
import { removeFromMyList, setListStatus } from "@/app/(app)/browse/actions";
import { useCompletionToggle } from "@/app/(app)/browse/hooks/useCompletionToggle";
import { resolveExperienceCardActionState } from "@/app/(app)/browse/experience-card-state";
import { loginHrefWithNext } from "@/lib/auth-redirect";
import type { ListStatus } from "@/app/(app)/browse/types";
import type { ExperienceCardActionState } from "@/app/(app)/browse/experience-card-state";

export function resolveSaveLabel(state: ExperienceCardActionState): string {
  if (state === "completed") return "In My List";
  if (state === "saved") return "Saved to My List";
  return "Add to My List";
}

export function resolveCompleteLabel(completed: boolean): string {
  return completed ? "Completed" : "Mark as done";
}

export function canToggleSave(state: ExperienceCardActionState): boolean {
  return state !== "completed";
}

export function nextSaveStatus(
  state: ExperienceCardActionState,
): "saved" | null {
  return state === "saved" ? null : "saved";
}

interface ExperienceDetailActionsProps {
  taskId: string;
  taskTitle: string;
  initialStatus: ListStatus | null;
  signedIn: boolean;
  totalCompleted: number;
}

export function ExperienceDetailActions({
  taskId,
  taskTitle,
  initialStatus,
  signedIn,
  totalCompleted,
}: ExperienceDetailActionsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<ListStatus | null>(initialStatus);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saved = status === "saved";
  const completed = status === "completed";
  const actionState = resolveExperienceCardActionState(saved, completed);

  const { isToggling: isCompleting, handleToggle: toggleComplete } =
    useCompletionToggle(completed, async () => {
      setCompleteError(null);
      const previous = status;
      setStatus(completed ? null : "completed");

      try {
        if (completed) {
          await removeFromMyList(taskId);
        } else {
          await setListStatus(taskId, "completed");
        }
      } catch (error) {
        setStatus(previous);
        setCompleteError("Could not update this experience. Try again.");
        throw error;
      }
    });

  function requireLogin() {
    router.push(loginHrefWithNext(pathname));
  }

  async function handleSaveClick() {
    if (!signedIn) {
      requireLogin();
      return;
    }

    if (!canToggleSave(actionState)) return;
    if (isSaving) return;

    setSaveError(null);
    setIsSaving(true);
    const previous = status;
    const next = nextSaveStatus(actionState);
    setStatus(next);

    try {
      if (next) {
        await setListStatus(taskId, next);
      } else {
        await removeFromMyList(taskId);
      }
    } catch {
      setStatus(previous);
      setSaveError("Could not update My List. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCompleteClick() {
    if (!signedIn) {
      requireLogin();
      return;
    }

    toggleComplete();
  }

  const saveLabel = resolveSaveLabel(actionState);
  const completeLabel = resolveCompleteLabel(completed);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant={actionState === "unsaved" ? "outline" : "soft"}
          onClick={handleSaveClick}
          disabled={!canToggleSave(actionState) || isSaving}
          aria-pressed={actionState === "saved"}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {saveLabel}
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={handleCompleteClick}
          disabled={isCompleting}
          aria-pressed={completed}
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          {completeLabel}
        </Button>

        <ShareButton
          url={`/tasks/${taskId}`}
          title={taskTitle}
          variant="ghost"
        />
      </div>

      {(saveError || completeError) && (
        <p role="alert" className="mt-2.5 text-xs font-medium text-danger">
          {saveError || completeError}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-muted">
        {signedIn ? (
          <>
            You&apos;ve completed{" "}
            <span className="font-semibold text-ink">{totalCompleted}</span>{" "}
            experience{totalCompleted === 1 ? "" : "s"} so far.
          </>
        ) : (
          "Log in to save experiences and build your Life List."
        )}
      </p>
    </div>
  );
}
