import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ExperienceCategory } from "@/lib/experiences/taxonomy";
import { generateProposal, hasProposedChange, defaultSelected } from "./proposal-engine";
import type { CategorySlug } from "./proposal-engine";

const RECATEGORIZE_COLUMNS =
  "id, title, category, difficulty, location_type, primary_category_id, experience_type, location_scope, is_public";

export interface RecategorizeRow {
  id: string;
  title: string;
  legacyCategory: string | null;
  difficulty: string | null;
  isPublic: boolean;
  currentCategoryId: string | null;
  currentExperienceType: string | null;
  currentLocationScope: string | null;
  proposedCategoryId: string | null;
  proposedExperienceType: string | null;
  proposedLocationScope: string | null;
  status: "high" | "medium" | "review";
  hasChange: boolean;
  defaultSelected: boolean;
}

export interface RecategorizeData {
  rows: RecategorizeRow[];
  categories: ExperienceCategory[];
}

export const RECATEGORIZE_ROW_LIMIT = 2000;

export async function loadRecategorizeData(): Promise<RecategorizeData> {
  const client = createAdminClient();

  const [experiencesResult, categoriesResult] = await Promise.all([
    client
      .from("experiences")
      .select(RECATEGORIZE_COLUMNS)
      .order("title", { ascending: true })
      .range(0, RECATEGORIZE_ROW_LIMIT - 1),
    client
      .from("experience_categories")
      .select("id, slug, name, description, icon, sort_order, is_active")
      .order("sort_order", { ascending: true }),
  ]);

  if (experiencesResult.error) throw experiencesResult.error;
  if (categoriesResult.error) throw categoriesResult.error;

  const categories = (categoriesResult.data ?? []) as ExperienceCategory[];
  const categoryIdBySlug = new Map(
    categories.map((category) => [category.slug, category.id]),
  );

  const rows: RecategorizeRow[] = (experiencesResult.data ?? []).map((row) => {
    const proposal = generateProposal({
      title: row.title,
      category: row.category,
      locationType: row.location_type,
    });

    const proposedCategoryId = proposal.categorySlug
      ? (categoryIdBySlug.get(proposal.categorySlug as CategorySlug) ?? null)
      : null;

    const current = {
      primaryCategoryId: row.primary_category_id,
      experienceType: row.experience_type,
      locationScope: row.location_scope,
    };
    const proposed = {
      primaryCategoryId: proposedCategoryId,
      experienceType: proposal.experienceType,
      locationScope: proposal.locationScope,
    };

    const change = hasProposedChange(current, proposed);

    return {
      id: row.id,
      title: row.title,
      legacyCategory: row.category,
      difficulty: row.difficulty,
      isPublic: row.is_public,
      currentCategoryId: row.primary_category_id,
      currentExperienceType: row.experience_type,
      currentLocationScope: row.location_scope,
      proposedCategoryId,
      proposedExperienceType: proposal.experienceType,
      proposedLocationScope: proposal.locationScope,
      status: proposal.status,
      hasChange: change,
      defaultSelected: defaultSelected(proposal.status, change),
    };
  });

  return { rows, categories };
}
