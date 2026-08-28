import Link from "next/link";
import { resolveProvenanceDisplay } from "./provenance-display";
import type { CollectionProvenance } from "./types";

export function CollectionProvenanceLine({
  provenance,
}: {
  provenance: CollectionProvenance | null | undefined;
}) {
  const display = resolveProvenanceDisplay(provenance);
  if (!display) return null;

  if (!display.href) {
    return <p className="mt-1.5 text-xs text-muted">{display.text}</p>;
  }

  return (
    <p className="mt-1.5 text-xs text-muted">
      <Link
        href={display.href}
        className="font-semibold text-secondary underline-offset-2 transition-colors hover:text-ink hover:underline"
      >
        {display.text}
      </Link>
    </p>
  );
}
