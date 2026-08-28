export function feedCollectionHref(collection: {
  ownerUsername: string;
  slug: string;
}): string {
  return `/u/${collection.ownerUsername}/collections/${collection.slug}`;
}
