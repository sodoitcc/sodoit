import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";
import type { AdminExperienceCategory } from "@/lib/admin/categories/queries";

interface CategoryTableProps {
  categories: AdminExperienceCategory[];
}

export function CategoryTable({ categories }: CategoryTableProps) {
  if (categories.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        description="Create the first Tick category to get started."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-panel border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Ticks</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {categories.map((category) => (
            <tr key={category.id} className="hover:bg-surface-subtle">
              <td className="px-4 py-3 text-muted">{category.sort_order}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/categories/${category.id}`}
                  className="font-semibold text-ink hover:text-accent-dark"
                >
                  {category.icon ? `${category.icon} ` : ""}
                  {category.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{category.slug}</td>
              <td className="max-w-xs truncate px-4 py-3 text-secondary">
                {category.description}
              </td>
              <td className="px-4 py-3 text-secondary">
                {category.experience_count}
              </td>
              <td className="px-4 py-3">
                <Badge variant={category.is_active ? "success" : "muted"}>
                  {category.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
