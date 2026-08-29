"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { resolveCollectionBackTarget } from "./back-navigation";

const LINK_CLASS =
  "inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

function noSubscription() {
  return () => {};
}

function getHasHistory() {
  return window.history.length > 1;
}

function getServerHasHistory() {
  return false;
}

export function CollectionBackLink({ isOwner }: { isOwner: boolean }) {
  const router = useRouter();
  const hasHistory = useSyncExternalStore(
    noSubscription,
    getHasHistory,
    getServerHasHistory,
  );

  const target = resolveCollectionBackTarget(isOwner, hasHistory);

  if (target.useHistoryBack) {
    return (
      <button
        type="button"
        onClick={() => router.back()}
        className={LINK_CLASS}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        {target.label}
      </button>
    );
  }

  return (
    <Link href={target.href} className={LINK_CLASS}>
      <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      {target.label}
    </Link>
  );
}
