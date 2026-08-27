import { ViewToggle } from "@/components/ui";
import type { BrowseView } from "@/app/(app)/browse/types";
import type { MyListStatus } from "./useMyListState";

const SECTION_TITLES: Record<MyListStatus, string> = {
  all: "All experiences",
  saved: "Saved experiences",
  completed: "Completed experiences",
};

interface MyListResultsHeaderProps {
  status: MyListStatus;
  view: BrowseView;
  onViewChange: (view: BrowseView) => void;
}

export function MyListResultsHeader({
  status,
  view,
  onViewChange,
}: MyListResultsHeaderProps) {
  return (
    <div className="mt-10 flex items-center justify-between gap-3 border-b border-border pb-3">
      <h2 className="text-base font-bold tracking-[-0.01em] text-ink">
        {SECTION_TITLES[status]}
      </h2>

      <ViewToggle view={view} onChange={onViewChange} />
    </div>
  );
}
