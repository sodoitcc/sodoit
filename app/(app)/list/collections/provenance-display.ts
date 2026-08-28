import type { CollectionProvenance } from "./types";

export interface ProvenanceDisplay {
  text: string;
  href: string | null;
}

export function resolveProvenanceDisplay(
  provenance: CollectionProvenance | null | undefined,
): ProvenanceDisplay | null {
  if (!provenance) return null;

  if (provenance.status === "hidden") {
    return { text: "Based on another Sodoit collection", href: null };
  }

  return {
    text: `Based on @${provenance.sourceUsername}'s collection`,
    href: `/u/${provenance.sourceUsername}/collections/${provenance.sourceSlug}`,
  };
}
