export type Visibility = "private" | "public";

export type CollectionProvenance =
  | {
      status: "public";
      sourceId: string;
      sourceSlug: string;
      sourceName: string;
      sourceUsername: string;
    }
  | { status: "hidden" };

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: Visibility;
  itemCount: number;
  coverImages?: string[];
  provenance?: CollectionProvenance | null;
}

export const COLLECTION_NAME_MAX_LENGTH = 60;
export const COLLECTION_DESCRIPTION_MAX_LENGTH = 280;
