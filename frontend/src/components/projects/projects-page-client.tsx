"use client";

import Image from "next/image";
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
        className="pointer-events-none fixed inset-0 -z-10 bg-[var(--home-bg-0)]"
      />
      <SpaceBackground variant="home" />
      <main
        id="main-content"
        className="relative z-10 min-h-svh overflow-x-clip px-5 pb-20 pt-8 sm:px-8 sm:pt-10 lg:px-12 lg:pt-11 xl:px-16"
      >
        <section className="mx-auto w-full max-w-[88rem]">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-6 sm:gap-7">
              <Link
                href="/#home"
                aria-label="Soufiane Azerdaoui"
                className="inline-flex w-[88px] opacity-[0.9] transition-[opacity,transform] duration-150 hover:-translate-y-px hover:opacity-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)] motion-reduce:transition-none sm:w-[94px]"
              >
                <Image
                  src="/assets/logo-animation/sa-logo-static.webp"
                  alt=""
                  width={96}
                  height={54}
                  sizes="94px"
                  className="h-auto w-full object-contain"
                  priority
                />
              </Link>

              <Link
                href="/#projects"
                className="group inline-flex min-h-8 w-fit items-center gap-2.5 text-[0.82rem] font-medium text-[var(--home-text-secondary)] transition-colors duration-200 hover:text-[var(--home-text)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)]"
              >
                <ArrowLeft
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-[2px] motion-reduce:transition-none"
                />
                <span className="border-b border-transparent pb-0.5 transition-colors duration-200 group-hover:border-[rgba(97,86,183,0.55)]">
                  {content.back}
                </span>
              </Link>
            </div>

            <div className="pt-1 sm:pt-0">
              <PreferencesPanel />
            </div>
          </div>

          <ProjectsExplorer
            projects={projects}
            domains={domains}
            initialState={initialState}
            locale={locale}
            heading={content}
          />
        </section>
      </main>
    </>
  );
}
