export type ExperienceCardActionState = "unsaved" | "saved" | "completed";

export function resolveExperienceCardActionState(
  saved: boolean,
  completed: boolean,
): ExperienceCardActionState {
  if (completed) return "completed";
  if (saved) return "saved";
  return "unsaved";
}
