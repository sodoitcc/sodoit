import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function loadExperienceEntries(): Promise<MetadataRoute.Sitemap> {
  const client = createAdminClient();
  const { data } = await client
    .from("experiences")
    .select("slug, created_at")
    .eq("is_public", true);

  return (data ?? [])
    .filter((row) => isValidSlug(row.slug))
    .map((row) => ({
      url: `${SITE_URL}/experiences/${row.slug}`,
      lastModified: row.created_at ?? undefined,
    }));
}

async function loadGuideEntries(): Promise<MetadataRoute.Sitemap> {
  const client = createAdminClient();
  const { data } = await client
    .from("guides")
    .select("slug, updated_at")
    .eq("is_public", true);

  return (data ?? [])
    .filter((row) => isValidSlug(row.slug))
    .map((row) => ({
      url: `${SITE_URL}/guides/${row.slug}`,
      lastModified: row.updated_at ?? undefined,
    }));
}

async function loadProfileEntries(): Promise<MetadataRoute.Sitemap> {
  const client = createAdminClient();
  const { data } = await client
    .from("profiles")
    .select("username, created_at")
    .not("username", "is", null);

  return (data ?? [])
    .filter((row) => isValidSlug(row.username))
    .map((row) => ({
      url: `${SITE_URL}/u/${row.username}`,
      lastModified: row.created_at ?? undefined,
    }));
}

async function loadCollectionEntries(): Promise<MetadataRoute.Sitemap> {
  const client = createAdminClient();
  const { data } = await client
    .from("collections")
    .select("slug, visibility, updated_at, profiles(username)")
    .eq("visibility", "public");

  return (data ?? [])
    .filter((row) => isValidSlug(row.slug))
    .map((row) => {
      const owner = Array.isArray(row.profiles)
        ? row.profiles[0]
        : row.profiles;
      return {
        slug: row.slug,
        username: (owner as { username?: string } | null)?.username,
        updated_at: row.updated_at,
      };
    })
    .filter((row) => isValidSlug(row.username))
    .map((row) => ({
      url: `${SITE_URL}/u/${row.username}/collections/${row.slug}`,
      lastModified: row.updated_at ?? undefined,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL },
    { url: `${SITE_URL}/discovery` },
    { url: `${SITE_URL}/guides` },
  ];

  const empty: MetadataRoute.Sitemap = [];
  const [experiences, guides, profiles, collections] = await Promise.all([
    loadExperienceEntries().catch(() => empty),
    loadGuideEntries().catch(() => empty),
    loadProfileEntries().catch(() => empty),
    loadCollectionEntries().catch(() => empty),
  ]);

  return [
    ...staticEntries,
    ...experiences,
    ...guides,
    ...profiles,
    ...collections,
  ];
}
