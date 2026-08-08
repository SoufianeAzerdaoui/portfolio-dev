import type { Project } from "@/features/projects/domain/project.types";

export interface ProjectRepository {
  getAllProjects(): Promise<Project[]>;
  getPublishedProjects(): Promise<Project[]>;
  getFeaturedProjects(limit?: number): Promise<Project[]>;
  getProjectBySlug(slug: string): Promise<Project | null>;
}
