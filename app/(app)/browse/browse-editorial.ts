import type { BrowseSort, StatusFilter } from "./types";
import type { ExperienceType, LocationScope } from "@/lib/experiences/taxonomy";

export function isDefaultBrowseView({
  q,
  category,
  type,
  difficulty,
  locationScope,
  status,
  sort,
}: {
  q: string;
  category: string | null;
  type?: ExperienceType | null;
  difficulty: string | null;
  locationScope?: LocationScope | null;
  status: StatusFilter;
  sort: BrowseSort;
}): boolean {
  return (
    !q &&
    !category &&
    !type &&
    !difficulty &&
    !locationScope &&
    status === "all" &&
    sort === "recommended"
  );
}
