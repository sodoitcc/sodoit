"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "./Button";

interface ShareButtonProps {
  url: string;
  title: string;
  label?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ShareButton({
  url,
  title,
  label = "Share",
  variant = "outline",
  size = "md",
  className,
}: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  async function share() {
    const absoluteUrl =
      typeof window !== "undefined"
        ? new URL(url, window.location.origin).toString()
        : url;

    if (typeof navigator !== "undefined" && navigator.share) {
      const didShare = await navigator.share({ title, url: absoluteUrl }).then(
        () => true,
        () => false,
      );

      if (didShare) return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(absoluteUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={share}
        className={className}
      >
        <Share2 aria-hidden="true" className="h-4 w-4" />
        {shared ? "Link copied" : label}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {shared ? "Link copied to clipboard" : ""}
      </span>
    </>
  );
}
