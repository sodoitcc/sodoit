"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Profile options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-secondary transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-48 rounded-panel border border-border bg-surface p-1 shadow-popover"
        >
          <button
            type="button"
            role="menuitem"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-between rounded-control px-3 py-2 text-left text-sm font-medium text-muted"
          >
            Privacy
            <span className="text-[11px] text-muted">Soon</span>
          </button>

          <Link
            href="/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-control px-3 py-2 text-left text-sm font-medium text-secondary transition-colors hover:bg-surface-subtle hover:text-ink"
          >
            Account settings
          </Link>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            onClick={signOut}
            className="flex w-full items-center rounded-control px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
