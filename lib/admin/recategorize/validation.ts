import { UUID_RE } from "@/lib/validation";
import { EXPERIENCE_TYPES, LOCATION_SCOPES } from "@/lib/experiences/taxonomy";

export interface RecategorizeUpdateInput {
  id: string;
  primary_category_id: string | null;
  experience_type: string | null;
  location_scope: string | null;
}

export function validateRecategorizeUpdate(
  input: RecategorizeUpdateInput,
): string | null {
  if (!UUID_RE.test(input.id)) return "Invalid experience id.";

  if (
    input.primary_category_id !== null &&
    !UUID_RE.test(input.primary_category_id)
  )
    return "Invalid category id.";

  if (
    input.experience_type !== null &&
    !EXPERIENCE_TYPES.includes(
      input.experience_type as (typeof EXPERIENCE_TYPES)[number],
    )
  )
    return "Invalid experience type.";

  if (
    input.location_scope !== null &&
    !LOCATION_SCOPES.includes(
      input.location_scope as (typeof LOCATION_SCOPES)[number],
    )
  )
    return "Invalid location scope.";

  return null;
}
