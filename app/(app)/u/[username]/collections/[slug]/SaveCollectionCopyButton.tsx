"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";

import { loginHrefWithNext } from "@/lib/auth-redirect";
import type { ForkCollectionResult } from "@/app/(app)/list/collections/actions";
import { SaveCollectionCopyDialog } from "./SaveCollectionCopyDialog";

const BUTTON_CLASS =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-control border border-border bg-surface px-3 text-xs font-semibold text-secondary transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

interface SaveCollectionCopyButtonProps {
  signedIn: boolean;
  sourceCollectionId: string;
  sourceName: string;
  currentPath: string;
}

export function SaveCollectionCopyButton({
  signedIn,
  sourceCollectionId,
  sourceName,
  currentPath,
}: SaveCollectionCopyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!signedIn) {
    return (
      <Link
        href={loginHrefWithNext(currentPath)}
        role="button"
        className={BUTTON_CLASS}
      >
        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        Save a copy
      </Link>
    );
  }

  function handleSaved(result: ForkCollectionResult) {
    setOpen(false);
    router.push(`/u/${result.username}/collections/${result.slug}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={BUTTON_CLASS}
      >
        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        Save a copy
      </button>

      {open && (
        <SaveCollectionCopyDialog
          sourceCollectionId={sourceCollectionId}
          sourceName={sourceName}
          onClose={() => setOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
