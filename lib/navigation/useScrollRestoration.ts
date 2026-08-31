"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { consumeBackForwardNavigation } from "./back-forward";
import {
  readScrollSnapshot,
  scrollSnapshotKey,
  writeScrollSnapshot,
} from "./scroll-snapshot";

export function useScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = scrollSnapshotKey(pathname, searchParams.toString());
  const restoredRef = useRef(false);
  const lastScrollYRef = useRef(0);

  useLayoutEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    if (!consumeBackForwardNavigation()) return;

    const snapshot = readScrollSnapshot(key);
    if (!snapshot) return;

    window.scrollTo(0, snapshot.scrollY);
  }, [key]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    function onClick() {
      lastScrollYRef.current = window.scrollY;
    }

    window.addEventListener("click", onClick, { capture: true, passive: true });
    return () =>
      window.removeEventListener("click", onClick, { capture: true });
  }, []);

  useEffect(() => {
    function persist() {
      writeScrollSnapshot(key, { scrollY: lastScrollYRef.current });
    }

    window.addEventListener("pagehide", persist);

    return () => {
      persist();
      window.removeEventListener("pagehide", persist);
    };
  }, [key]);
}
