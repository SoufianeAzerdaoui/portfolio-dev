import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";

import { SelectedProjectRow } from "@/components/projects/selected-project-row";
import type { SectionPreview } from "@/types/portfolio";
import type { Project, SupportedLocale } from "@/types/project";

type ProjectsTeaserSectionProps = {
  section: SectionPreview;
  projects: Project[];
  locale: SupportedLocale;
};

const projectsTeaserCopy = {
  fr: {
    kicker: "/ Projets",
    allProjects: "Voir tous les projets",
    emptyTitle: "Sélection en préparation",
  },
  en: {
    kicker: "/ Projects",
    allProjects: "View all projects",
    emptyTitle: "Selection in progress",
  },
} as const satisfies Record<
  SupportedLocale,
  {
    kicker: string;
    allProjects: string;
    emptyTitle: string;
  }
>;

export function ProjectsTeaserSection({
  section,
  projects,
  locale,
}: ProjectsTeaserSectionProps) {
  const copy = projectsTeaserCopy[locale];

  return (
    <section
      id={section.id}
      aria-labelledby="projects-title"
      className="relative scroll-mt-6 px-5 pt-[clamp(52px,6svh,78px)] pb-[clamp(52px,6svh,78px)] sm:px-8 lg:min-h-[100svh] lg:px-[clamp(2rem,4vw,4.5rem)]"
    >
      <div className="mx-auto w-full max-w-[72rem] lg:grid lg:min-h-[calc(100svh-clamp(104px,12svh,156px))] lg:grid-rows-[auto_minmax(0,1fr)] lg:-translate-x-5 xl:-translate-x-8 2xl:-translate-x-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[42rem]">
            <p className="text-[0.89rem] font-medium uppercase tracking-[0.42em] text-[var(--accent-muted)]">
              {copy.kicker}
            </p>
            <h2 id="projects-title" className="sr-only">
              {section.title}
            </h2>
          </div>

          <Link
            href="/projects"
            className="group inline-flex min-h-[46px] w-fit items-center justify-center gap-2 rounded-[6px] border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-6 py-2.5 text-[0.83rem] font-medium text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-px hover:border-[var(--accent-muted)] hover:bg-[var(--button-secondary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] active:translate-y-0 motion-reduce:transition-none"
          >
            {copy.allProjects}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px] motion-reduce:transition-none" />
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="mt-8 lg:mt-8 lg:self-center">
            {projects.map((project, index) => (
              <SelectedProjectRow
                key={project.slug}
                project={project}
                index={index}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-6 py-10">
            <div className="flex max-w-[44rem] flex-col gap-4 sm:flex-row sm:items-start">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[rgb(var(--accent-rgb)/0.2)] bg-[var(--accent-soft)]">
                <FolderOpen
                  aria-hidden="true"
                  className="h-5 w-5 text-[var(--accent-muted)]"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  {copy.emptyTitle}
                </h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
