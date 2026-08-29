import { describe, expect, it } from "vitest";
import { registerSecurityFixture } from "./fixture";
import {
  getTagAdmin,
  isTagSlugTaken,
  listTagsAdmin,
} from "@/lib/admin/tags/queries";

const getFixture = registerSecurityFixture();

describe("admin tag data layer", () => {
  it("loads the seeded controlled vocabulary", async () => {
    const tags = await listTagsAdmin();
    expect(tags.length).toBeGreaterThanOrEqual(20);
  });

  it("reports zero experience_count for an unused tag, and increments correctly", async () => {
    const fixture = getFixture();
    const slug = `admin-tag-count-${fixture.runId}`;

    const created = await fixture.admin
      .from("experience_tags")
      .insert({ slug, name: "Admin Tag Count Test" })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const tagId = created.data!.id as string;

    try {
      const before = await listTagsAdmin();
      const beforeRow = before.find((t) => t.id === tagId);
      expect(beforeRow?.experience_count).toBe(0);

      await fixture.admin.from("experience_tag_assignments").insert({
        experience_id: fixture.experienceIds.main,
        tag_id: tagId,
      });

      const after = await listTagsAdmin();
      const afterRow = after.find((t) => t.id === tagId);
      expect(afterRow?.experience_count).toBe(1);
    } finally {
      await fixture.admin
        .from("experience_tag_assignments")
        .delete()
        .eq("tag_id", tagId);
      await fixture.admin.from("experience_tags").delete().eq("id", tagId);
    }
  });

  it("returns null from getTagAdmin for a nonexistent id", async () => {
    const result = await getTagAdmin("00000000-0000-4000-8000-000000000000");
    expect(result).toBeNull();
  });

  it("isTagSlugTaken is true for an existing seeded slug and false for a free one", async () => {
    const fixture = getFixture();
    const taken = await isTagSlugTaken("iconic");
    expect(taken).toBe(true);

    const free = await isTagSlugTaken(`free-tag-slug-${fixture.runId}`);
    expect(free).toBe(false);
  });

  it("isTagSlugTaken excludes the given id, for editing in place", async () => {
    const fixture = getFixture();
    const slug = `exclude-self-tag-${fixture.runId}`;

    const created = await fixture.admin
      .from("experience_tags")
      .insert({ slug, name: "Exclude Self Tag" })
      .select("id")
      .single();
    const tagId = created.data!.id as string;

    try {
      const withoutExclude = await isTagSlugTaken(slug);
      expect(withoutExclude).toBe(true);

      const withExclude = await isTagSlugTaken(slug, tagId);
      expect(withExclude).toBe(false);
    } finally {
      await fixture.admin.from("experience_tags").delete().eq("id", tagId);
    }
  });

  it("deactivating a tag keeps existing assignments intact", async () => {
    const fixture = getFixture();
    const slug = `deactivate-tag-${fixture.runId}`;

    const created = await fixture.admin
      .from("experience_tags")
      .insert({ slug, name: "Deactivate Tag Test", is_active: true })
      .select("id")
      .single();
    const tagId = created.data!.id as string;

    try {
      await fixture.admin.from("experience_tag_assignments").insert({
        experience_id: fixture.experienceIds.main,
        tag_id: tagId,
      });

      await fixture.admin
        .from("experience_tags")
        .update({ is_active: false })
        .eq("id", tagId);

      const assignment = await fixture.admin
        .from("experience_tag_assignments")
        .select("tag_id")
        .eq("experience_id", fixture.experienceIds.main)
        .eq("tag_id", tagId)
        .maybeSingle();
      expect(assignment.data?.tag_id).toBe(tagId);
    } finally {
      await fixture.admin
        .from("experience_tag_assignments")
        .delete()
        .eq("tag_id", tagId);
      await fixture.admin.from("experience_tags").delete().eq("id", tagId);
    }
  });

  it("lets an admin-role user manage tags through the same client path", async () => {
    const fixture = getFixture();

    const promote = await fixture.admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", fixture.aId);
    expect(promote.error).toBeNull();

    try {
      const slug = `admin-created-tag-${fixture.runId}`;
      const created = await fixture.userA
        .from("experience_tags")
        .insert({ slug, name: "Admin Created Tag" })
        .select("id")
        .single();
      expect(created.error).toBeNull();

      const cleanup = await fixture.userA
        .from("experience_tags")
        .delete()
        .eq("slug", slug);
      expect(cleanup.error).toBeNull();
    } finally {
      await fixture.admin
        .from("profiles")
        .update({ role: "user" })
        .eq("id", fixture.aId);
    }
  });
});
