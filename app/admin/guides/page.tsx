import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminVisibilityToggle } from "@/components/admin/AdminVisibilityToggle";
import { AdminLinkButton } from "@/components/admin/AdminLinkButton";
import { EmptyState } from "@/components/ui";
import { listGuidesAdmin } from "@/lib/admin/guides/queries";
import { GUIDE_TYPE_LABELS, resolveGuideType } from "@/lib/guides/types";
import { setGuideVisibility } from "@/lib/admin/guides/actions";
import { GUIDE_TYPES } from "@/lib/admin/guides/validation";

interface AdminGuidesPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    visibility?: string;
    page?: string;
  }>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminGuidesPage({
  searchParams,
}: AdminGuidesPageProps) {
  const params = await searchParams;
  const filters = {
    q: params.q ?? "",
    type: params.type ?? "",
    visibility: (params.visibility as "all" | "public" | "hidden") ?? "all",
    page: Number(params.page ?? 1),
  };

  const { guides, total, page, pageCount } = await listGuidesAdmin(filters);

  return (
    <div>
      <AdminPageHeader
        title="Guides"
        description="Manage curated itineraries and collections."
        actions={
          <AdminLinkButton href="/admin/guides/new">
            <Plus className="h-4 w-4" />
            New guide
          </AdminLinkButton>
        }
      />

      <AdminFilterBar
        basePath="/admin/guides"
        searchPlaceholder="Search by title..."
        filters={[
          {
            key: "type",
            label: "Type",
            options: GUIDE_TYPES.map((type) => ({
              value: type,
              label: type === "itinerary" ? "Itinerary" : "Collection",
            })),
          },
          {
            key: "visibility",
            label: "Visibility",
            options: [
              { value: "public", label: "Published" },
              { value: "hidden", label: "Hidden" },
            ],
          },
        ]}
      />

      {guides.length === 0 ? (
        <EmptyState
          title="No guides found"
          description="Try a different search or filter, or create a new guide."
          action={
            <AdminLinkButton href="/admin/guides/new">
              New guide
            </AdminLinkButton>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-panel border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-subtle text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Guide</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {guides.map((guide) => (
                <tr key={guide.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/guides/${guide.id}`}
                      className="block truncate font-medium text-ink hover:text-accent-dark"
                    >
                      {guide.title}
                    </Link>
                    <p className="truncate text-xs text-muted">{guide.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {GUIDE_TYPE_LABELS[resolveGuideType(guide.type)]}
                  </td>
                  <td className="px-4 py-3 text-secondary">{guide.city}</td>
                  <td className="px-4 py-3 text-secondary">
                    {guide.itemCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AdminStatusBadge
                        tone={guide.is_public ? "published" : "hidden"}
                      >
                        {guide.is_public ? "Published" : "Hidden"}
                      </AdminStatusBadge>
                      {guide.featured && (
                        <AdminStatusBadge tone="featured">
                          Featured
                        </AdminStatusBadge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {formatDate(guide.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <AdminVisibilityToggle
                        id={guide.id}
                        isPublic={guide.is_public}
                        action={setGuideVisibility}
                      />
                      <Link
                        href={`/admin/guides/${guide.id}`}
                        className="rounded-control px-3 py-1.5 text-xs font-semibold text-accent-dark hover:bg-accent-wash"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-muted">{total} guides total</p>

      <AdminPagination
        basePath="/admin/guides"
        searchParams={params}
        page={page}
        pageCount={pageCount}
      />
    </div>
  );
}
