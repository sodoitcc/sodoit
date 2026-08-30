import { describe, expect, it } from "vitest";
import {
  computeRotationBucket,
  selectFeaturedExperienceId,
  stableFeaturedOrder,
  FEATURED_ROTATION_BUCKET_SECONDS,
} from "../../app/(app)/browse/featured-rotation";

const BUCKET_MS = FEATURED_ROTATION_BUCKET_SECONDS * 1000;
const BASE_MS = 1_000 * BUCKET_MS;

describe("computeRotationBucket", () => {
  it("is stable within the same 2-hour window", () => {
    const a = computeRotationBucket(BASE_MS);
    const b = computeRotationBucket(BASE_MS + BUCKET_MS - 1);
    expect(a).toBe(b);
  });

  it("advances exactly one bucket at the boundary", () => {
    const before = computeRotationBucket(BASE_MS + BUCKET_MS - 1);
    const atBoundary = computeRotationBucket(BASE_MS + BUCKET_MS);
    expect(atBoundary).toBe(before + 1);
  });

  it("computes floor(unixSeconds / 7200) exactly", () => {
    expect(computeRotationBucket(7200 * 1000)).toBe(1);
    expect(computeRotationBucket(7200 * 1000 - 1)).toBe(0);
    expect(computeRotationBucket(0)).toBe(0);
  });
});

describe("stableFeaturedOrder", () => {
  it("is deterministic across repeated calls with the same input", () => {
    const ids = ["exp-a", "exp-b", "exp-c", "exp-d"];
    const first = stableFeaturedOrder(ids);
    const second = stableFeaturedOrder(ids);
    expect(second).toEqual(first);
  });

  it("does not depend on input order", () => {
    const ids = ["exp-a", "exp-b", "exp-c"];
    const shuffled = ["exp-c", "exp-a", "exp-b"];
    expect(stableFeaturedOrder(shuffled)).toEqual(stableFeaturedOrder(ids));
  });
});

describe("selectFeaturedExperienceId", () => {
  const ids = ["exp-a", "exp-b", "exp-c", "exp-d", "exp-e"];

  it("returns null for zero candidates", () => {
    expect(selectFeaturedExperienceId([], BASE_MS)).toBeNull();
  });

  it("always returns the single candidate, across many buckets", () => {
    for (let i = 0; i < 5; i++) {
      expect(
        selectFeaturedExperienceId(["only-one"], BASE_MS + i * BUCKET_MS),
      ).toBe("only-one");
    }
  });

  it("resolves the same result for any timestamp within the same bucket", () => {
    const t1 = selectFeaturedExperienceId(ids, BASE_MS);
    const t2 = selectFeaturedExperienceId(ids, BASE_MS + 1234);
    const t3 = selectFeaturedExperienceId(ids, BASE_MS + BUCKET_MS - 1);
    expect(t2).toBe(t1);
    expect(t3).toBe(t1);
  });

  it("advances to the next stable-order candidate on the next bucket", () => {
    const ordered = stableFeaturedOrder(ids);
    const bucket = computeRotationBucket(BASE_MS);

    const current = selectFeaturedExperienceId(ids, BASE_MS);
    const next = selectFeaturedExperienceId(ids, BASE_MS + BUCKET_MS);

    expect(current).toBe(ordered[bucket % ordered.length]);
    expect(next).toBe(ordered[(bucket + 1) % ordered.length]);
    expect(next).not.toBe(current);
  });

  it("wraps around cleanly once the bucket exceeds the pool size", () => {
    const bucket = computeRotationBucket(BASE_MS);
    const wrapMs = BASE_MS + ids.length * BUCKET_MS;
    expect(computeRotationBucket(wrapMs)).toBe(bucket + ids.length);

    expect(selectFeaturedExperienceId(ids, wrapMs)).toBe(
      selectFeaturedExperienceId(ids, BASE_MS),
    );
  });

  it("produces no randomness between repeated calls with identical arguments", () => {
    const results = Array.from({ length: 10 }, () =>
      selectFeaturedExperienceId(ids, BASE_MS),
    );
    expect(new Set(results).size).toBe(1);
  });
});
