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

        <ol className="mt-12 border-b border-[var(--border-muted)] lg:mt-16">
          {experiences.map((experience, index) => {
            const experienceType = experience.experienceType
              ? typeLabels[experience.experienceType]
              : undefined;
            const technologies =
              experience.displayTechnologies ?? experience.technologies;

            return (
              <li
                key={experience.id}
                className="journey-experience-row editorial-interactive-row group -mx-4 grid cursor-default gap-5 px-4 py-9 motion-safe:animate-[journey-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both] sm:py-10 md:grid-cols-[9.5rem_minmax(0,1fr)] md:gap-9 lg:-mx-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:px-5 lg:py-11"
                style={{ animationDelay: `${90 + index * 70}ms` }}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:block">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <time
                      dateTime={experience.startDateTime}
                      className="journey-experience-date text-[0.7rem] font-medium uppercase tracking-[0.07em] text-[var(--foreground-subtle)] opacity-85 transition-colors duration-200 motion-reduce:transition-none"
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
                        <span className="journey-experience-type whitespace-nowrap text-[0.65rem] font-semibold uppercase tracking-[0.085em] text-[var(--accent-muted)] opacity-85 transition-colors duration-200 motion-reduce:transition-none">
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

                <article className="editorial-interactive-content max-w-[46rem]">
                  <h3 className="journey-experience-title text-[clamp(1.14rem,1.45vw,1.36rem)] font-semibold leading-[1.28] tracking-normal text-[var(--foreground)] transition-colors duration-200 motion-reduce:transition-none">
                    {experience.role}
                    {experience.organization ? (
                      <>
                        <span className="mx-2 text-[var(--foreground-subtle)] opacity-60">·</span>
                        <span className="journey-experience-company font-semibold text-[var(--foreground-secondary)] transition-colors duration-200 motion-reduce:transition-none">
                          {experience.organization}
                        </span>
                      </>
                    ) : null}
                  </h3>

                <p className="journey-experience-description mt-3.5 max-w-[44rem] text-[clamp(1rem,1.02vw,1.06rem)] leading-[1.78] text-[var(--foreground-secondary)] transition-colors duration-200 motion-reduce:transition-none">
                  {experience.description}
                </p>

                {experience.context ? (
                  <p className="journey-experience-context mt-3 text-[0.73rem] font-medium uppercase tracking-[0.085em] text-[var(--foreground-subtle)] transition-colors duration-200 motion-reduce:transition-none">
                    {experience.context}
                  </p>
                ) : null}

                {technologies?.length ? (
                  <ul
                    className="mt-5 flex flex-wrap gap-2"
                    aria-label={labels.technologies}
                  >
                    {technologies.map((technology) => (
                      <li
                        key={technology}
                        className="journey-experience-tech rounded-[6px] border border-[rgb(var(--accent-rgb)/0.075)] bg-[rgb(var(--accent-rgb)/0.03)] px-2 py-0.5 text-[0.71rem] font-[450] leading-5 tracking-normal text-[var(--accent-muted)] transition-[background-color,border-color,color] duration-200 ease-out motion-reduce:transition-none"
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
                    rel="noopener noreferrer"
                    aria-label={`${experience.projectLink.label} - ${labels.externalProjectSuffix}`}
                    className="journey-experience-link group/link mt-5 inline-flex items-center gap-2 border-b border-[rgb(var(--accent-rgb)/0.2)] pb-1 text-[0.78rem] font-medium tracking-[0.04em] text-[var(--accent-strong)] transition-[border-color,color] duration-200 ease-out hover:border-[rgb(var(--accent-rgb)/0.7)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--focus-ring-offset)] motion-reduce:transition-none"
                  >
                    <span>{experience.projectLink.label}</span>
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 ease-out group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                    >
                      ↗
                    </span>
                  </a>
                ) : null}
                </article>
              </li>
            );
          })}
        </ol>

        <a
          href="/assets/AZERDAOUI_CV.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="journey-experience-link group/link mt-9 inline-flex items-center border-b border-[rgb(var(--accent-rgb)/0.34)] pb-1.5 text-[0.86rem] font-semibold tracking-[0.025em] text-[var(--accent-strong)] transition-[border-color,color] duration-200 ease-out hover:border-[rgb(var(--accent-rgb)/0.78)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--focus-ring-offset)] motion-reduce:transition-none"
        >
          {labels.fullCvLink}
        </a>
      </div>
    </section>
  );
}
