import "server-only";

import { PROJECTS } from "@/features/projects/data/projects";
import { validateProjectSource } from "@/features/projects/data/project-source.validation";
import type { Project } from "@/features/projects/domain/project.types";
import type { ProjectRepository } from "@/features/projects/repositories/project.repository";

function getComparableDate(project: Project) {
  return (
    project.publishedAt ??
    project.updatedAt ??
    project.createdAt ??
    project.year?.toString() ??
    ""
  );
}

function sortByPublishedDateDesc(projects: readonly Project[]) {
  return [...projects].sort((left, right) =>
    getComparableDate(right).localeCompare(getComparableDate(left)),
  );
}

function sortFeaturedProjects(projects: readonly Project[]) {
  return [...projects].sort((left, right) => {
    const leftOrder = left.featuredOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.featuredOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return getComparableDate(right).localeCompare(getComparableDate(left));
  });
}

function isPublished(project: Project) {
  return project.status === "published";
}

export class LocalProjectRepository implements ProjectRepository {
  private readonly projects: readonly Project[];

  constructor(projects: readonly Project[] = PROJECTS) {
    validateProjectSource(projects);
    this.projects = projects;
  }

  async getAllProjects() {
    return [...this.projects];
  }

  async getPublishedProjects() {
    return sortByPublishedDateDesc(this.projects.filter(isPublished));
  }

  async getFeaturedProjects(limit = 3) {
    const featuredProjects = this.projects.filter(
      (project) => isPublished(project) && project.featured,
    );

    return sortFeaturedProjects(featuredProjects).slice(0, limit);
  }

  async getProjectBySlug(slug: string) {
    return (
      this.projects.find(
        (project) => project.slug === slug && isPublished(project),
      ) ?? null
    );
  }
}
