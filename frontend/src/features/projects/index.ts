export type {
  Project,
  ProjectCaseStudy,
  ProjectCategory,
  ProjectCategoryFilter,
  ProjectContributor,
  ProjectExplorerState,
  ProjectLink,
  ProjectLinkType,
  ProjectLocalizedContent,
  ProjectMedia,
  ProjectMediaType,
  ProjectResult,
  ProjectSEO,
  ProjectStatus,
  ProjectTechnology,
  ProjectType,
  ProjectViewMode,
  SupportedLocale,
} from "@/features/projects/domain/project.types";

export {
  projectStatuses,
  projectTypes,
  supportedLocales,
} from "@/features/projects/domain/project.types";

export {
  getFeaturedProjects,
  getProjectBySlug,
  getPublishedProjects,
} from "@/features/projects/queries/project.queries";

export {
  createProjectSearchParams,
  filterProjects,
  formatProjectsCount,
  getAvailableProjectCategories,
  getAvailableProjectTechnologies,
  getPrimaryProjectLink,
  isExternalProjectLink,
  isProjectViewMode,
  paginateProjects,
  parseProjectSearchParams,
  parseProjectUrlSearchParams,
} from "@/features/projects/utils/project-filters";

export { getProjectContent } from "@/features/projects/utils/project-localization";
export { resolveProjectMediaUrl } from "@/features/projects/utils/project-media";
