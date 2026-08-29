import { SLUG_RE } from "@/lib/admin/slug";

export const TAG_NAME_MAX = 40;
export const TAG_SLUG_MAX = 40;

export interface TagInput {
  name: string;
  slug: string;
  sort_order: number | null;
  is_active: boolean;
}

export function readTagInput(formData: FormData): TagInput {
  const sortOrderRaw = String(formData.get("sort_order") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase(),
    sort_order: sortOrderRaw === "" ? null : Number(sortOrderRaw),
    is_active: formData.get("is_active") === "on",
  };
}

export function validateTagInput(input: TagInput): string | null {
  if (!input.name) return "Name is required.";
  if (input.name.length > TAG_NAME_MAX)
    return `Name must be ${TAG_NAME_MAX} characters or fewer.`;

  if (!SLUG_RE.test(input.slug))
    return "Slug must be lowercase letters, numbers, and hyphens.";
  if (input.slug.length > TAG_SLUG_MAX)
    return `Slug must be ${TAG_SLUG_MAX} characters or fewer.`;

  if (input.sort_order !== null && !Number.isInteger(input.sort_order))
    return "Sort order must be a whole number.";

  return null;
}
