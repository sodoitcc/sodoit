"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { regenerateSingleExperienceImage } from "@/lib/admin/experiences/image-actions";

interface RegenerateImageButtonProps {
  experienceId: string;
}

export function RegenerateImageButton({
  experienceId,
}: RegenerateImageButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  function regenerate() {
    setFeedback(null);
    startTransition(async () => {
      const result = await regenerateSingleExperienceImage(experienceId);

      if (!result.success) {
        setFeedback({ type: "error", message: result.error });
        return;
      }

      setFeedback({ type: "success", message: "Image regenerated." });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={regenerate}
        disabled={isPending}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {isPending ? "Regenerating..." : "Regenerate image"}
      </Button>

      {feedback && (
        <p
          role={feedback.type === "error" ? "alert" : undefined}
          className={`text-xs ${feedback.type === "error" ? "text-danger" : "text-success"}`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
