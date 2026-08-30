import { describe, expect, it } from "vitest";
import { registerSecurityFixture } from "./fixture";

const getFixture = registerSecurityFixture();

describe("saved/completed list-status consistency", () => {
  it("a saved row transitions to completed in place, no duplicate row, correct loader partitioning throughout", async () => {
    const fixture = getFixture();
    const experienceId = fixture.experienceIds.ownList;

    const inserted = await fixture.userA
      .from("user_lists")
      .insert({
        user_id: fixture.aId,
        experience_id: experienceId,
        status: "saved",
      })
      .select("id")
      .single();
    expect(inserted.error).toBeNull();
    const rowId = inserted.data!.id as string;

    try {
      const afterSave = await fixture.userA
        .from("user_lists")
        .select("status")
        .eq("user_id", fixture.aId)
        .eq("experience_id", experienceId);
      expect(afterSave.data).toHaveLength(1);
      expect(afterSave.data?.[0].status).toBe("saved");

      const updated = await fixture.userA
        .from("user_lists")
        .update({ status: "completed" })
        .eq("id", rowId)
        .select("id, status")
        .single();
      expect(updated.error).toBeNull();
      expect(updated.data?.status).toBe("completed");
      expect(updated.data?.id).toBe(rowId);

      const afterComplete = await fixture.userA
        .from("user_lists")
        .select("id, status")
        .eq("user_id", fixture.aId)
        .eq("experience_id", experienceId);
      expect(afterComplete.data).toHaveLength(1);
      expect(afterComplete.data?.[0].status).toBe("completed");
      expect(afterComplete.data?.[0].id).toBe(rowId);
    } finally {
      await fixture.admin.from("user_lists").delete().eq("id", rowId);
    }
  });

  it("saved -> completed -> saved round trip updates the same row and loader-shaped counts throughout", async () => {
    const fixture = getFixture();
    const experienceId = fixture.experienceIds.ownList;

    async function countByStatus(status: "saved" | "completed") {
      const result = await fixture.userA
        .from("user_lists")
        .select("id", { count: "exact", head: true })
        .eq("user_id", fixture.aId)
        .eq("status", status);
      return result.count ?? 0;
    }

    const savedBefore = await countByStatus("saved");
    const completedBefore = await countByStatus("completed");

    const inserted = await fixture.userA
      .from("user_lists")
      .insert({
        user_id: fixture.aId,
        experience_id: experienceId,
        status: "saved",
      })
      .select("id")
      .single();
    expect(inserted.error).toBeNull();
    const rowId = inserted.data!.id as string;

    try {
      expect(await countByStatus("saved")).toBe(savedBefore + 1);
      expect(await countByStatus("completed")).toBe(completedBefore);

      const completed = await fixture.userA
        .from("user_lists")
        .update({ status: "completed" })
        .eq("id", rowId)
        .select("id")
        .single();
      expect(completed.error).toBeNull();
      expect(completed.data?.id).toBe(rowId);

      expect(await countByStatus("saved")).toBe(savedBefore);
      expect(await countByStatus("completed")).toBe(completedBefore + 1);

      const recentCompleted = await fixture.userA
        .from("user_lists")
        .select("experience_id")
        .eq("user_id", fixture.aId)
        .eq("status", "completed");
      expect(
        recentCompleted.data?.some((row) => row.experience_id === experienceId),
      ).toBe(true);

      const revertedToSaved = await fixture.userA
        .from("user_lists")
        .update({ status: "saved" })
        .eq("id", rowId)
        .select("id, status")
        .single();
      expect(revertedToSaved.error).toBeNull();
      expect(revertedToSaved.data?.id).toBe(rowId);
      expect(revertedToSaved.data?.status).toBe("saved");

      expect(await countByStatus("saved")).toBe(savedBefore + 1);
      expect(await countByStatus("completed")).toBe(completedBefore);

      const recentCompletedAfterRevert = await fixture.userA
        .from("user_lists")
        .select("experience_id")
        .eq("user_id", fixture.aId)
        .eq("status", "completed");
      expect(
        recentCompletedAfterRevert.data?.some(
          (row) => row.experience_id === experienceId,
        ),
      ).toBe(false);

      const allRowsForExperience = await fixture.admin
        .from("user_lists")
        .select("id")
        .eq("user_id", fixture.aId)
        .eq("experience_id", experienceId);
      expect(allRowsForExperience.data).toHaveLength(1);
    } finally {
      await fixture.admin.from("user_lists").delete().eq("id", rowId);
    }
  });

  it("does not allow a duplicate (user_id, experience_id) row on repeated save", async () => {
    const fixture = getFixture();
    const experienceId = fixture.experienceIds.ownList;

    const first = await fixture.userA
      .from("user_lists")
      .insert({
        user_id: fixture.aId,
        experience_id: experienceId,
        status: "saved",
      })
      .select("id")
      .single();
    expect(first.error).toBeNull();
    const rowId = first.data!.id as string;

    try {
      const duplicate = await fixture.userA.from("user_lists").insert({
        user_id: fixture.aId,
        experience_id: experienceId,
        status: "saved",
      });
      expect(duplicate.error).not.toBeNull();

      const rows = await fixture.admin
        .from("user_lists")
        .select("id")
        .eq("user_id", fixture.aId)
        .eq("experience_id", experienceId);
      expect(rows.data).toHaveLength(1);
    } finally {
      await fixture.admin.from("user_lists").delete().eq("id", rowId);
    }
  });
});
