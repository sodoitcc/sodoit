import { CalendarDays } from "lucide-react";
import { Avatar, ShareButton } from "@/components/ui";
import { EditProfileButton } from "./EditProfileButton";
import { ProfileMenu } from "./ProfileMenu";

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ProfileHeader({
  userId,
  username,
  bio,
  avatarUrl,
  joinedAt,
  isOwner,
}: {
  userId: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  isOwner: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <Avatar name={username} src={avatarUrl} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-3xl">
            {username}
          </h1>
          <p className="mt-0.5 text-sm text-muted">@{username}</p>

          {bio && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink">
              {bio}
            </p>
          )}

          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
            Joined {formatJoinedDate(joinedAt)}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isOwner ? (
          <>
            <EditProfileButton
              userId={userId}
              username={username}
              bio={bio ?? ""}
              avatarUrl={avatarUrl}
            />

            <ShareButton
              url={`/u/${username}`}
              title={`${username}'s profile`}
              size="sm"
            />

            <ProfileMenu />
          </>
        ) : (
          <ShareButton
            url={`/u/${username}`}
            title={`${username}'s profile`}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
