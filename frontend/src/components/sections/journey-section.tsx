import { ArrowUpRight } from "lucide-react";

import {
  type JourneyExperience,
  type JourneySectionLabels,
  type JourneyExperienceType,
} from "@/content/journey";
import type { SectionPreview } from "@/types/portfolio";

type JourneySectionProps = {
  section: SectionPreview;
  experiences: readonly JourneyExperience[];
  typeLabels: Record<JourneyExperienceType, string>;
  labels: JourneySectionLabels;
};

export function JourneySection({
  section,
  experiences,
  typeLabels,
  labels,
}: JourneySectionProps) {
  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="relative scroll-mt-6 overflow-hidden px-5 py-24 sm:px-8 lg:min-h-[88svh] lg:px-[clamp(2rem,4vw,4.5rem)] lg:py-32"
    >
      <div className="mx-auto w-full max-w-[72rem] lg:-translate-x-5 xl:-translate-x-8 2xl:-translate-x-10">
        <header className="max-w-[42rem] motion-safe:animate-[journey-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <p className="text-[0.89rem] font-medium uppercase tracking-[0.42em] text-[var(--accent-muted)]">
            / {section.title}
          </p>
          <h2
            id="journey-title"
            className="sr-only"
          >
            {labels.title}
          </h2>
        </header>

        <ol className="mt-12 border-b border-[var(--border-muted)] lg:mt-14">
          {experiences.map((experience, index) => {
            const experienceType = experience.experienceType
              ? typeLabels[experience.experienceType]
              : undefined;

            return (
              <li
                key={experience.id}
                className="journey-experience-row editorial-interactive-row group -mx-4 grid cursor-default gap-4 px-4 py-8 motion-safe:animate-[journey-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both] md:grid-cols-[9rem_minmax(0,1fr)] md:gap-8 lg:-mx-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:px-5 lg:py-9"
                style={{ animationDelay: `${90 + index * 70}ms` }}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:block">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <time
                      dateTime={experience.startDateTime}
                      className="journey-experience-date text-[0.72rem] font-medium uppercase tracking-[0.065em] text-[var(--foreground-subtle)] transition-colors duration-200 motion-reduce:transition-none"
                    >
                      {experience.period}
                    </time>
                    {experienceType ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="text-[0.72rem] text-[var(--foreground-subtle)] opacity-45"
                        >
                          ·
                        </span>
                        <span className="journey-experience-type whitespace-nowrap text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[var(--accent-muted)] transition-colors duration-200 motion-reduce:transition-none">
                          {experienceType}
                        </span>
                      </>
                    ) : null}
                  </div>
                  {experience.isCurrent ? (
                    <span
                      aria-label={labels.currentExperience}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-80 shadow-[0_0_10px_rgb(var(--accent-rgb)/0.28)] md:mt-3 md:block"
                    />
                  ) : null}
                </div>

                <article className="editorial-interactive-content max-w-[44rem]">
                  <h3 className="journey-experience-title text-[clamp(1.08rem,1.55vw,1.28rem)] font-semibold leading-snug tracking-[-0.035em] text-[var(--foreground)] transition-colors duration-200 motion-reduce:transition-none">
                    {experience.role}
                    {experience.organization ? (
                      <>
                        <span className="mx-2 text-[var(--foreground-subtle)] opacity-80">·</span>
                        <span className="journey-experience-company font-medium text-[var(--foreground-secondary)] transition-colors duration-200 motion-reduce:transition-none">
                          {experience.organization}
                        </span>
                      </>
                    ) : null}
                  </h3>

                <p className="journey-experience-description mt-3 max-w-[42rem] text-[0.95rem] leading-[1.65] text-[var(--foreground-muted)] transition-colors duration-200 motion-reduce:transition-none">
                  {experience.description}
                </p>

                {experience.context ? (
                  <p className="journey-experience-context mt-2 text-[0.75rem] font-medium uppercase tracking-[0.08em] text-[var(--foreground-subtle)] transition-colors duration-200 motion-reduce:transition-none">
                    {experience.context}
                  </p>
                ) : null}

                {experience.technologies?.length ? (
                  <ul
                    className="mt-4 flex flex-wrap gap-2"
                    aria-label={labels.technologies}
                  >
                    {experience.technologies.map((technology) => (
                      <li
                        key={technology}
                        className="journey-experience-tech rounded-full border border-[rgb(var(--accent-rgb)/0.08)] bg-[rgb(var(--accent-rgb)/0.045)] px-[9px] py-1 text-[0.75rem] font-[450] leading-5 tracking-[0.015em] text-[var(--accent-muted)] transition-[background-color,border-color,color] duration-200 ease-out motion-reduce:transition-none"
                      >
                        {technology}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {experience.projectLink ? (
                  <a
                    href={experience.projectLink.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${experience.projectLink.label} - ${labels.externalProjectSuffix}`}
                    className="journey-experience-link group/link mt-5 inline-flex items-center gap-2 border-b border-[rgb(var(--accent-rgb)/0.2)] pb-1 text-[0.78rem] font-medium tracking-[0.04em] text-[var(--accent-strong)] transition-[border-color,color] duration-200 ease-out hover:border-[rgb(var(--accent-rgb)/0.7)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--focus-ring-offset)] motion-reduce:transition-none"
                  >
                    <span>{experience.projectLink.label}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                      strokeWidth={1.8}
                    />
                  </a>
                ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
