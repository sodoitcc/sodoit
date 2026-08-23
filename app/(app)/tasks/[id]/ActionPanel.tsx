"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ListPlus } from "lucide-react";

import { Button, ShareButton } from "@/components/ui";
import { removeFromMyList, setListStatus } from "@/app/(app)/browse/actions";
import { loginHrefWithNext } from "@/lib/auth-redirect";
import type { ListStatus } from "@/app/(app)/browse/types";

interface ActionPanelProps {
  taskId: string;
  taskTitle: string;
  initialStatus: ListStatus | null;
  signedIn: boolean;
  totalCompleted: number;
}

export function ActionPanel({
  taskId,
  taskTitle,
  initialStatus,
  signedIn,
  totalCompleted,
}: ActionPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<ListStatus | null>(initialStatus);
  const [, startTransition] = useTransition();

  function apply(next: ListStatus | null) {
    setStatus(next);

    startTransition(() => {
      if (next) {
        setListStatus(taskId, next);
      } else {
        removeFromMyList(taskId);
      }
    });
  }

  function requireLogin() {
    router.push(loginHrefWithNext(pathname));
  }

  function toggleComplete() {
    if (!signedIn) {
      requireLogin();
      return;
    }

    apply(status === "completed" ? null : "completed");
  }

  function toggleSave() {
    if (!signedIn) {
      requireLogin();
      return;
    }

    if (status === "completed") return;

    apply(status === "saved" ? null : "saved");
  }

  const completed = status === "completed";
  const saved = status === "saved";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant={saved || completed ? "soft" : "primary"}
          onClick={toggleSave}
          disabled={completed}
        >
          <ListPlus aria-hidden="true" className="h-4 w-4" />
          {completed
            ? "In My List"
            : saved
              ? "Saved to Life List"
              : "Save to Life List"}
        </Button>

        <Button
          type="button"
          variant={completed ? "soft" : "outline"}
          onClick={toggleComplete}
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          {completed ? "Completed" : "Mark as complete"}
        </Button>

        <ShareButton url={`/tasks/${taskId}`} title={taskTitle} />
      </div>

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
