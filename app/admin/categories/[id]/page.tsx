import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "@/components/admin/categories/CategoryForm";
import {
  getCategoryAdmin,
  getCategoryExperienceCount,
} from "@/lib/admin/categories/queries";
import { UUID_RE } from "@/lib/validation";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const category = await getCategoryAdmin(id);
  if (!category) notFound();

  const experienceCount = await getCategoryExperienceCount(id);

  return (
    <div>
      <AdminPageHeader
        title={category.name}
        description={
          category.is_active ? "Active category." : "Inactive category."
        }
      />
      <CategoryForm category={category} experienceCount={experienceCount} />
    </div>
  );
}
