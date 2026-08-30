import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ErrorState } from "@/components/ui";
import { SITE_URL } from "@/lib/site";
import { loadProfile } from "./data";
import { loadMyList } from "@/app/(app)/list/data";
import {
  loadCollections,
  loadPublicCollections,
  loadPublicList,
} from "@/app/(app)/list/collections/data";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileStats } from "./components/ProfileStats";
import { ProfileNav } from "./components/ProfileNav";
import { ProfileOverview } from "./components/ProfileOverview";
import { ProfileCollections } from "./components/ProfileCollections";
import { ProfileList } from "./components/ProfileList";
import { ProfileAchievements } from "./components/ProfileAchievements";

type View = "overview" | "list" | "collections" | "achievements";

function resolveView(raw: string | undefined): View {
  if (raw === "list") return "list";
  if (raw === "collections") return "collections";
  if (raw === "achievements") return raw;
  return "overview";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  let profile;
  try {
    profile = await loadProfile(username);
  } catch {
    return {};
  }

  if (!profile) return {};

  const description = profile.bio
    ? profile.bio
    : `@${profile.username} has completed ${profile.completedCount} experiences on Sodoit.`;

  return {
    title: { absolute: `@${profile.username} on Sodoit` },
    description,
    alternates: { canonical: `${SITE_URL}/u/${profile.username}` },
  };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { username } = await params;
  const { view } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile;
  try {
    profile = await loadProfile(username);
  } catch {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          title="Could not load profile"
          description="Please try again shortly."
        />
      </div>
    );
  }

  if (!profile) notFound();

  const isOwner = user?.id === profile.id;
  const activeView = resolveView(view);

  const [collections, listResult] = await Promise.all([
    isOwner ? loadCollections(profile.id) : loadPublicCollections(profile.id),
    activeView === "list"
      ? isOwner
        ? loadMyList(profile.id).then((list) => ({
            ...list,
            visibility: "public" as const,
          }))
        : loadPublicList(username)
      : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ProfileHeader
        userId={profile.id}
        username={profile.username}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        joinedAt={profile.joinedAt}
        isOwner={isOwner}
      />

      <div className="mt-6">
        <ProfileStats
          completed={profile.completedCount}
          saved={profile.savedCount}
          collections={collections.length}
          achievements={profile.achievementCount}
        />
      </div>

      <div className="mt-6">
        <ProfileNav username={profile.username} active={activeView} />
      </div>

      <div className="mt-6 min-w-0">
        {activeView === "overview" && (
          <ProfileOverview
            profile={profile}
            collections={collections}
            isOwner={isOwner}
          />
        )}
        {activeView === "list" &&
          listResult &&
          (listResult.visibility === "public" || isOwner ? (
            <ProfileList
              username={profile.username}
              isOwner={isOwner}
              saved={listResult.saved}
              completed={listResult.completed}
            />
          ) : (
            <ErrorState title="This list isn't public." />
          ))}
        {activeView === "collections" && (
          <ProfileCollections
            username={profile.username}
            collections={collections}
            isOwner={isOwner}
          />
        )}
        {activeView === "achievements" && (
          <ProfileAchievements
            earnedMilestoneIds={profile.earnedMilestoneIds}
            achievements={profile.achievementDefinitions}
            stats={profile.stats}
          />
        )}
      </div>
    </div>
  );
}
