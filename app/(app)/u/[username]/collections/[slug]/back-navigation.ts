export interface CollectionBackTarget {
  label: string;
  href: string;
  useHistoryBack: boolean;
}

export function resolveCollectionBackTarget(
  isOwner: boolean,
  hasHistory: boolean,
): CollectionBackTarget {
  if (isOwner) {
    return { label: "My list", href: "/list", useHistoryBack: false };
  }

  return {
    label: "Back",
    href: "/feed",
    useHistoryBack: hasHistory,
  };
}
