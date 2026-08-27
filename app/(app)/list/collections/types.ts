export type Visibility = "private" | "public";

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  visibility: Visibility;
  itemCount: number;
  coverImages?: string[];
}

export const COLLECTION_NAME_MAX_LENGTH = 60;
export const COLLECTION_DESCRIPTION_MAX_LENGTH = 280;
