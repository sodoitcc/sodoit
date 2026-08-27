import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui";
import { loadCollectionBySlug } from "@/app/(app)/list/collections/data";
import { loadMyList } from "@/app/(app)/list/data";
import { CollectionDetailView } from "./CollectionDetailView";

interface PageProps {
  params: Promise<{ username: string; slug: string }>;
}

async function loadOwnerId(username: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const ownerId = await loadOwnerId(username);
  const result = ownerId ? await loadCollectionBySlug(ownerId, slug) : null;

  if (!result || result.collection.visibility !== "public") {
    return { robots: { index: false, follow: false } };
  }

  return {
    title: `${result.collection.name} — ${username}`,
    description:
      result.collection.description ?? `A collection by ${username} on Sodoit.`,
    robots: { index: true, follow: true },
  };
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { username, slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerId = await loadOwnerId(username);
  if (!ownerId) notFound();

  const result = await loadCollectionBySlug(ownerId, slug);
  if (!result) {
    const isOwner = user?.id === ownerId;

    if (isOwner) notFound();

    return (
      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState title="This collection isn't public." />
      </div>
    );
  }

  const isOwner = user?.id === ownerId;

  const ownerList = isOwner ? await loadMyList(ownerId) : null;
  const myListExperiences = ownerList
    ? [
        ...new Map(
          [...ownerList.saved, ...ownerList.completed].map((experience) => [
            experience.id,
            experience,
          ]),
        ).values(),
      ]
    : [];
  const completedIds =
    ownerList?.completed.map((experience) => experience.id) ?? [];

  return (
    <CollectionDetailView
      username={username}
      isOwner={isOwner}
      collection={result.collection}
      experiences={result.experiences}
      completedIds={completedIds}
      myListExperiences={myListExperiences}
    />
  );
}
