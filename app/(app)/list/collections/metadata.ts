import type { Metadata } from "next";
import type { Visibility } from "./types";

export interface CollectionMetadataInput {
  username: string;
  slug: string;
  origin: string;
  collection: {
    visibility: Visibility;
    name: string;
    description: string | null;
    coverImages?: string[];
  } | null;
}

export function buildCollectionMetadata({
  username,
  slug,
  origin,
  collection,
}: CollectionMetadataInput): Metadata {
  if (!collection || collection.visibility !== "public") {
    return { robots: { index: false, follow: false } };
  }

  const canonicalUrl = `${origin}/u/${username}/collections/${slug}`;
  const title = `${collection.name} by @${username}`;
  const description =
    collection.description?.trim() ||
    `Explore ${collection.name}, a collection of experiences curated by @${username} on Sodoit.`;
  const image = collection.coverImages?.[0];

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Sodoit",
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
