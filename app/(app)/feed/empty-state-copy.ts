import type { ActivityFilter } from "./data";

export interface FeedEmptyStateCopy {
  title: string;
  description: string;
}

const COPY: Record<ActivityFilter, FeedEmptyStateCopy> = {
  all: {
    title: "No community activity yet",
    description:
      "When people share their lists, complete experiences, or create public collections, you'll see it here.",
  },
  completed: {
    title: "No completed experiences yet",
    description: "Completed experiences from public lists will show up here.",
  },
  added_to_list: {
    title: "No community activity yet",
    description:
      "When people share their lists, complete experiences, or create public collections, you'll see it here.",
  },
  collections: {
    title: "No public collections yet",
    description: "Collections people make public will show up here.",
  },
};

export function emptyStateForFilter(filter: ActivityFilter): FeedEmptyStateCopy {
  return COPY[filter];
}
