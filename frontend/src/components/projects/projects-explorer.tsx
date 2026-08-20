"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  FolderOpen,
  Grid2X2,
  List,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { ProjectCard } from "@/components/projects/project-card";
import {
  ALL_PROJECT_DOMAIN_OPTION,
  type ProjectDomainFilterOption,
  type ProjectDomainOption,
} from "@/features/projects/domain/project-domains";
import {
  createProjectSearchParams,
  filterProjects,
  formatProjectFilterCount,
  formatProjectFilterCountLabel,
  formatProjectsCount,
  getProjectDomainCounts,
  paginateProjects,
  parseProjectUrlSearchParams,
} from "@/lib/projects";
import type {
  Project,
  ProjectExplorerState,
  ProjectViewMode,
  SupportedLocale,
} from "@/types/project";

type ProjectsExplorerProps = {
  projects: Project[];
  domains: ProjectDomainOption[];
  initialState: ProjectExplorerState;
  locale?: SupportedLocale;
};

type CommitMode = "push" | "replace";

type CountedProjectDomainFilterOption = ProjectDomainFilterOption & {
  count: number;
};

const projectsExplorerCopy = {
  fr: {
    searchLabel: "Rechercher un projet ou une technologie",
    searchPlaceholder: "Rechercher un projet, technologie...",
    clearSearch: "Effacer la recherche",
    viewMode: "Mode d'affichage des projets",
    gridView: "Afficher les projets en grille",
    listView: "Afficher les projets en liste",
    domainFilter: "Filtrer les projets par domaine",
    allDomains: "Tous",
    noFilteredTitle: "Aucun projet ne correspond à ces critères.",
    noFilteredBody:
      "Modifie la recherche ou réinitialise les filtres pour retrouver la collection complète.",
    noProjectsTitle: "Aucun projet publié pour le moment.",
    noProjectsBody: "Les projets publiés seront bientôt disponibles.",
    resetFilters: "Réinitialiser les filtres",
    pagination: "Pagination des projets",
    previous: "Précédent",
    next: "Suivant",
  },
  en: {
    searchLabel: "Search for a project or technology",
    searchPlaceholder: "Search for a project, technology...",
    clearSearch: "Clear search",
    viewMode: "Project view mode",
    gridView: "Show projects as a grid",
    listView: "Show projects as a list",
    domainFilter: "Filter projects by domain",
    allDomains: "All",
    noFilteredTitle: "No project matches these criteria.",
    noFilteredBody:
      "Adjust the search or reset filters to see the full collection.",
    noProjectsTitle: "No published project yet.",
    noProjectsBody: "Published projects will be available soon.",
    resetFilters: "Reset filters",
    pagination: "Projects pagination",
    previous: "Previous",
    next: "Next",
  },
} as const satisfies Record<
  SupportedLocale,
  {
    searchLabel: string;
    searchPlaceholder: string;
    clearSearch: string;
    viewMode: string;
    gridView: string;
    listView: string;
    domainFilter: string;
    allDomains: string;
    noFilteredTitle: string;
    noFilteredBody: string;
    noProjectsTitle: string;
    noProjectsBody: string;
    resetFilters: string;
    pagination: string;
    previous: string;
    next: string;
  }
>;

function hasActiveFilters(state: ProjectExplorerState) {
  return state.query.trim().length > 0 || state.domain !== "all";
}

function buildHref(pathname: string, state: ProjectExplorerState) {
  const searchParams = createProjectSearchParams(state);
  const queryString = searchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function ProjectsExplorer({
  projects,
  domains,
  initialState,
  locale = "fr",
}: ProjectsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ProjectExplorerState>(initialState);
  const copy = projectsExplorerCopy[locale];

  useEffect(() => {
    const handlePopState = () => {
      setState(
        parseProjectUrlSearchParams(
          new URLSearchParams(window.location.search),
          domains,
        ),
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [domains]);

  const filteredProjects = useMemo(
    () =>
      filterProjects(projects, {
        domain: state.domain,
        locale,
        query: state.query,
      }),
    [locale, projects, state.domain, state.query],
  );
  const pagination = useMemo(
    () => paginateProjects(filteredProjects, state.page),
    [filteredProjects, state.page],
  );
  const domainCounts = useMemo(() => getProjectDomainCounts(projects), [projects]);
  const domainOptions = useMemo<CountedProjectDomainFilterOption[]>(
    () =>
      [ALL_PROJECT_DOMAIN_OPTION, ...domains].map((domain) => ({
        id: domain.id,
        label: domain.id === "all" ? copy.allDomains : domain.label,
        count: domainCounts.get(domain.id) ?? 0,
      })),
    [copy.allDomains, domainCounts, domains],
  );

  const commitState = (
    nextState: ProjectExplorerState,
    mode: CommitMode = "replace",
    shouldScroll = false,
  ) => {
    setState(nextState);
    const href = buildHref(pathname, nextState);

    if (mode === "push") {
      router.push(href, { scroll: false });
    } else {
      router.replace(href, { scroll: false });
    }

    if (shouldScroll) {
      const reducedMotion =
        document.documentElement.dataset.motion === "reduce" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      window.requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          block: "start",
          behavior: reducedMotion ? "auto" : "smooth",
        });
      });
    }
  };

  const updateQuery = (query: string) => {
    commitState({ ...state, query, page: 1 }, "replace");
  };

  const updateDomain = (domain: ProjectDomainFilterOption["id"]) => {
    commitState({ ...state, domain, page: 1 }, "push");
  };

  const updateView = (view: ProjectViewMode) => {
    commitState({ ...state, view, page: 1 }, "push");
  };

  const updatePage = (page: number) => {
    commitState({ ...state, page }, "push", true);
  };

  const resetFilters = () => {
    commitState({ query: "", domain: "all", view: state.view, page: 1 }, "replace");
  };

  const resolveSelectedDomain = (value: string) =>
    domainOptions.find((domain) => domain.id === value)?.id ?? "all";

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4 xl:-mt-24 xl:ml-auto xl:w-[42rem] xl:items-end">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
          <div className="relative w-full sm:max-w-[28rem]">
            <label htmlFor="project-search" className="sr-only">
              {copy.searchLabel}
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-subtle)]"
            />
            <input
              id="project-search"
              type="search"
              value={state.query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="h-11 w-full rounded-[9px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-11 pr-11 text-[0.82rem] text-[var(--foreground)] outline-none transition duration-200 placeholder:text-[var(--foreground-subtle)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgb(var(--accent-rgb)/0.1)]"
            />
            {state.query ? (
              <button
                type="button"
                onClick={() => updateQuery("")}
                className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[var(--foreground-muted)] transition duration-200 hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)]"
                aria-label={copy.clearSearch}
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div
            className="inline-flex h-11 rounded-[9px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1"
            aria-label={copy.viewMode}
          >
            <button
              type="button"
              aria-label={copy.gridView}
              aria-pressed={state.view === "grid"}
              onClick={() => updateView("grid")}
              className={[
                "grid h-9 w-10 place-items-center rounded-[7px] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)]",
                state.view === "grid"
                  ? "border border-[rgb(var(--accent-rgb)/0.45)] bg-[var(--accent-soft)] text-[var(--foreground)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              ].join(" ")}
            >
              <Grid2X2 aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={copy.listView}
              aria-pressed={state.view === "list"}
              onClick={() => updateView("list")}
              className={[
                "grid h-9 w-10 place-items-center rounded-[7px] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)]",
                state.view === "list"
                  ? "border border-[rgb(var(--accent-rgb)/0.45)] bg-[var(--accent-soft)] text-[var(--foreground)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              ].join(" ")}
            >
              <List aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 border-y border-[var(--border-subtle)] py-4">
        <div className="sm:hidden">
          <label htmlFor="project-domain-filter" className="sr-only">
            {copy.domainFilter}
          </label>
          <div className="relative">
            <select
              id="project-domain-filter"
              value={state.domain}
              onChange={(event) =>
                updateDomain(resolveSelectedDomain(event.target.value))
              }
              className="h-11 w-full appearance-none rounded-[8px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 pr-10 text-[0.88rem] font-medium text-[var(--foreground)] outline-none transition duration-200 focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgb(var(--accent-rgb)/0.1)]"
            >
              {domainOptions.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.id === "all"
                    ? `${copy.allDomains} - ${formatProjectFilterCount(domain.count)}`
                    : `${domain.label} - ${formatProjectFilterCount(domain.count)}`}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]"
            />
          </div>
        </div>
        <div
          className="hidden flex-wrap items-center gap-x-8 gap-y-3 sm:flex lg:gap-x-10"
          role="group"
          aria-label={copy.domainFilter}
        >
          {domainOptions.map((domain) => {
            const isActive = state.domain === domain.id;

            return (
              <button
                key={domain.id}
                type="button"
                aria-pressed={isActive}
                aria-label={`${domain.label}, ${formatProjectFilterCountLabel(
                  domain.count,
                  locale,
                )}`}
                onClick={() => updateDomain(domain.id)}
                className={[
                  "group/domain relative inline-flex min-h-9 items-center gap-2 whitespace-nowrap pb-2 text-[0.84rem] font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--focus-ring-offset)] md:text-[0.88rem]",
                  isActive
                    ? "text-[var(--foreground)]"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]",
                ].join(" ")}
              >
                <span>{domain.label}</span>
                <span
                  aria-hidden="true"
                  className={[
                    "text-[0.66rem] font-normal tracking-[0.04em] tabular-nums transition duration-200",
                    isActive
                      ? "text-[var(--foreground-secondary)] opacity-80"
                      : "text-[var(--foreground-subtle)] opacity-60 group-hover/domain:text-[var(--foreground-secondary)]",
                  ].join(" ")}
                >
                  {formatProjectFilterCount(domain.count)}
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    "pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left rounded-full bg-[var(--accent)] transition duration-200",
                    isActive
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0 group-hover/domain:scale-x-100 group-hover/domain:opacity-45",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div ref={resultsRef} className="scroll-mt-8">
        <p
          aria-live="polite"
          className="mt-5 text-[0.78rem] font-medium text-[var(--foreground-muted)]"
        >
          {formatProjectsCount(filteredProjects.length, locale)}
        </p>

        {pagination.items.length > 0 ? (
          <div
            className={[
              "mt-5",
              state.view === "grid"
                ? "grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3"
                : "grid gap-5",
            ].join(" ")}
          >
            {pagination.items.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                locale={locale}
                view={state.view}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-6 py-14 text-center shadow-[var(--shadow-soft)]">
            <FolderOpen
              aria-hidden="true"
              className="mx-auto h-9 w-9 text-[var(--accent-muted)]"
            />
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              {hasActiveFilters(state)
                ? copy.noFilteredTitle
                : copy.noProjectsTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-[36rem] text-sm leading-6 text-[var(--foreground-muted)]">
              {hasActiveFilters(state)
                ? copy.noFilteredBody
                : copy.noProjectsBody}
            </p>
            {hasActiveFilters(state) ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-5 text-[0.82rem] font-medium text-[var(--foreground)] transition duration-200 hover:border-[var(--accent-muted)] hover:bg-[var(--button-secondary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--focus-ring-offset)]"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                {copy.resetFilters}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {pagination.pageCount > 1 ? (
        <nav
          aria-label={copy.pagination}
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => updatePage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="min-h-10 rounded-[7px] border border-[var(--border-subtle)] px-4 text-[0.78rem] font-medium text-[var(--foreground-muted)] transition duration-200 hover:border-[var(--accent-muted)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copy.previous}
          </button>
          {Array.from({ length: pagination.pageCount }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                type="button"
                aria-current={pagination.currentPage === page ? "page" : undefined}
                onClick={() => updatePage(page)}
                className={[
                  "grid h-10 w-10 place-items-center rounded-[7px] border text-[0.78rem] font-medium transition duration-200",
                  pagination.currentPage === page
                    ? "border-[rgb(var(--accent-rgb)/0.45)] bg-[var(--accent-soft)] text-[var(--foreground)]"
                    : "border-[var(--border-subtle)] text-[var(--foreground-muted)] hover:border-[var(--accent-muted)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                {page}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => updatePage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.pageCount}
            className="min-h-10 rounded-[7px] border border-[var(--border-subtle)] px-4 text-[0.78rem] font-medium text-[var(--foreground-muted)] transition duration-200 hover:border-[var(--accent-muted)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copy.next}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
