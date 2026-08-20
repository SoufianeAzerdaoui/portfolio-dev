"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SpaceBackground } from "@/components/home/space-background";
import { PreferencesPanel } from "@/components/layout/preferences-panel";
import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import { usePreferences } from "@/components/providers/preferences-provider";
import { projectsPageContentByLocale } from "@/content/projects";
import type { ProjectDomainOption } from "@/features/projects/domain/project-domains";
import type {
  Project,
  ProjectExplorerState,
} from "@/types/project";

type ProjectsPageClientProps = {
  projects: Project[];
  domains: ProjectDomainOption[];
  initialState: ProjectExplorerState;
};

export function ProjectsPageClient({
  projects,
  domains,
  initialState,
}: ProjectsPageClientProps) {
  const { locale } = usePreferences();
  const content = projectsPageContentByLocale[locale];

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[var(--background)]"
      />
      <SpaceBackground />
      <div className="fixed right-5 top-5 z-50 flex items-center sm:right-8 lg:right-[clamp(3.25rem,3.3vw,4rem)] lg:top-[42px]">
        <PreferencesPanel />
      </div>
      <main
        id="main-content"
        className="relative z-10 min-h-svh overflow-x-clip px-5 py-8 sm:px-8 lg:px-12 xl:px-16"
      >
        <section
          aria-labelledby="projects-page-title"
          className="mx-auto w-full max-w-[96rem] pb-20 pt-8 sm:pt-12"
        >
          <Link
            href="/#projects"
            className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 text-[0.8rem] font-medium text-[var(--foreground-secondary)] transition duration-200 hover:border-[var(--accent-muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)]"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            {content.back}
          </Link>

          <header className="mt-10 max-w-[42rem]">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[var(--accent-muted)]">
              {content.kicker}
            </p>
            <h1
              id="projects-page-title"
              className="mt-4 text-[clamp(2.55rem,5vw,3.5rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-[var(--foreground)]"
            >
              {content.title}
            </h1>
            <p className="mt-5 max-w-[40rem] text-[0.98rem] leading-7 text-[var(--foreground-muted)]">
              {content.description}
            </p>
          </header>

          <ProjectsExplorer
            projects={projects}
            domains={domains}
            initialState={initialState}
            locale={locale}
          />
        </section>
      </main>
    </>
  );
}
