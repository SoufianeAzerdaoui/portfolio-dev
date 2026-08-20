import { ArrowUpRight } from "lucide-react";

import {
  journeyExperienceTypeLabels,
  type JourneyExperience,
} from "@/content/journey";

type JourneySectionProps = {
  experiences: readonly JourneyExperience[];
};

export function JourneySection({ experiences }: JourneySectionProps) {
  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="relative scroll-mt-6 overflow-hidden px-5 py-24 sm:px-8 lg:min-h-[88svh] lg:px-[clamp(2rem,4vw,4.5rem)] lg:py-32"
    >
      <div className="mx-auto w-full max-w-[72rem] lg:-translate-x-5 xl:-translate-x-8 2xl:-translate-x-10">
        <header className="max-w-[42rem] motion-safe:animate-[journey-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <p className="text-[0.89rem] font-medium uppercase tracking-[0.42em] text-[var(--accent-muted)]">
            / Parcours
          </p>
          {/* <h2
            id="journey-title"
            className="mt-5 text-[clamp(2.5rem,4.8vw,4.75rem)] font-medium leading-[0.96] tracking-[-0.055em] text-[var(--foreground)]"
          >
            Parcours professionnel
          </h2> */}
        </header>

        <ol className="mt-12 border-b border-[var(--border-muted)] lg:mt-14">
          {experiences.map((experience, index) => {
            const experienceType = experience.experienceType
              ? journeyExperienceTypeLabels[experience.experienceType]
              : undefined;

            return (
              <li
                key={experience.id}
                className="group -mx-4 grid cursor-default gap-4 rounded-[11px] border border-transparent border-t-[var(--border-muted)] px-4 py-8 transition-[background-color,border-color] duration-200 ease-out hover:border-[rgb(var(--accent-rgb)/0.1)] hover:bg-[var(--accent-faint)] focus-within:border-[rgb(var(--accent-rgb)/0.1)] focus-within:bg-[var(--accent-faint)] motion-safe:animate-[journey-rise_420ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:transition-none md:grid-cols-[9rem_minmax(0,1fr)] md:gap-8 lg:-mx-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:px-5 lg:py-9"
                style={{ animationDelay: `${90 + index * 70}ms` }}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:block">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <time
                      dateTime={experience.startDateTime}
                      className="text-[0.72rem] font-medium uppercase tracking-[0.065em] text-[var(--foreground-subtle)] transition-colors duration-200 group-hover:text-[var(--foreground-muted)] group-focus-within:text-[var(--foreground-muted)] motion-reduce:transition-none"
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
                        <span className="whitespace-nowrap text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-[var(--accent-muted)] transition-colors duration-200 group-hover:text-[var(--accent-strong)] group-focus-within:text-[var(--accent-strong)] motion-reduce:transition-none">
                          {experienceType}
                        </span>
                      </>
                    ) : null}
                  </div>
                  {experience.isCurrent ? (
                    <span
                      aria-label="Expérience en cours"
                      className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-80 shadow-[0_0_10px_rgb(var(--accent-rgb)/0.28)] md:mt-3 md:block"
                    />
                  ) : null}
                </div>

              <article className="max-w-[44rem] transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-focus-within:translate-x-0.5 motion-reduce:translate-x-0 motion-reduce:transition-none">
                <h3 className="text-[clamp(1.08rem,1.55vw,1.28rem)] font-semibold leading-snug tracking-[-0.035em] text-[var(--foreground)] transition-colors duration-200 group-hover:text-[var(--foreground)] group-focus-within:text-[var(--foreground)] motion-reduce:transition-none">
                  {experience.role}
                  {experience.organization ? (
                    <>
                      <span className="mx-2 text-[var(--foreground-subtle)] opacity-80">·</span>
                      <span className="font-medium text-[var(--foreground-secondary)] transition-colors duration-200 group-hover:text-[var(--accent-strong)] group-focus-within:text-[var(--accent-strong)] motion-reduce:transition-none">
                        {experience.organization}
                      </span>
                    </>
                  ) : null}
                </h3>

                <p className="mt-3 max-w-[42rem] text-[0.95rem] leading-[1.65] text-[var(--foreground-muted)]">
                  {experience.description}
                </p>

                {experience.technologies?.length ? (
                  <ul
                    className="mt-4 flex flex-wrap gap-2"
                    aria-label="Compétences utilisées"
                  >
                    {experience.technologies.map((technology) => (
                      <li
                        key={technology}
                        className="rounded-full border border-[rgb(var(--accent-rgb)/0.08)] bg-[rgb(var(--accent-rgb)/0.045)] px-[9px] py-1 text-[0.75rem] font-[450] leading-5 tracking-[0.015em] text-[var(--accent-muted)] transition-[background-color,border-color,color] duration-200 ease-out group-hover:border-[rgb(var(--accent-rgb)/0.16)] group-hover:bg-[rgb(var(--accent-rgb)/0.07)] group-hover:text-[var(--accent-strong)] group-focus-within:border-[rgb(var(--accent-rgb)/0.16)] group-focus-within:bg-[rgb(var(--accent-rgb)/0.07)] group-focus-within:text-[var(--accent-strong)] motion-reduce:transition-none"
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
                    aria-label={`${experience.projectLink.label} — ouvre un nouvel onglet`}
                    className="group/link mt-5 inline-flex items-center gap-2 border-b border-[rgb(var(--accent-rgb)/0.2)] pb-1 text-[0.78rem] font-medium tracking-[0.04em] text-[var(--accent-strong)] transition-[border-color,color] duration-200 ease-out hover:border-[rgb(var(--accent-rgb)/0.7)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--focus-ring-offset)] motion-reduce:transition-none"
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
