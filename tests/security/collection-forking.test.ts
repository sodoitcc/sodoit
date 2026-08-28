import { describe, expect, it } from "vitest";
import { adminRow } from "./setup";
import { registerSecurityFixture } from "./fixture";

const getFixture = registerSecurityFixture();

describe("collection forking", () => {
  it("forks a public collection into a new private collection with items copied in order", async () => {
    const fixture = getFixture();

    const source = await fixture.userB
      .from("collections")
      .insert({
        user_id: fixture.bId,
        slug: `fork-src-${fixture.runId}`,
        name: "Source collection",
        description: "A public collection worth forking.",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    const sourceId = source.data!.id as string;

    const items = await fixture.userB.from("collection_items").insert([
      {
        collection_id: sourceId,
        experience_id: fixture.experienceIds.main,
        position: 0,
      },
      {
        collection_id: sourceId,
        experience_id: fixture.experienceIds.ownList,
        position: 1,
      },
    ]);
    expect(items.error).toBeNull();

    const forked = await fixture.userA.rpc("fork_collection", {
      p_source_collection_id: sourceId,
      p_slug: `fork-dest-${fixture.runId}`,
      p_name: null,
    });

    expect(forked.error).toBeNull();
    const row = (forked.data as { id: string; slug: string }[])[0];
    expect(row.id).toBeTruthy();
    expect(row.slug).toBe(`fork-dest-${fixture.runId}`);

    const newCollection = await adminRow(fixture, "collections", "id", row.id);
    expect(newCollection?.user_id).toBe(fixture.aId);
    expect(newCollection?.name).toBe("Source collection");
    expect(newCollection?.visibility).toBe("private");
    expect(newCollection?.forked_from_collection_id).toBe(sourceId);

    const newItems = await fixture.admin
      .from("collection_items")
      .select("experience_id, position")
      .eq("collection_id", row.id)
      .order("position", { ascending: true });

    expect(newItems.error).toBeNull();
    expect(newItems.data).toEqual([
      { experience_id: fixture.experienceIds.main, position: 0 },
      { experience_id: fixture.experienceIds.ownList, position: 1 },
    ]);

    await fixture.admin.from("collections").delete().eq("id", row.id);
    await fixture.admin.from("collections").delete().eq("id", sourceId);
  });

  it("respects a custom name override while still copying the source description", async () => {
    const fixture = getFixture();

    const source = await fixture.userB
      .from("collections")
      .insert({
        user_id: fixture.bId,
        slug: `fork-named-src-${fixture.runId}`,
        name: "Original name",
        description: "Original description",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    const sourceId = source.data!.id as string;

    const forked = await fixture.userA.rpc("fork_collection", {
      p_source_collection_id: sourceId,
      p_slug: `fork-named-dest-${fixture.runId}`,
      p_name: "My renamed fork",
    });
    expect(forked.error).toBeNull();
    const row = (forked.data as { id: string; slug: string }[])[0];

    const newCollection = await adminRow(fixture, "collections", "id", row.id);
    expect(newCollection?.name).toBe("My renamed fork");
    expect(newCollection?.description).toBe("Original description");

    await fixture.admin.from("collections").delete().eq("id", row.id);
    await fixture.admin.from("collections").delete().eq("id", sourceId);
  });

  it("forks an empty collection successfully with zero items copied", async () => {
    const fixture = getFixture();

    const source = await fixture.userB
      .from("collections")
      .insert({
        user_id: fixture.bId,
        slug: `fork-empty-src-${fixture.runId}`,
        name: "Empty collection",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    const sourceId = source.data!.id as string;

    const forked = await fixture.userA.rpc("fork_collection", {
      p_source_collection_id: sourceId,
      p_slug: `fork-empty-dest-${fixture.runId}`,
      p_name: null,
    });
    expect(forked.error).toBeNull();
    const row = (forked.data as { id: string; slug: string }[])[0];

    const newItems = await fixture.admin
      .from("collection_items")
      .select("experience_id")
      .eq("collection_id", row.id);
    expect(newItems.data).toEqual([]);

    await fixture.admin.from("collections").delete().eq("id", row.id);
    await fixture.admin.from("collections").delete().eq("id", sourceId);
  });

  it("keeps the fork intact — with provenance cleared — after the source is deleted", async () => {
    const fixture = getFixture();

    const source = await fixture.userB
      .from("collections")
      .insert({
        user_id: fixture.bId,
        slug: `fork-deleted-src-${fixture.runId}`,
        name: "Will be deleted",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    const sourceId = source.data!.id as string;

    await fixture.userB.from("collection_items").insert({
      collection_id: sourceId,
      experience_id: fixture.experienceIds.main,
      position: 0,
    });

    const forked = await fixture.userA.rpc("fork_collection", {
      p_source_collection_id: sourceId,
      p_slug: `fork-deleted-dest-${fixture.runId}`,
      p_name: null,
    });
    expect(forked.error).toBeNull();
    const row = (forked.data as { id: string; slug: string }[])[0];

    const deleted = await fixture.userB
      .from("collections")
      .delete()
      .eq("id", sourceId);
    expect(deleted.error).toBeNull();

    const survivingFork = await adminRow(fixture, "collections", "id", row.id);
    expect(survivingFork).not.toBeNull();
    expect(survivingFork?.forked_from_collection_id).toBeNull();

    const survivingItems = await fixture.admin
      .from("collection_items")
      .select("experience_id")
      .eq("collection_id", row.id);
    expect(survivingItems.data).toEqual([
      { experience_id: fixture.experienceIds.main },
    ]);

    await fixture.admin.from("collections").delete().eq("id", row.id);
  });

  it("rejects forking your own collection", async () => {
    const fixture = getFixture();

    const source = await fixture.userA
      .from("collections")
      .insert({
        user_id: fixture.aId,
        slug: `fork-self-src-${fixture.runId}`,
        name: "My own collection",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    const sourceId = source.data!.id as string;

    const forked = await fixture.userA.rpc("fork_collection", {
      p_source_collection_id: sourceId,
      p_slug: `fork-self-dest-${fixture.runId}`,
      p_name: null,
    });

    expect(forked.error).not.toBeNull();

    await fixture.admin.from("collections").delete().eq("id", sourceId);
  });

  it("rejects forking a private collection", async () => {
    const fixture = getFixture();

    const source = await fixture.userB
      .from("collections")
      .insert({
        user_id: fixture.bId,
        slug: `fork-private-src-${fixture.runId}`,
        name: "Private collection",
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    const sourceId = source.data!.id as string;

    const forked = await fixture.userA.rpc("fork_collection", {
      p_source_collection_id: sourceId,
      p_slug: `fork-private-dest-${fixture.runId}`,
      p_name: null,
    });

    expect(forked.error).not.toBeNull();

    const leaked = await fixture.admin
      .from("collections")
      .select("id")
      .eq("slug", `fork-private-dest-${fixture.runId}`);
    expect(leaked.data).toEqual([]);

    await fixture.admin.from("collections").delete().eq("id", sourceId);
  });

  it("rejects an unauthenticated (anon) fork attempt", async () => {
    const fixture = getFixture();

    const source = await fixture.userB
      .from("collections")
      .insert({
        user_id: fixture.bId,
        slug: `fork-anon-src-${fixture.runId}`,
        name: "Anon target",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    const sourceId = source.data!.id as string;

    const forked = await fixture.anon.rpc("fork_collection", {
      p_source_collection_id: sourceId,
      p_slug: `fork-anon-dest-${fixture.runId}`,
      p_name: null,
    });

    expect(forked.error).not.toBeNull();

    await fixture.admin.from("collections").delete().eq("id", sourceId);
  });

  it("rejects an invalid source collection id", async () => {
    const fixture = getFixture();

    const forked = await fixture.userA.rpc("fork_collection", {
      p_source_collection_id: "not-a-uuid",
      p_slug: `fork-badid-${fixture.runId}`,
      p_name: null,
    });

    expect(forked.error).not.toBeNull();
  });

  it("rejects forking a source collection that does not exist", async () => {
    const fixture = getFixture();

    const forked = await fixture.userA.rpc("fork_collection", {
      p_source_collection_id: "00000000-0000-4000-8000-000000000000",
      p_slug: `fork-missing-${fixture.runId}`,
      p_name: null,
    });

    expect(forked.error).not.toBeNull();
  });
});
