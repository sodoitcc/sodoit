"use client";

import { SaveDoneButtons } from "./SaveDoneButtons";
import type { ExperienceCardActionState } from "../experience-card-state";

interface ExperienceCardActionsProps {
  state: ExperienceCardActionState;
  guest: boolean;
  title: string;
  onSave: () => void;
  onRemoveSaved: () => void;
  onComplete: () => void;
  onUncomplete: () => void;
  disabled?: boolean;
}

export function ExperienceCardActions(props: ExperienceCardActionsProps) {
  return (
    <SaveDoneButtons
      {...props}
      className="pointer-events-none absolute inset-x-2 top-2 z-20 justify-between"
    />
  );
}
