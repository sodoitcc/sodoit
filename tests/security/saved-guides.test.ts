import { describe, expect, it } from "vitest";
import { adminRow } from "./setup";
import { registerSecurityFixture } from "./fixture";

const getFixture = registerSecurityFixture();

describe("saved guides security", () => {
  it("lets User A save, read, and unsave their own guide", async () => {
    const fixture = getFixture();
    const guideId = fixture.guideIds.public;

    const inserted = await fixture.userA
      .from("saved_guides")
      .insert({ user_id: fixture.aId, guide_id: guideId })
      .select("guide_id")
      .single();

    expect(inserted.error).toBeNull();
    expect(inserted.data?.guide_id).toBe(guideId);

    const read = await fixture.userA
      .from("saved_guides")
      .select("guide_id")
      .eq("guide_id", guideId)
      .single();

    expect(read.error).toBeNull();
    expect(read.data?.guide_id).toBe(guideId);

    const removed = await fixture.userA
      .from("saved_guides")
      .delete()
      .eq("user_id", fixture.aId)
      .eq("guide_id", guideId);

    expect(removed.error).toBeNull();

    expect(
      await adminRow(fixture, "saved_guides", "guide_id", guideId),
    ).toBeNull();
  });

  it("treats a duplicate save as idempotent via upsert", async () => {
    const fixture = getFixture();
    const guideId = fixture.guideIds.public;

    const first = await fixture.userA
      .from("saved_guides")
      .upsert(
        { user_id: fixture.aId, guide_id: guideId },
        { onConflict: "user_id,guide_id", ignoreDuplicates: true },
      );
    expect(first.error).toBeNull();

    const second = await fixture.userA
      .from("saved_guides")
      .upsert(
        { user_id: fixture.aId, guide_id: guideId },
        { onConflict: "user_id,guide_id", ignoreDuplicates: true },
      );
    expect(second.error).toBeNull();

    const rows = await fixture.userA
      .from("saved_guides")
      .select("guide_id")
      .eq("guide_id", guideId);

    expect(rows.error).toBeNull();
    expect(rows.data).toEqual([{ guide_id: guideId }]);

    await fixture.userA
      .from("saved_guides")
      .delete()
      .eq("user_id", fixture.aId)
      .eq("guide_id", guideId);
  });

  it("blocks User A from reading or deleting User B's saved guide", async () => {
    const fixture = getFixture();
    const guideId = fixture.guideIds.public;

    const bSaved = await fixture.admin
      .from("saved_guides")
      .insert({ user_id: fixture.bId, guide_id: guideId });
    expect(bSaved.error).toBeNull();

    const read = await fixture.userA
      .from("saved_guides")
      .select("guide_id")
      .eq("user_id", fixture.bId)
      .eq("guide_id", guideId);

    expect(read.error).toBeNull();
    expect(read.data).toEqual([]);

    const deleted = await fixture.userA
      .from("saved_guides")
      .delete()
      .eq("user_id", fixture.bId)
      .eq("guide_id", guideId);

    expect(deleted.error).toBeNull();

    const stillThere = await adminRow(
      fixture,
      "saved_guides",
      "guide_id",
      guideId,
    );
    expect(stillThere?.user_id).toBe(fixture.bId);

    await fixture.admin
      .from("saved_guides")
      .delete()
      .eq("user_id", fixture.bId)
      .eq("guide_id", guideId);
  });

  it("blocks User A from forging a saved guide row for User B", async () => {
    const fixture = getFixture();
    const guideId = fixture.guideIds.public;

    const forged = await fixture.userA
      .from("saved_guides")
      .insert({ user_id: fixture.bId, guide_id: guideId });

    expect(forged.error).not.toBeNull();

    expect(
      await adminRow(fixture, "saved_guides", "guide_id", guideId),
    ).toBeNull();
  });

  it("rejects saving a guide id that does not exist", async () => {
    const fixture = getFixture();
    const bogusGuideId = crypto.randomUUID();

    const result = await fixture.userA
      .from("saved_guides")
      .insert({ user_id: fixture.aId, guide_id: bogusGuideId });

    expect(result.error).not.toBeNull();

    expect(
      await adminRow(fixture, "saved_guides", "guide_id", bogusGuideId),
    ).toBeNull();
  });
});
