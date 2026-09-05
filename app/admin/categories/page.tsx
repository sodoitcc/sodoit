import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminLinkButton } from "@/components/admin/AdminLinkButton";
import { CategoryTable } from "@/components/admin/categories/CategoryTable";
import { listCategoriesAdmin } from "@/lib/admin/categories/queries";

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Manage the primary Tick categories used across Sodoit."
        actions={
          <AdminLinkButton href="/admin/categories/new">
            New category
          </AdminLinkButton>
        }
      />
      <CategoryTable categories={categories} />
    </div>
  );
}
