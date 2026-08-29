import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { experienceLocation } from "@/components/ui";
import {
  aggregateAddedToListActivity,
  type AddedToListGroupItem,
} from "./added-to-list-aggregation";
import {
  aggregateAchievementActivity,
  type AchievementActivityGroupItem,
} from "./achievement-aggregation";

export type ActivityFilter =
  "all" | "completed" | "added_to_list" | "collections";

export const ACTIVITY_FILTERS: readonly ActivityFilter[] = [
  "all",
  "completed",
  "added_to_list",
  "collections",
];

export const ACTIVITY_PAGE_SIZE = 20;
const MAX_SOURCE_FETCH = 200;

export interface ActivityActor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface ExperienceActivityItem {
  id: string;
  kind: "completed" | "added_to_list";
  timestamp: string;
  actor: ActivityActor;
  experience: {
    id: string;
    title: string;
    category: string | null;
    difficulty: string | null;
    location: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
  };
}

export interface CollectionActivityItem {
  id: string;
  kind: "collection_created";
  timestamp: string;
  actor: ActivityActor;
  collection: {
    id: string;
    name: string;
    slug: string;
    ownerUsername: string;
    itemCount: number;
    coverImages: string[];
  };
}

export interface AchievementActivityItem {
  id: string;
  kind: "achievement_unlocked";
  timestamp: string;
  actor: ActivityActor;
  achievement: { id: string; title: string; icon: string | null };
}

export type ActivityItem =
  | ExperienceActivityItem
  | CollectionActivityItem
  | AchievementActivityItem
  | AddedToListGroupItem
  | AchievementActivityGroupItem;

export interface ActivityFeedResult {
  items: ActivityItem[];
  hasMore: boolean;
  page: number;
}

async function loadListActivity(
  supabase: SupabaseClient,
  limit: number,
  filter: ActivityFilter,
): Promise<ExperienceActivityItem[]> {
  const settings = await supabase
    .from("user_list_settings")
    .select("user_id")
    .eq("visibility", "public");
  if (settings.error) throw settings.error;

  const publicUserIds = (settings.data ?? []).map(
    (row) => row.user_id as string,
  );
  if (publicUserIds.length === 0) return [];

  let query = supabase
    .from("user_lists")
    .select("id, user_id, experience_id, status, created_at, completed_at")
    .in("user_id", publicUserIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter === "completed") query = query.eq("status", "completed");
  if (filter === "added_to_list") query = query.eq("status", "saved");

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const experienceIds = [
    ...new Set(data.map((row) => row.experience_id as string)),
  ];
  const userIds = [...new Set(data.map((row) => row.user_id as string))];

  const [experiencesResult, profilesResult] = await Promise.all([
    supabase
      .from("experiences")
      .select(
        "id, title, category, difficulty, location_type, city, country_code, image_url, image_alt",
      )
      .in("id", experienceIds),
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds),
  ]);
  if (experiencesResult.error) throw experiencesResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const experienceById = new Map(
    (experiencesResult.data ?? []).map((row) => [row.id, row]),
  );
  const profileById = new Map(
    (profilesResult.data ?? []).map((row) => [row.id, row]),
  );

  const items: ExperienceActivityItem[] = [];
  for (const row of data) {
    const experience = experienceById.get(row.experience_id);
    const profile = profileById.get(row.user_id);
    if (!experience || !profile || !profile.username) continue;

    items.push({
      id: `list-${row.id}`,
      kind: row.status === "completed" ? "completed" : "added_to_list",
      timestamp:
        row.status === "completed"
          ? (row.completed_at ?? row.created_at)
          : row.created_at,
      actor: {
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
      },
      experience: {
        id: experience.id,
        title: experience.title,
        category: experience.category,
        difficulty: experience.difficulty,
        location: experienceLocation(experience),
        imageUrl: experience.image_url,
        imageAlt: experience.image_alt,
      },
    });
  }

  return items;
}

interface CollectionCoverRow {
  collection_id: string;
  position: number;
  experiences:
    { image_url: string | null } | { image_url: string | null }[] | null;
}

async function loadCollectionCoverImages(
  supabase: SupabaseClient,
  collectionIds: string[],
): Promise<Map<string, string[]>> {
  if (collectionIds.length === 0) return new Map();

  const { data } = await supabase
    .from("collection_items")
    .select("collection_id, position, experiences(image_url)")
    .in("collection_id", collectionIds)
    .order("position", { ascending: true });

  const map = new Map<string, string[]>();
  for (const row of (data ?? []) as CollectionCoverRow[]) {
    const experience = Array.isArray(row.experiences)
      ? (row.experiences[0] ?? null)
      : row.experiences;
    const imageUrl = experience?.image_url;
    if (!imageUrl) continue;

    const current = map.get(row.collection_id) ?? [];
    if (current.length >= 4) continue;

    current.push(imageUrl);
    map.set(row.collection_id, current);
  }

  return map;
}

async function loadCollectionActivity(
  supabase: SupabaseClient,
  limit: number,
): Promise<CollectionActivityItem[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("id, user_id, name, slug, created_at, collection_items(count)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((row) => row.user_id as string))];
  const collectionIds = data.map((row) => row.id as string);

  const [profilesResult, coverImagesById] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds),
    loadCollectionCoverImages(supabase, collectionIds),
  ]);
  if (profilesResult.error) throw profilesResult.error;

  const profileById = new Map(
    (profilesResult.data ?? []).map((row) => [row.id, row]),
  );

  const items: CollectionActivityItem[] = [];
  for (const row of data as ((typeof data)[number] & {
    collection_items: { count: number }[];
  })[]) {
    const profile = profileById.get(row.user_id);
    if (!profile || !profile.username) continue;

    items.push({
      id: `collection-${row.id}`,
      kind: "collection_created",
      timestamp: row.created_at,
      actor: {
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
      },
      collection: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        ownerUsername: profile.username,
        itemCount: (row.collection_items ?? [])[0]?.count ?? 0,
        coverImages: coverImagesById.get(row.id) ?? [],
      },
    });
  }

  return items;
}

async function loadAchievementActivity(
  supabase: SupabaseClient,
  limit: number,
): Promise<AchievementActivityItem[]> {
  const { data, error } = await supabase
    .from("user_achievements")
    .select("user_id, achievement_id, earned_at")
    .order("earned_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((row) => row.user_id as string))];
  const achievementIds = [
    ...new Set(data.map((row) => row.achievement_id as string)),
  ];

  const [profilesResult, achievementsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds),
    supabase
      .from("achievements")
      .select("id, title, icon")
      .in("id", achievementIds),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (achievementsResult.error) throw achievementsResult.error;

  const profileById = new Map(
    (profilesResult.data ?? []).map((row) => [row.id, row]),
  );
  const achievementById = new Map(
    (achievementsResult.data ?? []).map((row) => [row.id, row]),
  );

  const items: AchievementActivityItem[] = [];
  for (const row of data) {
    const profile = profileById.get(row.user_id);
    const achievement = achievementById.get(row.achievement_id);
    if (!profile || !profile.username || !achievement) continue;

    items.push({
      id: `achievement-${row.user_id}-${row.achievement_id}`,
      kind: "achievement_unlocked",
      timestamp: row.earned_at,
      actor: {
        id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
      },
      achievement: {
        id: achievement.id,
        title: achievement.title,
        icon: achievement.icon,
      },
    });
  }

  return items;
}

export async function loadActivityFeed(
  filter: ActivityFilter,
  page: number,
): Promise<ActivityFeedResult> {
  const supabase = await createClient();
  const safePage = Math.max(1, page);
  const perSourceLimit = Math.min(
    safePage * ACTIVITY_PAGE_SIZE + 1,
    MAX_SOURCE_FETCH,
  );

  const wantsListActivity =
    filter === "all" || filter === "completed" || filter === "added_to_list";
  const wantsCollections = filter === "all" || filter === "collections";
  const wantsAchievements = filter === "all";

  const [listItems, collectionItems, achievementItems] = await Promise.all([
    wantsListActivity
      ? loadListActivity(supabase, perSourceLimit, filter)
      : Promise.resolve([]),
    wantsCollections
      ? loadCollectionActivity(supabase, perSourceLimit)
      : Promise.resolve([]),
    wantsAchievements
      ? loadAchievementActivity(supabase, perSourceLimit)
      : Promise.resolve([]),
  ]);

  const merged: ActivityItem[] = [
    ...listItems,
    ...collectionItems,
    ...achievementItems,
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const displayItems =
    filter === "all"
      ? aggregateAchievementActivity(aggregateAddedToListActivity(merged))
      : merged;

  const start = (safePage - 1) * ACTIVITY_PAGE_SIZE;
  const pageItems = displayItems.slice(start, start + ACTIVITY_PAGE_SIZE);
  const hasMore = displayItems.length > start + ACTIVITY_PAGE_SIZE;

  return { items: pageItems, hasMore, page: safePage };
}

export async function loadViewerListStatuses(
  experienceIds: string[],
): Promise<Map<string, "saved" | "completed">> {
  if (experienceIds.length === 0) return new Map();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Map();

  const { data, error } = await supabase
    .from("user_lists")
    .select("experience_id, status")
    .eq("user_id", user.id)
    .in("experience_id", experienceIds);
  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [
      row.experience_id as string,
      row.status as "saved" | "completed",
    ]),
  );
}
