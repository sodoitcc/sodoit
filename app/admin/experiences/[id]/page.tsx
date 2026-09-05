import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ExperienceForm } from "@/components/admin/experiences/ExperienceForm";
import {
  getExperienceAdmin,
  getExperienceTagIds,
} from "@/lib/admin/experiences/queries";
import { loadActiveBrowseCategories } from "@/app/(app)/browse/taxonomy-loader";
import { listActiveTags } from "@/lib/admin/tags/queries";
import { UUID_RE } from "@/lib/validation";

interface EditExperiencePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExperiencePage({
  params,
}: EditExperiencePageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const experience = await getExperienceAdmin(id);
  if (!experience) notFound();

  const [categories, tags, selectedTagIds] = await Promise.all([
    loadActiveBrowseCategories(),
    listActiveTags(),
    getExperienceTagIds(id),
  ]);

  return (
    <div>
      <AdminPageHeader
        title={experience.title}
        description={experience.is_public ? "Published tick." : "Hidden tick."}
      />
      <ExperienceForm
        experience={experience}
        categories={categories}
        tags={tags}
        selectedTagIds={selectedTagIds}
      />
    </div>
  );
}
