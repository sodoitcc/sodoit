import { Fragment, type ReactNode } from "react";

import type { BrowseView, Experience } from "../types";
import { ExperienceCard } from "./ExperienceCard";
import { TaskRow } from "./TaskRow";

interface ExperienceResultsProps {
  experiences: Experience[];
  view: BrowseView;
  completed: Set<string>;
  onToggle: (id: string) => Promise<void>;
  saved?: Set<string>;
  onSave?: (id: string) => Promise<void>;
  onRemoveSaved?: (id: string) => Promise<void>;
  onRemove?: (id: string) => void;
  removeLabel?: string;
  onManageCollections?: (id: string) => void;
  guest?: boolean;
  onGuestSave?: () => void;
  inlineContent?: ReactNode;
  inlineAfter?: number;
}

export function ExperienceResults({
  experiences,
  view,
  completed,
  onToggle,
  saved,
  onSave,
  onRemoveSaved,
  onRemove,
  removeLabel,
  onManageCollections,
  guest = false,
  onGuestSave = () => {},
  inlineContent,
  inlineAfter = 6,
}: ExperienceResultsProps) {
  const isGrid = view === "grid";

  const items = experiences.map((experience, index) => {
    const shared = {
      experience,
      done: completed.has(experience.id),
      onToggle: () => onToggle(experience.id),
      saved: saved?.has(experience.id),
      onSave: onSave ? () => onSave(experience.id) : undefined,
      onRemoveSaved: onRemoveSaved
        ? () => onRemoveSaved(experience.id)
        : undefined,
      guest,
      onGuestSave,
      onRemove: onRemove ? () => onRemove(experience.id) : undefined,
      removeLabel,
      onManageCollections: onManageCollections
        ? () => onManageCollections(experience.id)
        : undefined,
    };

    return (
      <Fragment key={experience.id}>
        {isGrid ? <ExperienceCard {...shared} /> : <TaskRow {...shared} />}

        {inlineContent && index === inlineAfter - 1 && (
          <li className="col-span-full py-3 lg:hidden">{inlineContent}</li>
        )}
      </Fragment>
    );
  });

  if (isGrid) {
    return (
      <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items}
      </ul>
    );
  }

  return <ul className="divide-y divide-border">{items}</ul>;
}
