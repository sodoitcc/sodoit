import { hashString } from "./types";

export const FEATURED_ROTATION_SEED = "browse-featured-v1";
export const FEATURED_ROTATION_BUCKET_SECONDS = 7200;

export function computeRotationBucket(
  nowMs: number,
  bucketSeconds: number = FEATURED_ROTATION_BUCKET_SECONDS,
): number {
  return Math.floor(nowMs / 1000 / bucketSeconds);
}

export function stableFeaturedOrder(
  ids: readonly string[],
  seed: string = FEATURED_ROTATION_SEED,
): string[] {
  return [...ids].sort((a, b) => {
    const diff = hashString(`${seed}:${a}`) - hashString(`${seed}:${b}`);
    return diff !== 0 ? diff : a.localeCompare(b);
  });
}

export function selectFeaturedExperienceId(
  eligibleIds: readonly string[],
  nowMs: number,
): string | null {
  if (eligibleIds.length === 0) return null;

  const ordered = stableFeaturedOrder(eligibleIds);
  const bucket = computeRotationBucket(nowMs);
  const index = bucket % ordered.length;

  return ordered[index];
}
