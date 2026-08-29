import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";
import type { AdminExperienceTag } from "@/lib/admin/tags/queries";

interface TagTableProps {
  tags: AdminExperienceTag[];
}

export function TagTable({ tags }: TagTableProps) {
  if (tags.length === 0) {
    return (
      <EmptyState
        title="No tags yet"
        description="Create the first Experience tag to get started."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-panel border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-surface-subtle text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Experiences</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {tags.map((tag) => (
            <tr key={tag.id} className="hover:bg-surface-subtle">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/tags/${tag.id}`}
                  className="font-semibold text-ink hover:text-accent-dark"
                >
                  {tag.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{tag.slug}</td>
              <td className="px-4 py-3 text-secondary">
                {tag.experience_count}
              </td>
              <td className="px-4 py-3">
                <Badge variant={tag.is_active ? "success" : "muted"}>
                  {tag.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
