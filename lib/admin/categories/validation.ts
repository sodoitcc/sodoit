import { SLUG_RE } from "@/lib/admin/slug";

export const CATEGORY_NAME_MAX = 60;
export const CATEGORY_DESCRIPTION_MAX = 300;
export const CATEGORY_ICON_MAX = 60;
export const CATEGORY_SLUG_MAX = 60;

export interface CategoryInput {
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number | null;
  is_active: boolean;
}

export function readCategoryInput(formData: FormData): CategoryInput {
  const sortOrderRaw = String(formData.get("sort_order") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    description: String(formData.get("description") ?? "").trim(),
    icon: String(formData.get("icon") ?? "").trim(),
    sort_order: sortOrderRaw === "" ? null : Number(sortOrderRaw),
    is_active: formData.get("is_active") === "on",
  };
}

export function validateCategoryInput(input: CategoryInput): string | null {
  if (!input.name) return "Name is required.";
  if (input.name.length > CATEGORY_NAME_MAX)
    return `Name must be ${CATEGORY_NAME_MAX} characters or fewer.`;

  if (!SLUG_RE.test(input.slug))
    return "Slug must be lowercase letters, numbers, and hyphens.";
  if (input.slug.length > CATEGORY_SLUG_MAX)
    return `Slug must be ${CATEGORY_SLUG_MAX} characters or fewer.`;

  if (input.description.length > CATEGORY_DESCRIPTION_MAX)
    return `Description must be ${CATEGORY_DESCRIPTION_MAX} characters or fewer.`;

  if (input.icon.length > CATEGORY_ICON_MAX)
    return `Icon must be ${CATEGORY_ICON_MAX} characters or fewer.`;

  if (
    input.sort_order === null ||
    !Number.isInteger(input.sort_order) ||
    input.sort_order < 0
  )
    return "Sort order must be a whole number of 0 or more.";

  return null;
}
