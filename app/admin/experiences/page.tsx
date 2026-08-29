import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminVisibilityToggle } from "@/components/admin/AdminVisibilityToggle";
import { AdminLinkButton } from "@/components/admin/AdminLinkButton";
import { EmptyState } from "@/components/ui";
import { CATEGORIES, DIFFICULTIES } from "@/app/(app)/browse/types";
import { listExperiencesAdmin } from "@/lib/admin/experiences/queries";
import { setExperienceVisibility } from "@/lib/admin/experiences/actions";

interface AdminExperiencesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    difficulty?: string;
    visibility?: string;
    featured?: string;
    page?: string;
  }>;
}

function locationLabel(experience: {
  location_type: string;
  city: string | null;
  country_code: string | null;
}) {
  if (experience.location_type === "city" && experience.city)
    return experience.city;
  if (experience.location_type === "country" && experience.country_code)
    return experience.country_code;
  return "Global";
}

export default async function AdminExperiencesPage({
  searchParams,
}: AdminExperiencesPageProps) {
  const params = await searchParams;
  const filters = {
    q: params.q ?? "",
    category: params.category ?? "",
    difficulty: params.difficulty ?? "",
    visibility: (params.visibility as "all" | "public" | "hidden") ?? "all",
    featured: (params.featured as "all" | "true" | "false") ?? "all",
    page: Number(params.page ?? 1),
  };

  const { experiences, total, page, pageCount } =
    await listExperiencesAdmin(filters);

  return (
    <div>
      <AdminPageHeader
        title="Experiences"
        description="Manage and publish the experience catalog."
        actions={
          <>
            <AdminLinkButton
              href="/admin/experiences/recategorize"
              variant="outline"
            >
              Recategorize
            </AdminLinkButton>
            <AdminLinkButton href="/admin/experiences/new">
              <Plus className="h-4 w-4" />
              New experience
            </AdminLinkButton>
          </>
        }
      />

      <AdminFilterBar
        basePath="/admin/experiences"
        searchPlaceholder="Search by title..."
        filters={[
          {
            key: "category",
            label: "Category",
            options: CATEGORIES.map((category) => ({
              value: category,
              label: category,
            })),
          },
          {
            key: "difficulty",
            label: "Difficulty",
            options: DIFFICULTIES.map((difficulty) => ({
              value: difficulty.label,
              label: difficulty.label,
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
          {
            key: "featured",
            label: "Featured",
            options: [
              { value: "true", label: "Featured" },
              { value: "false", label: "Not featured" },
            ],
          },
        ]}
      />

      {experiences.length === 0 ? (
        <EmptyState
          title="No experiences found"
          description="Try a different search or filter, or create a new experience."
          action={
            <AdminLinkButton href="/admin/experiences/new">
              New experience
            </AdminLinkButton>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-panel border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-subtle text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {experiences.map((experience) => (
                <tr key={experience.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-subtle">
                        {experience.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={experience.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/experiences/${experience.id}`}
                          className="block truncate font-medium text-ink hover:text-accent-dark"
                        >
                          {experience.title}
                        </Link>
                        <p className="truncate text-xs text-muted">
                          {experience.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {experience.category ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {experience.difficulty ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {locationLabel(experience)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AdminStatusBadge
                        tone={experience.is_public ? "published" : "hidden"}
                      >
                        {experience.is_public ? "Published" : "Hidden"}
                      </AdminStatusBadge>
                      {experience.featured && (
                        <AdminStatusBadge tone="featured">
                          Featured
                        </AdminStatusBadge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <AdminVisibilityToggle
                        id={experience.id}
                        isPublic={experience.is_public}
                        action={setExperienceVisibility}
                      />
                      <Link
                        href={`/admin/experiences/${experience.id}`}
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

      <p className="mt-3 text-xs text-muted">{total} experiences total</p>

      <AdminPagination
        basePath="/admin/experiences"
        searchParams={params}
        page={page}
        pageCount={pageCount}
      />
    </div>
  );
}
