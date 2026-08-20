import type {
  Project,
  ProjectCategory,
  ProjectCategoryFilter,
  ProjectDomain,
  ProjectDomainFilter,
  ProjectExplorerState,
  ProjectLink,
  ProjectViewMode,
  SupportedLocale,
} from "@/features/projects/domain/project.types";
import {
  getProjectDomainLabel,
  isProjectDomain,
  PROJECT_DOMAIN_OPTIONS,
  type ProjectDomainOption,
} from "@/features/projects/domain/project-domains";
import { getProjectContent } from "@/features/projects/utils/project-localization";

export const PROJECTS_PER_PAGE = 6;

type RawSearchParams = Record<string, string | string[] | undefined>;

export type ProjectDomainCounts = ReadonlyMap<ProjectDomainFilter, number>;

export function normalizeProjectText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getAvailableProjectCategories(projects: readonly Project[]) {
  const categories = new Map<string, ProjectCategory>();

  projects.forEach((project) => {
    project.categories.forEach((category) => {
      if (!categories.has(category.slug)) {
        categories.set(category.slug, category);
      }
    });
  });

  return Array.from(categories.values());
}

export function getAvailableProjectDomains(projects: readonly Project[]) {
  const availableDomains = new Set<ProjectDomain>(
    projects.map((project) => project.domain),
  );

  return PROJECT_DOMAIN_OPTIONS.filter((domain) =>
    availableDomains.has(domain.id),
  );
}

export function getProjectDomainCounts(
  projects: readonly Project[],
): ProjectDomainCounts {
  const counts = new Map<ProjectDomainFilter, number>();

  counts.set("all", projects.length);

  PROJECT_DOMAIN_OPTIONS.forEach((domain) => {
    counts.set(domain.id, 0);
  });

  projects.forEach((project) => {
    counts.set(project.domain, (counts.get(project.domain) ?? 0) + 1);
  });

  return counts;
}

export function getAvailableProjectTechnologies(projects: readonly Project[]) {
  const technologies = new Map<string, Project["technologies"][number]>();

  projects.forEach((project) => {
    project.technologies.forEach((technology) => {
      if (!technologies.has(technology.slug)) {
        technologies.set(technology.slug, technology);
      }
    });
  });

  return Array.from(technologies.values());
}

export function resolveProjectCategory(
  value: string | null | undefined,
  categories: readonly ProjectCategory[],
): ProjectCategoryFilter {
  if (!value) {
    return "all";
  }

  return categories.some((category) => category.slug === value) ? value : "all";
}

export function resolveProjectDomain(
  value: string | null | undefined,
  domains: readonly ProjectDomainOption[],
): ProjectDomainFilter {
  if (!value || value === "all") {
    return "all";
  }

  if (!isProjectDomain(value)) {
    return "all";
  }

  return domains.some((domain) => domain.id === value) ? value : "all";
}

export function resolveProjectView(value: string | null | undefined) {
  return value === "list" ? "list" : "grid";
}

export function resolveProjectPage(value: string | null | undefined) {
  const page = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function filterProjects(
  projects: readonly Project[],
  state: Pick<ProjectExplorerState, "query" | "domain"> & {
    locale?: SupportedLocale;
  },
) {
  const query = normalizeProjectText(state.query);
  const locale = state.locale ?? "fr";

  return projects.filter((project) => {
    const matchesDomain = state.domain === "all" || project.domain === state.domain;

    if (!matchesDomain) {
      return false;
    }

    if (!query) {
      return true;
    }

    const content = getProjectContent(project, locale);
    const searchable = [
      content.title,
      content.shortDescription,
      ...project.categories.flatMap((category) => [
        category.name,
        category.slug,
      ]),
      ...project.technologies.flatMap((technology) => [
        technology.name,
        technology.slug,
      ]),
      ...(project.searchKeywords ?? []),
      getProjectDomainLabel(project.domain),
      project.domain,
      project.year?.toString() ?? "",
      project.role ?? "",
      project.organization ?? "",
    ]
      .map(normalizeProjectText)
      .join(" ");

    return searchable.includes(query);
  });
}

export function paginateProjects(
  projects: readonly Project[],
  requestedPage: number,
  perPage = PROJECTS_PER_PAGE,
) {
  const pageCount = Math.max(1, Math.ceil(projects.length / perPage));
  const currentPage = Math.min(Math.max(1, requestedPage), pageCount);
  const startIndex = (currentPage - 1) * perPage;

  return {
    currentPage,
    pageCount,
    items: projects.slice(startIndex, startIndex + perPage),
  };
}

export function formatProjectsCount(count: number, locale: SupportedLocale = "fr") {
  if (locale === "en") {
    return count === 1 ? "1 project found" : `${count} projects found`;
  }

  return count === 1 ? "1 projet trouvé" : `${count} projets trouvés`;
}

export function formatProjectFilterCount(count: number) {
  return String(count).padStart(2, "0");
}

export function formatProjectFilterCountLabel(
  count: number,
  locale: SupportedLocale = "fr",
) {
  if (locale === "en") {
    return count === 1 ? "1 project" : `${count} projects`;
  }

  return count === 1 ? "1 projet" : `${count} projets`;
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProjectSearchParams(
  searchParams: RawSearchParams,
  domains: readonly ProjectDomainOption[] = [],
): ProjectExplorerState {
  const query = getFirstParam(searchParams.q) ?? "";

  return {
    query,
    domain: resolveProjectDomain(getFirstParam(searchParams.domain), domains),
    view: resolveProjectView(getFirstParam(searchParams.view)),
    page: resolveProjectPage(getFirstParam(searchParams.page)),
  };
}

export function parseProjectUrlSearchParams(
  searchParams: URLSearchParams,
  domains: readonly ProjectDomainOption[] = [],
): ProjectExplorerState {
  return {
    query: searchParams.get("q") ?? "",
    domain: resolveProjectDomain(searchParams.get("domain"), domains),
    view: resolveProjectView(searchParams.get("view")),
    page: resolveProjectPage(searchParams.get("page")),
  };
}

export function createProjectSearchParams(state: ProjectExplorerState) {
  const searchParams = new URLSearchParams();
  const query = state.query.trim();

  if (query) {
    searchParams.set("q", query);
  }

  if (state.domain !== "all") {
    searchParams.set("domain", state.domain);
  }

  if (state.view !== "grid") {
    searchParams.set("view", state.view);
  }

  if (state.page > 1) {
    searchParams.set("page", String(state.page));
  }

  return searchParams;
}

export function getPrimaryProjectLink(project: Project): ProjectLink | undefined {
  return (
    project.links.find((link) => link.type === "demo") ??
    project.links.find((link) => link.type === "documentation") ??
    project.links.find((link) => link.type === "paper") ??
    project.links.find((link) => link.type === "github") ??
    project.links.find((link) => link.type === "other")
  );
}

export function isExternalProjectLink(href: string) {
  return /^https?:\/\//.test(href);
}

export function isProjectViewMode(value: string): value is ProjectViewMode {
  return value === "grid" || value === "list";
}
