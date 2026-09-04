export function spotPreviewLine(
  description: string | null,
  max = 90,
): string | null {
  if (!description) return null;

  const trimmed = description.trim();
  if (trimmed.length <= max) return trimmed;

  return `${trimmed.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export function hasBriefingContent(
  description: string | null,
  heroPreviewMax = 140,
) {
  return Boolean(description && description.trim().length > heroPreviewMax);
}
