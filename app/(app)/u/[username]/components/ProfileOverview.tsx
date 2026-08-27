import Link from "next/link";
import { RecentCompleted } from "./RecentCompleted";
import { ProfileAchievementsPreview } from "./ProfileAchievementsPreview";
import { ProfileCollections } from "./ProfileCollections";
import type { ProfileViewModel } from "../types";
import type { Collection } from "@/app/(app)/list/collections/types";

export function ProfileOverview({
  profile,
  collections,
  isOwner,
}: {
  profile: ProfileViewModel;
  collections: Collection[];
  isOwner: boolean;
}) {
  return (
    <div className="flex flex-col gap-9">
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold tracking-[-0.01em] text-ink">
            Recently completed
          </h2>
          {profile.recentCompleted.length > 0 && (
            <Link
              href={`/u/${profile.username}?view=list`}
              className="text-xs font-semibold text-accent-dark hover:text-accent"
            >
              View all
            </Link>
          )}
        </div>

        <div className="mt-3">
          <RecentCompleted experiences={profile.recentCompleted} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold tracking-[-0.01em] text-ink">
            Achievements
          </h2>
          {profile.achievementCount > 0 && (
            <Link
              href={`/u/${profile.username}?view=achievements`}
              className="text-xs font-semibold text-accent-dark hover:text-accent"
            >
              View all
            </Link>
          )}
        </div>

        <div className="mt-3">
          <ProfileAchievementsPreview
            earnedMilestoneIds={profile.earnedMilestoneIds}
            achievements={profile.earnedAchievements}
            limit={4}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold tracking-[-0.01em] text-ink">
            Collections
          </h2>
          {collections.length > 0 && (
            <Link
              href={
                isOwner ? "/list" : `/u/${profile.username}?view=collections`
              }
              className="text-xs font-semibold text-accent-dark hover:text-accent"
            >
              {isOwner ? "Manage" : "View all"}
            </Link>
          )}
        </div>

        <div className="mt-3">
          <ProfileCollections
            username={profile.username}
            collections={collections.slice(0, 6)}
            isOwner={isOwner}
          />
        </div>
      </section>
    </div>
  );
}
