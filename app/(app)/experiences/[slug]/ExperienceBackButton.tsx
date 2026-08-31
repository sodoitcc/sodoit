"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function ExperienceBackButton() {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={[
        "inline-flex items-center gap-1 rounded-control text-sm font-semibold text-muted",
        "transition-colors hover:text-ink",
        "outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
      ].join(" ")}
    >
      <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      Back
    </button>
  );
}
