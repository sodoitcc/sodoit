import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui";
import { getDashboardMetrics } from "@/lib/admin/dashboard";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();

  const summaryCards = [
    {
      label: "Ticks",
      value: metrics.experiencesTotal,
      href: "/admin/experiences",
    },
    {
      label: "Published",
      value: metrics.experiencesPublic,
      href: "/admin/experiences?visibility=public",
    },
    { label: "Guides", value: metrics.guidesTotal, href: "/admin/guides" },
    { label: "Places", value: metrics.placesTotal, href: "/admin/places" },
  ];

  const healthItems = [
    {
      label: "Ticks without an image",
      value: metrics.experiencesWithoutImage,
    },
    {
      label: "Ticks without a description",
      value: metrics.experiencesWithoutDescription,
    },
    {
      label: "Places missing coordinates",
      value: metrics.placesMissingCoordinates,
    },
    { label: "Unpublished guides", value: metrics.unpublishedGuides },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Manage Sodoit content and catalog health."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition-colors hover:border-border-strong">
              <p className="text-2xl font-semibold text-ink">{card.value}</p>
              <p className="mt-1 text-xs font-medium text-muted">
                {card.label}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-ink">Content health</h2>
          <ul className="mt-4 space-y-3">
            {healthItems.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-secondary">{item.label}</span>
                <span
                  className={`font-semibold ${item.value > 0 ? "text-accent-dark" : "text-muted"}`}
                >
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">Recently updated</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Ticks
              </p>
              <ul className="mt-2 space-y-2">
                {metrics.recentExperiences.length === 0 && (
                  <li className="text-sm text-muted">No ticks yet.</li>
                )}
                {metrics.recentExperiences.map((experience) => (
                  <li key={experience.id}>
                    <Link
                      href={`/admin/experiences/${experience.id}`}
                      className="flex items-center justify-between text-sm text-ink hover:text-accent-dark"
                    >
                      <span className="truncate">{experience.title}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {formatDate(experience.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Guides
              </p>
              <ul className="mt-2 space-y-2">
                {metrics.recentGuides.length === 0 && (
                  <li className="text-sm text-muted">No guides yet.</li>
                )}
                {metrics.recentGuides.map((guide) => (
                  <li key={guide.id}>
                    <Link
                      href={`/admin/guides/${guide.id}`}
                      className="flex items-center justify-between text-sm text-ink hover:text-accent-dark"
                    >
                      <span className="truncate">{guide.title}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {formatDate(guide.updated_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
