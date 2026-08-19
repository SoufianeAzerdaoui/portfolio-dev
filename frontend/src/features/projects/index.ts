export type {
  Project,
  ProjectCaseStudy,
  ProjectCategory,
  ProjectCategoryFilter,
  ProjectContributor,
  ProjectDomain,
  ProjectDomainFilter,
  ProjectExplorerState,
  ProjectLink,
  ProjectLinkType,
  ProjectLocalizedContent,
  ProjectMedia,
  ProjectMediaRole,
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
  projectDomains,
  projectStatuses,
  projectTypes,
  supportedLocales,
} from "@/features/projects/domain/project.types";

export {
  ALL_PROJECT_DOMAIN_OPTION,
  getProjectDomainLabel,
  isProjectDomain,
  PROJECT_DOMAIN_OPTIONS,
} from "@/features/projects/domain/project-domains";

export type {
  ProjectDomainFilterOption,
  ProjectDomainOption,
} from "@/features/projects/domain/project-domains";

export {
  getFeaturedProjects,
  getProjectBySlug,
  getPublishedProjects,
} from "@/features/projects/queries/project.queries";

export {
  createProjectSearchParams,
  filterProjects,
  formatProjectFilterCount,
  formatProjectFilterCountLabel,
  formatProjectsCount,
  getAvailableProjectCategories,
  getAvailableProjectDomains,
  getAvailableProjectTechnologies,
  getProjectDomainCounts,
  getPrimaryProjectLink,
  isExternalProjectLink,
  isProjectViewMode,
  paginateProjects,
  parseProjectSearchParams,
  parseProjectUrlSearchParams,
} from "@/features/projects/utils/project-filters";

export { getProjectContent } from "@/features/projects/utils/project-localization";
export {
  getProjectMediaByRole,
  resolveProjectMediaUrl,
} from "@/features/projects/utils/project-media";
