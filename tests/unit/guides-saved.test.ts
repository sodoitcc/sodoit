import { describe, expect, it, vi } from "vitest";
import {
  isGuideSaved,
  loadSavedGuideIds,
  saveGuide,
  unsaveGuide,
} from "../../lib/guides/saved";

const VALID_GUIDE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_GUIDE_ID = "22222222-2222-4222-8222-222222222222";
const INVALID_GUIDE_ID = "not-a-uuid";

function fakeClient() {
  const calls: unknown[] = [];

  const from = vi.fn(() => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() => builder),
      upsert: vi.fn((...args: unknown[]) => {
        calls.push(["upsert", ...args]);
        return Promise.resolve({ error: null });
      }),
      delete: vi.fn(() => builder),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      then: undefined,
    };
    return builder;
  });

  return { from, calls } as unknown as {
    from: typeof from;
    calls: unknown[];
  };
}

describe("guide save helpers — invalid guide id handled safely", () => {
  it("isGuideSaved short-circuits without querying for an invalid guide id", async () => {
    const client = fakeClient();
    const result = await isGuideSaved(
      client as never,
      "user-1",
      INVALID_GUIDE_ID,
    );

    expect(result).toBe(false);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("saveGuide is a no-op for an invalid guide id", async () => {
    const client = fakeClient();
    await saveGuide(client as never, "user-1", INVALID_GUIDE_ID);

    expect(client.from).not.toHaveBeenCalled();
  });

  it("unsaveGuide is a no-op for an invalid guide id", async () => {
    const client = fakeClient();
    await unsaveGuide(client as never, "user-1", INVALID_GUIDE_ID);

    expect(client.from).not.toHaveBeenCalled();
  });

  it("loadSavedGuideIds filters out invalid ids before querying", async () => {
    const client = fakeClient();
    const result = await loadSavedGuideIds(client as never, "user-1", [
      INVALID_GUIDE_ID,
    ]);

    expect(result).toEqual(new Set());
    expect(client.from).not.toHaveBeenCalled();
  });

  it("loadSavedGuideIds still queries when at least one id is valid", async () => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      in: vi.fn(() =>
        Promise.resolve({
          data: [{ guide_id: VALID_GUIDE_ID }],
          error: null,
        }),
      ),
    };
    const from = vi.fn(() => builder);
    const client = { from } as unknown as Parameters<
      typeof loadSavedGuideIds
    >[0];

    const result = await loadSavedGuideIds(client, "user-1", [
      VALID_GUIDE_ID,
      OTHER_GUIDE_ID,
      INVALID_GUIDE_ID,
    ]);

    expect(from).toHaveBeenCalledWith("saved_guides");
    expect(builder.in).toHaveBeenCalledWith("guide_id", [
      VALID_GUIDE_ID,
      OTHER_GUIDE_ID,
    ]);
    expect(result).toEqual(new Set([VALID_GUIDE_ID]));
  });
});
