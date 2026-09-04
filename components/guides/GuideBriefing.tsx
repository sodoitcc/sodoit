export function GuideBriefing({
  heading,
  description,
}: {
  heading: string;
  description: string;
}) {
  return (
    <section className="mt-6 max-w-2xl border-t border-border pt-6 sm:mt-10 sm:pt-8">
      <h2 className="text-lg font-bold tracking-tight text-ink">{heading}</h2>
      <p className="mt-2 text-[15px] leading-6 text-secondary sm:text-base">
        {description}
      </p>
    </section>
  );
}
