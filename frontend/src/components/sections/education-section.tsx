import type { EducationItem, EducationLabels } from "@/content/education";
import type { SectionPreview } from "@/types/portfolio";

type EducationSectionProps = {
  section: SectionPreview;
  items: readonly EducationItem[];
  labels: EducationLabels;
};

export function EducationSection({
  section,
  items,
  labels,
}: EducationSectionProps) {
  return (
    <section
      id="education"
      aria-labelledby="education-title"
      className="relative scroll-mt-6 overflow-hidden px-5 py-20 sm:px-8 lg:px-[clamp(2rem,4vw,4.5rem)] lg:py-24"
    >
      <div className="mx-auto w-full max-w-[72rem] lg:-translate-x-5 xl:-translate-x-8 2xl:-translate-x-10">
        <header className="max-w-[42rem] motion-safe:animate-[journey-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <p className="text-[0.89rem] font-medium uppercase tracking-[0.42em] text-[var(--accent-muted)]">
            / {section.title}
          </p>
          <h2
            id="education-title"
            className="sr-only"
          >
            {labels.title}
          </h2>
          <p className="mt-4 max-w-[36rem] text-[0.95rem] leading-7 text-[var(--foreground-muted)]">
            {section.description}
          </p>
        </header>

        <ol className="mt-12 border-y border-[var(--border-muted)]">
          {items.map((item, index) => (
            <li
              key={`${item.period}-${item.title}`}
              className="education-row editorial-interactive-row group -mx-4 grid cursor-default gap-3 border-b border-[rgba(180,177,194,0.055)] px-4 py-7 last:border-b-0 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-8 lg:-mx-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:px-5 lg:py-8"
            >
              <p
                className="education-date text-[0.72rem] font-medium uppercase tracking-[0.065em] text-[var(--foreground-subtle)] motion-safe:animate-[journey-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both]"
                style={{ animationDelay: `${80 + index * 60}ms` }}
              >
                {item.period}
              </p>

              <div
                className="motion-safe:animate-[journey-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both]"
                style={{ animationDelay: `${110 + index * 60}ms` }}
              >
                <h3 className="education-title max-w-[48rem] text-[1.02rem] font-semibold leading-[1.45] tracking-[-0.03em] text-[var(--foreground)] md:text-[1.08rem]">
                  {item.title}
                </h3>
                {item.metadataLayout === "inline" ? (
                  <p className="education-institution mt-2 text-[0.86rem] font-[450] leading-6 text-[#a7a5af]">
                    {item.institution}
                    <span className="px-2 text-[rgba(167,165,175,0.48)]">·</span>
                    <span className="education-location text-[0.79rem] font-normal text-[#777681]">
                      {item.location}
                    </span>
                  </p>
                ) : (
                  <div className="mt-2 space-y-0.5">
                    <p className="education-institution text-[0.86rem] font-[450] leading-6 text-[#a7a5af]">
                      {item.institution}
                    </p>
                    <p className="education-location text-[0.79rem] leading-5 text-[#777681]">
                      {item.location}
                    </p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
