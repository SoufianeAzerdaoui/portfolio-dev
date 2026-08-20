import type { Metadata } from "next";

import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { getPublishedProjects } from "@/features/projects/queries/project.queries";
import {
  getAvailableProjectDomains,
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
  const availableDomains = getAvailableProjectDomains(publishedProjects);
  const initialState = parseProjectSearchParams(
    await searchParams,
    availableDomains,
  );

  return (
    <ProjectsPageClient
      projects={publishedProjects}
      domains={availableDomains}
      initialState={initialState}
    />
  );
}
