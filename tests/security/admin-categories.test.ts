import { describe, expect, it } from "vitest";
import { registerSecurityFixture } from "./fixture";
import {
  getCategoryAdmin,
  isCategorySlugTaken,
  listCategoriesAdmin,
} from "@/lib/admin/categories/queries";

const getFixture = registerSecurityFixture();

describe("admin category data layer", () => {
  it("loads categories ordered by sort_order", async () => {
    const categories = await listCategoriesAdmin();
    const sortOrders = categories.map((c) => c.sort_order);
    expect(sortOrders).toEqual([...sortOrders].sort((a, b) => a - b));
    expect(categories.length).toBeGreaterThanOrEqual(7);
  });

  it("reports zero experience_count for an unused category, and increments correctly", async () => {
    const fixture = getFixture();
    const slug = `admin-count-${fixture.runId}`;

    const created = await fixture.admin
      .from("experience_categories")
      .insert({ slug, name: "Admin Count Test", sort_order: 500 })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const categoryId = created.data!.id as string;

    try {
      const before = await listCategoriesAdmin();
      const beforeRow = before.find((c) => c.id === categoryId);
      expect(beforeRow?.experience_count).toBe(0);

      await fixture.admin
        .from("experiences")
        .update({ primary_category_id: categoryId })
        .eq("id", fixture.experienceIds.main);

      const after = await listCategoriesAdmin();
      const afterRow = after.find((c) => c.id === categoryId);
      expect(afterRow?.experience_count).toBe(1);
    } finally {
      await fixture.admin
        .from("experiences")
        .update({ primary_category_id: null })
        .eq("id", fixture.experienceIds.main);
      await fixture.admin
        .from("experience_categories")
        .delete()
        .eq("id", categoryId);
    }
  });

  it("returns null from getCategoryAdmin for a nonexistent id", async () => {
    const result = await getCategoryAdmin(
      "00000000-0000-4000-8000-000000000000",
    );
    expect(result).toBeNull();
  });

  it("isCategorySlugTaken is true for an existing slug and false for a free one", async () => {
    const fixture = getFixture();
    const taken = await isCategorySlugTaken("places");
    expect(taken).toBe(true);

    const free = await isCategorySlugTaken(`free-slug-${fixture.runId}`);
    expect(free).toBe(false);
  });

  it("isCategorySlugTaken excludes the given id, for editing in place", async () => {
    const fixture = getFixture();
    const slug = `exclude-self-${fixture.runId}`;

    const created = await fixture.admin
      .from("experience_categories")
      .insert({ slug, name: "Exclude Self", sort_order: 501 })
      .select("id")
      .single();
    const categoryId = created.data!.id as string;

    try {
      const withoutExclude = await isCategorySlugTaken(slug);
      expect(withoutExclude).toBe(true);

      const withExclude = await isCategorySlugTaken(slug, categoryId);
      expect(withExclude).toBe(false);
    } finally {
      await fixture.admin
        .from("experience_categories")
        .delete()
        .eq("id", categoryId);
    }
  });

  it("an inactive category keeps existing Experience references intact", async () => {
    const fixture = getFixture();
    const slug = `deactivate-${fixture.runId}`;

    const created = await fixture.admin
      .from("experience_categories")
      .insert({
        slug,
        name: "Deactivate Test",
        sort_order: 502,
        is_active: true,
      })
      .select("id")
      .single();
    const categoryId = created.data!.id as string;

    try {
      await fixture.admin
        .from("experiences")
        .update({ primary_category_id: categoryId })
        .eq("id", fixture.experienceIds.main);

      await fixture.admin
        .from("experience_categories")
        .update({ is_active: false })
        .eq("id", categoryId);

      const experience = await fixture.admin
        .from("experiences")
        .select("primary_category_id")
        .eq("id", fixture.experienceIds.main)
        .single();
      expect(experience.data?.primary_category_id).toBe(categoryId);
    } finally {
      await fixture.admin
        .from("experiences")
        .update({ primary_category_id: null })
        .eq("id", fixture.experienceIds.main);
      await fixture.admin
        .from("experience_categories")
        .delete()
        .eq("id", categoryId);
    }
  });
});
