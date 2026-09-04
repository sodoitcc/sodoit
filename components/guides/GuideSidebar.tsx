import { ExternalLink, Sparkles } from "lucide-react";

interface GuideFact {
  label: string;
  value: string;
}

interface GuideSidebarProps {
  facts: GuideFact[];
  routeUrl?: string | null;
  routeLabel?: string;
  localTip?: string | null;
}

export function GuideSidebar({
  facts,
  routeUrl,
  routeLabel = "Open route",
  localTip,
}: GuideSidebarProps) {
  return (
    <aside className="mt-6 lg:mt-0 lg:w-[260px] lg:shrink-0">
      <div className="lg:sticky lg:top-20">
        <div className="hidden lg:block">
          {facts.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Guide details
              </p>

              <dl className="mt-2 divide-y divide-border/70">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex items-center justify-between gap-4 py-1.5 first:pt-0 last:pb-0"
                  >
                    <dt className="text-sm text-muted">{fact.label}</dt>
                    <dd className="text-right text-sm font-bold text-ink">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {routeUrl && (
            <a
              href={routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            >
              {routeLabel}
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          )}
        </div>

        {localTip && (
          <div className="mt-4 border-t border-border pt-4 lg:mt-4">
            <p className="flex items-start gap-2 text-sm leading-6 text-ink">
              <Sparkles
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-accent-dark"
              />
              <span>
                <span className="font-bold text-accent-dark">Local tip — </span>
                {localTip}
              </span>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
