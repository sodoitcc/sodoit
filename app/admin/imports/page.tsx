import { Download } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ExperienceImportPanel } from "@/components/admin/imports/ExperienceImportPanel";
import { GuideImportPanel } from "@/components/admin/imports/GuideImportPanel";
import { Card } from "@/components/ui";

const DOWNLOAD_LINK_CLASS =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-control px-3.5 text-sm font-semibold transition-colors";
const PRIMARY_CLASS = "bg-accent text-white hover:bg-accent-hover";
const OUTLINE_CLASS =
  "border border-border bg-surface text-ink hover:border-border-strong hover:bg-surface-subtle";

export default function AdminImportsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Imports"
        description="Bulk-manage the catalog with spreadsheet imports."
      />

      <Card>
        <h2 className="text-sm font-semibold text-ink">Ticks</h2>
        <p className="mt-1 text-sm text-muted">
          Bulk edit and create ticks using Excel.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href="/admin/imports/experiences/export"
            className={`${DOWNLOAD_LINK_CLASS} ${PRIMARY_CLASS}`}
          >
            <Download className="h-4 w-4" />
            Export current data
          </a>

          <a
            href="/admin/imports/experiences/template"
            className={`${DOWNLOAD_LINK_CLASS} ${OUTLINE_CLASS}`}
          >
            <Download className="h-4 w-4" />
            Download template
          </a>
        </div>

        <ExperienceImportPanel />
      </Card>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold text-ink">Guides</h2>
        <p className="mt-1 text-sm text-muted">
          Bulk edit and create guides using Excel.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href="/admin/imports/guides/export"
            className={`${DOWNLOAD_LINK_CLASS} ${PRIMARY_CLASS}`}
          >
            <Download className="h-4 w-4" />
            Export current data
          </a>

          <a
            href="/admin/imports/guides/template"
            className={`${DOWNLOAD_LINK_CLASS} ${OUTLINE_CLASS}`}
          >
            <Download className="h-4 w-4" />
            Download template
          </a>
        </div>

        <GuideImportPanel />
      </Card>
    </div>
  );
}
