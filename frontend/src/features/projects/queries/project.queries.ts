import "server-only";

import { LocalProjectRepository } from "@/features/projects/repositories/local-project.repository";
import type { ProjectRepository } from "@/features/projects/repositories/project.repository";

const projectRepository: ProjectRepository = new LocalProjectRepository();

export async function getPublishedProjects() {
  return projectRepository.getPublishedProjects();
}

export async function getFeaturedProjects(limit = 3) {
  return projectRepository.getFeaturedProjects(limit);
}

export async function getProjectBySlug(slug: string) {
  return projectRepository.getProjectBySlug(slug);
}
