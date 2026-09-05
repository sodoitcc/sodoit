import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CategoryForm } from "@/components/admin/categories/CategoryForm";

export default function NewCategoryPage() {
  return (
    <div>
      <AdminPageHeader
        title="New category"
        description="Create a new Tick category."
      />
      <CategoryForm />
    </div>
  );
}
