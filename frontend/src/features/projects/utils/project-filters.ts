import type {
  Project,
  ProjectCategory,
  ProjectCategoryFilter,
  ProjectExplorerState,
  ProjectLink,
  ProjectViewMode,
  SupportedLocale,
} from "@/features/projects/domain/project.types";
import { getProjectContent } from "@/features/projects/utils/project-localization";

export const PROJECTS_PER_PAGE = 6;

type RawSearchParams = Record<string, string | string[] | undefined>;

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

export function resolveProjectView(value: string | null | undefined) {
  return value === "list" ? "list" : "grid";
}

export function resolveProjectPage(value: string | null | undefined) {
  const page = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function filterProjects(
  projects: readonly Project[],
  state: Pick<ProjectExplorerState, "query" | "category"> & {
    locale?: SupportedLocale;
  },
) {
  const query = normalizeProjectText(state.query);
  const locale = state.locale ?? "fr";

  return projects.filter((project) => {
    const matchesCategory =
      state.category === "all" ||
      project.categories.some((category) => category.slug === state.category);

    if (!matchesCategory) {
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

export function formatProjectsCount(count: number) {
  return count === 1 ? "1 projet trouvé" : `${count} projets trouvés`;
}

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProjectSearchParams(
  searchParams: RawSearchParams,
  categories: readonly ProjectCategory[],
): ProjectExplorerState {
  const query = getFirstParam(searchParams.q) ?? "";

  return {
    query,
    category: resolveProjectCategory(getFirstParam(searchParams.category), categories),
    view: resolveProjectView(getFirstParam(searchParams.view)),
    page: resolveProjectPage(getFirstParam(searchParams.page)),
  };
}

export function parseProjectUrlSearchParams(
  searchParams: URLSearchParams,
  categories: readonly ProjectCategory[],
): ProjectExplorerState {
  return {
    query: searchParams.get("q") ?? "",
    category: resolveProjectCategory(searchParams.get("category"), categories),
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

  if (state.category !== "all") {
    searchParams.set("category", state.category);
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
