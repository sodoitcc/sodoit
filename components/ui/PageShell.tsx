import { ReactNode } from "react";

interface PageShellProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  maxWidth?: string;
  children: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  actions,
  toolbar,
  maxWidth = "1440px",
  children,
}: PageShellProps) {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth }}>
      <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-secondary">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      {toolbar && (
        <div className="sticky top-16 z-10 border-b border-border bg-background/95 py-4 backdrop-blur">
          {toolbar}
        </div>
      )}

      <div className="py-6">{children}</div>
    </div>
  );
}
