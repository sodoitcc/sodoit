import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PostHogIdentity } from "@/components/analytics/PostHogIdentity";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AchievementUnlockProvider } from "./achievements/components/AchievementUnlockProvider";
import { loadAchievementDefinitions } from "./achievements/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [definitions, user] = await Promise.all([
    loadAchievementDefinitions().catch(() => []),
    getCurrentUser(),
  ]);

  let username: string | null = null;
  let avatarUrl: string | null = null;

  if (user) {
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <PostHogIdentity userId={user?.id} username={username} />

      <Header
        signedIn={Boolean(user)}
        username={username}
        avatarUrl={avatarUrl}
      />

      <main className="flex-1">
        <AchievementUnlockProvider definitions={definitions}>
          {children}
        </AchievementUnlockProvider>
      </main>

      <Footer />
    </div>
  );
}
