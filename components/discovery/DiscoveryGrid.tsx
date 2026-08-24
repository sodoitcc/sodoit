import Link from "next/link";
import { MoveRight } from "lucide-react";

import type { Guide } from "@/lib/guides/types";
import type { GuideResolvedImage } from "@/lib/guides/queries";
import { DiscoveryCard } from "./DiscoveryCard";

interface DiscoveryGridProps {
  title: string;
  guides: Guide[];
  eyebrow?: string;
  stopCounts?: Record<string, number>;
  viewAllHref?: string;
  resolvedImages?: Record<string, GuideResolvedImage | null>;
}

export function DiscoveryGrid({
  title,
  guides,
  eyebrow,
  stopCounts,
  viewAllHref,
  resolvedImages,
}: DiscoveryGridProps) {
  if (guides.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              {eyebrow}
            </p>
          )}

          <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-ink">
            {title}
          </h2>
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-dark"
          >
            View all
            <MoveRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide, index) => (
          <DiscoveryCard
            key={guide.id}
            guide={guide}
            stopCount={stopCounts?.[guide.id]}
            priority={index < 3}
            image={resolvedImages?.[guide.id]}
          />
        ))}
      </div>
    </section>
  );
}
