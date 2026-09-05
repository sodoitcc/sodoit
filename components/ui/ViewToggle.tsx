import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

const OPTIONS: {
  view: ViewMode;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  {
    view: "grid",
    label: "Grid view",
    icon: LayoutGrid,
  },
  {
    view: "list",
    label: "List view",
    icon: List,
  },
];

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className="flex h-10 shrink-0 items-center rounded-lg bg-surface-subtle p-0.5"
    >
      {OPTIONS.map(({ view: optionView, label, icon: Icon }) => {
        const selected = optionView === view;

        return (
          <button
            key={optionView}
            type="button"
            aria-label={label}
            aria-pressed={selected}
            onClick={() => onChange(optionView)}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-[10px]",
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
              selected ? "bg-surface text-accent" : "text-muted hover:text-ink",
            ].join(" ")}
          >
            <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
