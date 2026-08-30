import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadCollectionBySlug } from "@/app/(app)/list/collections/data";
import { buildCollectionMetadata } from "@/app/(app)/list/collections/metadata";
import { loadMyList } from "@/app/(app)/list/data";
import { SITE_URL } from "@/lib/site";
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

async function loadCollectionResult(ownerId: string | null, slug: string) {
  return ownerId ? loadCollectionBySlug(ownerId, slug) : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const ownerId = await loadOwnerId(username);
  const result = await loadCollectionResult(ownerId, slug);

  return buildCollectionMetadata({
    username,
    slug,
    origin: SITE_URL,
    collection: result?.collection ?? null,
  });
}

export default async function CollectionDetailPage({ params }: PageProps) {
  const { username, slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerId = await loadOwnerId(username);
  if (!ownerId) notFound();

  const result = await loadCollectionResult(ownerId, slug);
  if (!result) notFound();

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
      signedIn={Boolean(user)}
      collection={result.collection}
      experiences={result.experiences}
      completedIds={completedIds}
      myListExperiences={myListExperiences}
    />
  );
}
