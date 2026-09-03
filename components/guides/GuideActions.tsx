import { ExternalLink } from "lucide-react";
import { SaveGuideButton } from "./SaveGuideButton";
import { ShareGuideButton } from "./ShareGuideButton";

interface GuideActionsProps {
  guideId: string;
  title: string;
  signedIn: boolean;
  initialSaved: boolean;
  routeUrl?: string | null;
  className?: string;
}

export function GuideActions({
  guideId,
  title,
  signedIn,
  initialSaved,
  routeUrl,
  className = "",
}: GuideActionsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <SaveGuideButton
        guideId={guideId}
        signedIn={signedIn}
        initialSaved={initialSaved}
      />

      <ShareGuideButton title={title} />

      {routeUrl && (
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          Open route in Google Maps
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
