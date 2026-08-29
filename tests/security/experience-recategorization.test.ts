import { describe, expect, it } from "vitest";
import { adminRow } from "./setup";
import { registerSecurityFixture } from "./fixture";

const getFixture = registerSecurityFixture();

describe("apply_experience_recategorization RPC", () => {
  it("updates primary_category_id, experience_type, and location_scope", async () => {
    const fixture = getFixture();

    const category = await adminRow(
      fixture,
      "experience_categories",
      "slug",
      "places",
    );
    const categoryId = category!.id as string;

    try {
      const result = await fixture.admin.rpc(
        "apply_experience_recategorization",
        {
          updates: [
            {
              id: fixture.experienceIds.main,
              primary_category_id: categoryId,
              experience_type: "place",
              location_scope: "specific_place",
            },
          ],
        },
      );

      expect(result.error).toBeNull();
      expect(result.data).toEqual({ updated_count: 1 });

      const row = await adminRow(
        fixture,
        "experiences",
        "id",
        fixture.experienceIds.main,
      );
      expect(row?.primary_category_id).toBe(categoryId);
      expect(row?.experience_type).toBe("place");
      expect(row?.location_scope).toBe("specific_place");
    } finally {
      await fixture.admin
        .from("experiences")
        .update({
          primary_category_id: null,
          experience_type: null,
          location_scope: null,
        })
        .eq("id", fixture.experienceIds.main);
    }
  });

  it("never touches difficulty or legacy category", async () => {
    const fixture = getFixture();

    const before = await adminRow(
      fixture,
      "experiences",
      "id",
      fixture.experienceIds.main,
    );

    try {
      await fixture.admin.rpc("apply_experience_recategorization", {
        updates: [
          {
            id: fixture.experienceIds.main,
            primary_category_id: null,
            experience_type: "activity",
            location_scope: "anywhere",
          },
        ],
      });

      const after = await adminRow(
        fixture,
        "experiences",
        "id",
        fixture.experienceIds.main,
      );
      expect(after?.difficulty).toBe(before?.difficulty);
      expect(after?.category).toBe(before?.category);
      expect(after?.title).toBe(before?.title);
    } finally {
      await fixture.admin
        .from("experiences")
        .update({ experience_type: null, location_scope: null })
        .eq("id", fixture.experienceIds.main);
    }
  });

  it("rejects and rolls back the whole batch when a category is inactive", async () => {
    const fixture = getFixture();

    const inactive = await fixture.admin
      .from("experience_categories")
      .insert({
        slug: `inactive-${fixture.runId}`,
        name: "Inactive",
        sort_order: 900,
        is_active: false,
      })
      .select("id")
      .single();
    const inactiveCategoryId = inactive.data!.id as string;

    const before = await adminRow(
      fixture,
      "experiences",
      "id",
      fixture.experienceIds.main,
    );

    try {
      const result = await fixture.admin.rpc(
        "apply_experience_recategorization",
        {
          updates: [
            {
              id: fixture.experienceIds.ownList,
              primary_category_id: null,
              experience_type: "activity",
              location_scope: "anywhere",
            },
            {
              id: fixture.experienceIds.main,
              primary_category_id: inactiveCategoryId,
              experience_type: "activity",
              location_scope: "anywhere",
            },
          ],
        },
      );

      expect(result.error).not.toBeNull();

      const after = await adminRow(
        fixture,
        "experiences",
        "id",
        fixture.experienceIds.main,
      );
      expect(after?.primary_category_id).toBe(before?.primary_category_id);
      expect(after?.experience_type).toBe(before?.experience_type);

      const otherRow = await adminRow(
        fixture,
        "experiences",
        "id",
        fixture.experienceIds.ownList,
      );
      expect(otherRow?.experience_type).toBeNull();
    } finally {
      await fixture.admin
        .from("experience_categories")
        .delete()
        .eq("id", inactiveCategoryId);
    }
  });

  it("rejects a reference to a nonexistent category", async () => {
    const fixture = getFixture();

    const result = await fixture.admin.rpc(
      "apply_experience_recategorization",
      {
        updates: [
          {
            id: fixture.experienceIds.main,
            primary_category_id: "00000000-0000-4000-8000-000000000000",
            experience_type: null,
            location_scope: null,
          },
        ],
      },
    );

    expect(result.error).not.toBeNull();
  });

  it("rejects an invalid experience_type via the existing check constraint", async () => {
    const fixture = getFixture();

    const result = await fixture.admin.rpc(
      "apply_experience_recategorization",
      {
        updates: [
          {
            id: fixture.experienceIds.main,
            primary_category_id: null,
            experience_type: "not-a-real-type",
            location_scope: null,
          },
        ],
      },
    );

    expect(result.error).not.toBeNull();
  });

  it("is not executable by anon or authenticated roles, only service_role", async () => {
    const fixture = getFixture();

    const anonResult = await fixture.anon.rpc(
      "apply_experience_recategorization",
      { updates: [] },
    );
    expect(anonResult.error).not.toBeNull();

    const userResult = await fixture.userA.rpc(
      "apply_experience_recategorization",
      { updates: [] },
    );
    expect(userResult.error).not.toBeNull();
  });
});
