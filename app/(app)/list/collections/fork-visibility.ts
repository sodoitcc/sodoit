import type { Visibility } from "./types";

export function canSaveCopyCollection(
  isOwner: boolean,
  visibility: Visibility,
): boolean {
  return !isOwner && visibility === "public";
}
