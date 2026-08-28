import { describe, expect, it } from "vitest";
import { registerSecurityFixture } from "./fixture";

const getFixture = registerSecurityFixture();

describe("collection detail access contract", () => {
  it("owner can read their own private collection", async () => {
    const fixture = getFixture();

    const created = await fixture.userA
      .from("collections")
      .insert({
        user_id: fixture.aId,
        slug: `access-private-${fixture.runId}`,
        name: "Owner private",
      })
      .select("id, visibility")
      .single();
    expect(created.error).toBeNull();
    expect(created.data?.visibility).toBe("private");
    const collectionId = created.data!.id as string;

    const ownerRead = await fixture.userA
      .from("collections")
      .select("id, slug, visibility")
      .eq("user_id", fixture.aId)
      .eq("slug", `access-private-${fixture.runId}`)
      .maybeSingle();

    expect(ownerRead.error).toBeNull();
    expect(ownerRead.data?.id).toBe(collectionId);

    await fixture.admin.from("collections").delete().eq("id", collectionId);
  });

  it("owner can read their own public collection", async () => {
    const fixture = getFixture();

    const created = await fixture.userA
      .from("collections")
      .insert({
        user_id: fixture.aId,
        slug: `access-public-owner-${fixture.runId}`,
        name: "Owner public",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const collectionId = created.data!.id as string;

    const ownerRead = await fixture.userA
      .from("collections")
      .select("id")
      .eq("user_id", fixture.aId)
      .eq("slug", `access-public-owner-${fixture.runId}`)
      .maybeSingle();

    expect(ownerRead.data?.id).toBe(collectionId);

    await fixture.admin.from("collections").delete().eq("id", collectionId);
  });

  it("another authenticated user cannot read a private collection they don't own", async () => {
    const fixture = getFixture();

    const created = await fixture.userA
      .from("collections")
      .insert({
        user_id: fixture.aId,
        slug: `access-blocked-b-${fixture.runId}`,
        name: "A's private collection",
      })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const collectionId = created.data!.id as string;

    const otherRead = await fixture.userB
      .from("collections")
      .select("id, name, description")
      .eq("user_id", fixture.aId)
      .eq("slug", `access-blocked-b-${fixture.runId}`)
      .maybeSingle();

    expect(otherRead.error).toBeNull();
    expect(otherRead.data).toBeNull();

    await fixture.admin.from("collections").delete().eq("id", collectionId);
  });

  it("a guest (anon) cannot read a private collection", async () => {
    const fixture = getFixture();

    const created = await fixture.userA
      .from("collections")
      .insert({
        user_id: fixture.aId,
        slug: `access-blocked-anon-${fixture.runId}`,
        name: "A's private collection",
      })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const collectionId = created.data!.id as string;

    const anonRead = await fixture.anon
      .from("collections")
      .select("id, name")
      .eq("user_id", fixture.aId)
      .eq("slug", `access-blocked-anon-${fixture.runId}`)
      .maybeSingle();

    expect(anonRead.data).toBeNull();

    await fixture.admin.from("collections").delete().eq("id", collectionId);
  });

  it("a public collection remains readable by owner, another user, and a guest", async () => {
    const fixture = getFixture();

    const created = await fixture.userA
      .from("collections")
      .insert({
        user_id: fixture.aId,
        slug: `access-public-shared-${fixture.runId}`,
        name: "Shared public",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(created.error).toBeNull();
    const collectionId = created.data!.id as string;

    for (const client of [fixture.userA, fixture.userB, fixture.anon]) {
      const read = await client
        .from("collections")
        .select("id")
        .eq("user_id", fixture.aId)
        .eq("slug", `access-public-shared-${fixture.runId}`)
        .maybeSingle();
      expect(read.data?.id).toBe(collectionId);
    }

    await fixture.admin.from("collections").delete().eq("id", collectionId);
  });

  it("a newly forked private copy is readable by its owner (B) but not by the source owner (A) or a guest", async () => {
    const fixture = getFixture();

    const source = await fixture.userA
      .from("collections")
      .insert({
        user_id: fixture.aId,
        slug: `access-fork-src-${fixture.runId}`,
        name: "Forkable source",
        visibility: "public",
      })
      .select("id")
      .single();
    expect(source.error).toBeNull();
    const sourceId = source.data!.id as string;

    const forked = await fixture.userB.rpc("fork_collection", {
      p_source_collection_id: sourceId,
      p_slug: `access-fork-dest-${fixture.runId}`,
      p_name: null,
    });
    expect(forked.error).toBeNull();
    const forkId = (forked.data as { id: string; slug: string }[])[0].id;

    const ownerRead = await fixture.userB
      .from("collections")
      .select("id, visibility")
      .eq("user_id", fixture.bId)
      .eq("slug", `access-fork-dest-${fixture.runId}`)
      .maybeSingle();
    expect(ownerRead.data?.id).toBe(forkId);
    expect(ownerRead.data?.visibility).toBe("private");

    const sourceOwnerRead = await fixture.userA
      .from("collections")
      .select("id")
      .eq("user_id", fixture.bId)
      .eq("slug", `access-fork-dest-${fixture.runId}`)
      .maybeSingle();
    expect(sourceOwnerRead.data).toBeNull();

    const anonRead = await fixture.anon
      .from("collections")
      .select("id")
      .eq("user_id", fixture.bId)
      .eq("slug", `access-fork-dest-${fixture.runId}`)
      .maybeSingle();
    expect(anonRead.data).toBeNull();

    await fixture.admin.from("collections").delete().eq("id", forkId);
    await fixture.admin.from("collections").delete().eq("id", sourceId);
  });
});
