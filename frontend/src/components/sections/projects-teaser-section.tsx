import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";

import { SelectedProjectRow } from "@/components/projects/selected-project-row";
import { getFeaturedProjects } from "@/features/projects/queries/project.queries";
import type { SectionPreview } from "@/types/portfolio";

type ProjectsTeaserSectionProps = {
  section: SectionPreview;
};

export async function ProjectsTeaserSection({ section }: ProjectsTeaserSectionProps) {
  const featuredProjects = await getFeaturedProjects(3);

  return (
    <section
      id={section.id}
      aria-labelledby="projects-title"
      className="relative scroll-mt-6 overflow-hidden px-5 py-24 sm:px-8 lg:min-h-[88svh] lg:px-[clamp(2rem,4vw,4.5rem)]"
    >
      <div className="mx-auto w-full max-w-[72rem] lg:-translate-x-5 xl:-translate-x-8 2xl:-translate-x-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[42rem]">
            <p className="text-[0.89rem] font-medium uppercase tracking-[0.42em] text-[var(--accent-muted)]">
              / Projets
            </p>
            <h2 id="projects-title" className="sr-only">
              {section.title}
            </h2>
          </div>

          <Link
            href="/projects"
            className="group inline-flex min-h-[46px] w-fit items-center justify-center gap-2 rounded-[6px] border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-6 py-2.5 text-[0.83rem] font-medium text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:-translate-y-px hover:border-[var(--accent-muted)] hover:bg-[var(--button-secondary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)] active:translate-y-0 motion-reduce:transition-none"
          >
            Voir tous les projets
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px] motion-reduce:transition-none" />
          </Link>
        </div>

        {featuredProjects.length > 0 ? (
          <div className="mt-10 lg:mt-12">
            {featuredProjects.map((project, index) => (
              <SelectedProjectRow
                key={project.slug}
                project={project}
                index={index}
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
                  Sélection en préparation
                </h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
