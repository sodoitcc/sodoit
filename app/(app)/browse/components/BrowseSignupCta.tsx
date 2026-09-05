import Link from "next/link";
import Image from "next/image";
import { ListChecks } from "lucide-react";

interface BrowseSignupCtaProps {
  compact?: boolean;
  featured?: boolean;
}

export function BrowseSignupCta({
  compact = false,
  featured = false,
}: BrowseSignupCtaProps) {
  if (featured) {
    return (
      <aside
        className={[
          "relative w-full overflow-hidden rounded-panel bg-[#EEF9F4]",
          "flex flex-col",
          "lg:block lg:h-full",
        ].join(" ")}
      >
        <div className="relative z-10 p-5 lg:p-5 lg:pb-[120px]">
          <div className="flex items-center gap-2">
            <ListChecks
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-[#287A55]"
            />

            <h2 className="text-lg font-extrabold leading-tight tracking-[-0.025em] text-ink">
              Start your Life List
            </h2>
          </div>

          <p className="mt-3 max-w-[300px] text-sm leading-6 text-secondary">
            Save experiences you want to do and keep them all in one place.
          </p>

          <Link
            href="/signup"
            className={[
              "mt-4 inline-flex h-10 w-fit items-center justify-center",
              "rounded-control bg-white px-4",
              "text-sm font-bold text-accent-dark",
              "transition-colors duration-150",
              "hover:bg-white/70 hover:text-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
            ].join(" ")}
          >
            Create your Life List
          </Link>
        </div>

        <div
          className={[
            "relative h-[200px] w-full overflow-hidden",
            "lg:absolute lg:inset-x-0 lg:bottom-0 lg:h-[125px] lg:min-h-0",
          ].join(" ")}
        >
          <Image
            src="/illustrations/browse-cta.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, 100vw"
            className="object-cover object-bottom lg:object-contain lg:object-bottom"
          />
        </div>
      </aside>
    );
  }

  if (compact) {
    return (
      <div className="rounded-panel bg-surface-subtle p-5">
        <h2 className="font-bold text-ink">Start your Life List</h2>

        <p className="mt-1 text-sm text-secondary">
          Save experiences you want to do.
        </p>

        <Link
          href="/signup"
          className="mt-3 inline-flex text-sm font-bold text-accent-dark hover:text-accent"
        >
          Create your Life List
        </Link>
      </div>
    );
  }

  return null;
}
