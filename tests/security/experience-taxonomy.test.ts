import { afterEach, describe, expect, it } from "vitest";
import { adminRow } from "./setup";
import { registerSecurityFixture } from "./fixture";

const getFixture = registerSecurityFixture();

const SEEDED_CATEGORIES = [
  { slug: "places", name: "Places", sort_order: 1 },
  { slug: "adventure", name: "Adventure", sort_order: 2 },
  { slug: "fun-entertainment", name: "Fun & Entertainment", sort_order: 3 },
  { slug: "food-drink", name: "Food & Drink", sort_order: 4 },
  { slug: "nature-outdoors", name: "Nature & Outdoors", sort_order: 5 },
  { slug: "learn-create", name: "Learn & Create", sort_order: 6 },
  { slug: "wellness-active", name: "Wellness & Active", sort_order: 7 },
];

describe("experience taxonomy — categories", () => {
  it("seeded category slugs/order are correct", async () => {
    const fixture = getFixture();

    const result = await fixture.anon
      .from("experience_categories")
      .select("slug, name, sort_order")
      .order("sort_order", { ascending: true });

    expect(result.error).toBeNull();
    expect(result.data).toEqual(SEEDED_CATEGORIES);
  });

  it("rejects a duplicate category slug", async () => {
    const fixture = getFixture();

    const result = await fixture.admin
      .from("experience_categories")
      .insert({ slug: "places", name: "Duplicate Places", sort_order: 99 });

    expect(result.error).not.toBeNull();
  });

  it("public (anon) can read active taxonomy metadata", async () => {
    const fixture = getFixture();

    const categories = await fixture.anon
      .from("experience_categories")
      .select("id")
      .eq("is_active", true);
    expect(categories.error).toBeNull();
    expect(categories.data?.length).toBeGreaterThan(0);
  });

  it("blocks a non-admin from inserting a category", async () => {
    const fixture = getFixture();

    const result = await fixture.userA
      .from("experience_categories")
      .insert({
        slug: `non-admin-${fixture.runId}`,
        name: "Nope",
        sort_order: 100,
      })
      .select("id");

    if (!result.error) {
      expect(result.data).toEqual([]);
    }

    const leaked = await fixture.admin
      .from("experience_categories")
      .select("id")
      .eq("slug", `non-admin-${fixture.runId}`);
    expect(leaked.data).toEqual([]);
  });

  it("blocks a non-admin from deleting a category", async () => {
    const fixture = getFixture();

    const placesRow = await adminRow(
      fixture,
      "experience_categories",
      "slug",
      "places",
    );
    expect(placesRow).not.toBeNull();

    await fixture.userB
      .from("experience_categories")
      .delete()
      .eq("slug", "places");

    const stillThere = await adminRow(
      fixture,
      "experience_categories",
      "slug",
      "places",
    );
    expect(stillThere).not.toBeNull();
  });

  it("blocks deleting a category currently referenced by an Experience", async () => {
    const fixture = getFixture();

    const category = await adminRow(
      fixture,
      "experience_categories",
      "slug",
      "adventure",
    );
    expect(category).not.toBeNull();
    const categoryId = category!.id as string;

    const assigned = await fixture.admin
      .from("experiences")
      .update({ primary_category_id: categoryId })
      .eq("id", fixture.experienceIds.main);
    expect(assigned.error).toBeNull();

    const deleteAttempt = await fixture.admin
      .from("experience_categories")
      .delete()
      .eq("id", categoryId);

    expect(deleteAttempt.error).not.toBeNull();

    const stillThere = await adminRow(
      fixture,
      "experience_categories",
      "id",
      categoryId,
    );
    expect(stillThere).not.toBeNull();
  });

  it("allows an Experience to reference a valid primary category", async () => {
    const fixture = getFixture();

    const category = await adminRow(
      fixture,
      "experience_categories",
      "slug",
      "food-drink",
    );
    const categoryId = category!.id as string;

    const result = await fixture.admin
      .from("experiences")
      .update({ primary_category_id: categoryId })
      .eq("id", fixture.experienceIds.main);
    expect(result.error).toBeNull();

    const row = await adminRow(
      fixture,
      "experiences",
      "id",
      fixture.experienceIds.main,
    );
    expect(row?.primary_category_id).toBe(categoryId);
  });

  it("lets an admin-role user manage categories through the same client path", async () => {
    const fixture = getFixture();

    const promote = await fixture.admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", fixture.aId);
    expect(promote.error).toBeNull();

    try {
      const slug = `admin-created-${fixture.runId}`;
      const created = await fixture.userA
        .from("experience_categories")
        .insert({ slug, name: "Admin Created", sort_order: 101 })
        .select("id")
        .single();
      expect(created.error).toBeNull();

      const cleanup = await fixture.userA
        .from("experience_categories")
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

describe("experience taxonomy — experience_type / location_scope", () => {
  afterEach(async () => {
    const fixture = getFixture();
    await fixture.admin
      .from("experiences")
      .update({ experience_type: null, location_scope: null })
      .eq("id", fixture.experienceIds.main);
  });

  it("accepts every valid experience_type value", async () => {
    const fixture = getFixture();

    for (const value of [
      "place",
      "activity",
      "event",
      "skill",
      "challenge",
    ] as const) {
      const result = await fixture.admin
        .from("experiences")
        .update({ experience_type: value })
        .eq("id", fixture.experienceIds.main);
      expect(result.error).toBeNull();
    }
  });

  it("rejects an invalid experience_type value", async () => {
    const fixture = getFixture();

    const result = await fixture.admin
      .from("experiences")
      .update({ experience_type: "not-a-real-type" })
      .eq("id", fixture.experienceIds.main);

    expect(result.error).not.toBeNull();
  });

  it("accepts every valid location_scope value", async () => {
    const fixture = getFixture();

    for (const value of [
      "anywhere",
      "country",
      "city",
      "specific_place",
    ] as const) {
      const result = await fixture.admin
        .from("experiences")
        .update({ location_scope: value })
        .eq("id", fixture.experienceIds.main);
      expect(result.error).toBeNull();
    }
  });

  it("rejects an invalid location_scope value", async () => {
    const fixture = getFixture();

    const result = await fixture.admin
      .from("experiences")
      .update({ location_scope: "not-a-real-scope" })
      .eq("id", fixture.experienceIds.main);

    expect(result.error).not.toBeNull();
  });
});

describe("experience taxonomy — tags", () => {
  it("public (anon) can read active tags", async () => {
    const fixture = getFixture();

    const slug = `test-tag-${fixture.runId}`;
    const created = await fixture.admin
      .from("experience_tags")
      .insert({ slug, name: "Test Tag" })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const tagId = created.data!.id as string;

    try {
      const result = await fixture.anon
        .from("experience_tags")
        .select("id")
        .eq("id", tagId);
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    } finally {
      await fixture.admin.from("experience_tags").delete().eq("id", tagId);
    }
  });

  it("blocks a non-admin from creating a tag", async () => {
    const fixture = getFixture();
    const slug = `non-admin-tag-${fixture.runId}`;

    await fixture.userA.from("experience_tags").insert({ slug, name: "Nope" });

    const leaked = await fixture.admin
      .from("experience_tags")
      .select("id")
      .eq("slug", slug);
    expect(leaked.data).toEqual([]);
  });

  it("rejects a duplicate tag assignment for the same experience+tag pair", async () => {
    const fixture = getFixture();

    const tag = await fixture.admin
      .from("experience_tags")
      .insert({ slug: `dup-assign-${fixture.runId}`, name: "Dup Assign" })
      .select("id")
      .single();
    expect(tag.error).toBeNull();
    const tagId = tag.data!.id as string;

    try {
      const first = await fixture.admin
        .from("experience_tag_assignments")
        .insert({
          experience_id: fixture.experienceIds.main,
          tag_id: tagId,
        });
      expect(first.error).toBeNull();

      const second = await fixture.admin
        .from("experience_tag_assignments")
        .insert({
          experience_id: fixture.experienceIds.main,
          tag_id: tagId,
        });
      expect(second.error).not.toBeNull();
    } finally {
      await fixture.admin
        .from("experience_tag_assignments")
        .delete()
        .eq("tag_id", tagId);
      await fixture.admin.from("experience_tags").delete().eq("id", tagId);
    }
  });

  it("tag assignments are readable when the Experience is public", async () => {
    const fixture = getFixture();

    const tag = await fixture.admin
      .from("experience_tags")
      .insert({ slug: `public-vis-${fixture.runId}`, name: "Public Vis" })
      .select("id")
      .single();
    const tagId = tag.data!.id as string;

    try {
      await fixture.admin.from("experience_tag_assignments").insert({
        experience_id: fixture.experienceIds.main, // is_public: true in fixture
        tag_id: tagId,
      });

      const result = await fixture.anon
        .from("experience_tag_assignments")
        .select("experience_id, tag_id")
        .eq("tag_id", tagId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
    } finally {
      await fixture.admin
        .from("experience_tag_assignments")
        .delete()
        .eq("tag_id", tagId);
      await fixture.admin.from("experience_tags").delete().eq("id", tagId);
    }
  });

  it("blocks a non-admin from creating a tag assignment", async () => {
    const fixture = getFixture();

    const created = await fixture.admin
      .from("experience_tags")
      .insert({ slug: `non-admin-assign-${fixture.runId}`, name: "Nope" })
      .select("id")
      .single();
    const tagId = created.data!.id as string;

    try {
      await fixture.userB.from("experience_tag_assignments").insert({
        experience_id: fixture.experienceIds.main,
        tag_id: tagId,
      });

      const leaked = await fixture.admin
        .from("experience_tag_assignments")
        .select("experience_id")
        .eq("tag_id", tagId);
      expect(leaked.data).toEqual([]);
    } finally {
      await fixture.admin
        .from("experience_tag_assignments")
        .delete()
        .eq("tag_id", tagId);
      await fixture.admin.from("experience_tags").delete().eq("id", tagId);
    }
  });
});
