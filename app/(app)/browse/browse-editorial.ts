import type { BrowseSort, StatusFilter } from "./types";

export function isDefaultBrowseView({
  q,
  category,
  difficulty,
  status,
  sort,
}: {
  q: string;
  category: string | null;
  difficulty: string | null;
  status: StatusFilter;
  sort: BrowseSort;
}): boolean {
  return (
    !q && !category && !difficulty && status === "all" && sort === "recommended"
  );
}
