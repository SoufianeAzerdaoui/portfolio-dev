import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SpaceBackground } from "@/components/home/space-background";
import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import { projectsPageContent } from "@/content/projects";
import { getPublishedProjects } from "@/features/projects/queries/project.queries";
import {
  getAvailableProjectCategories,
  parseProjectSearchParams,
} from "@/lib/projects";

type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Projets",
  description:
    "Archive des projets Data, IA et engineering de Soufiane Azerdaoui.",
  openGraph: {
    title: "Projets | Soufiane Azerdaoui",
    description:
      "Archive des projets Data, IA et engineering de Soufiane Azerdaoui.",
  },
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const publishedProjects = await getPublishedProjects();
  const availableCategories = getAvailableProjectCategories(publishedProjects);
  const initialState = parseProjectSearchParams(
    await searchParams,
    availableCategories,
  );

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[#080D1A]"
      />
      <SpaceBackground />
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
            className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-slate-400/10 bg-[#080D1A]/42 px-4 text-[0.8rem] font-medium text-[#AAB7C8] transition duration-200 hover:border-[#7C8CFF]/40 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1A]"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Retour au portfolio
          </Link>

          <header className="mt-10 max-w-[42rem]">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.28em] text-[#7C8CFF]/78">
              {projectsPageContent.kicker}
            </p>
            <h1
              id="projects-page-title"
              className="mt-4 text-[clamp(2.55rem,5vw,3.5rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-slate-50"
            >
              {projectsPageContent.title}
            </h1>
            <p className="mt-5 max-w-[40rem] text-[0.98rem] leading-7 text-[#CBD5E1]/82">
              {projectsPageContent.description}
            </p>
          </header>

          <ProjectsExplorer
            projects={publishedProjects}
            categories={availableCategories}
            initialState={initialState}
          />
        </section>
      </main>
    </>
  );
}
