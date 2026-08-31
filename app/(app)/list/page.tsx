import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { loginHrefWithNext } from "@/lib/auth-redirect";
import { loadMyList } from "./data";
import { MyListView } from "./MyListView";
import { BROWSE_VIEWS } from "@/app/(app)/browse/types";
import type { BrowseView } from "@/app/(app)/browse/types";
import {
  loadCollectionMembership,
  loadCollections,
  loadListVisibility,
} from "./collections/data";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface MyListPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function MyListPage({ searchParams }: MyListPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(loginHrefWithNext("/list"));
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle<{ username: string | null }>();

  const username = profile?.username ?? "";

  const params = await searchParams;

  const view: BrowseView = BROWSE_VIEWS.includes(params.view as BrowseView)
    ? (params.view as BrowseView)
    : "grid";

  const [{ saved, completed }, visibility, collections] = await Promise.all([
    loadMyList(user.id),
    loadListVisibility(user.id),
    loadCollections(user.id),
  ]);

  const allIds = [...saved, ...completed].map((experience) => experience.id);
  const membershipMap = await loadCollectionMembership(user.id, allIds);
  const membership = Object.fromEntries(
    [...membershipMap.entries()].map(([id, set]) => [id, [...set]]),
  );

  return (
    <MyListView
      username={username}
      saved={saved}
      completed={completed}
      view={view}
      visibility={visibility}
      collections={collections}
      membership={membership}
    />
  );
}
