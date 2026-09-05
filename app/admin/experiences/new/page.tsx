import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ExperienceForm } from "@/components/admin/experiences/ExperienceForm";
import { loadActiveBrowseCategories } from "@/app/(app)/browse/taxonomy-loader";
import { listActiveTags } from "@/lib/admin/tags/queries";

export default async function NewExperiencePage() {
  const [categories, tags] = await Promise.all([
    loadActiveBrowseCategories(),
    listActiveTags(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="New tick"
        description="Create a new entry in the tick catalog."
      />
      <ExperienceForm categories={categories} tags={tags} />
    </div>
  );
}
