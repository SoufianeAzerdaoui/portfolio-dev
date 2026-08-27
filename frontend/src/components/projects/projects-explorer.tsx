"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Grid2X2, List, RotateCcw, Search, X } from "lucide-react";

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
  heading: {
    kicker: string;
    title: string;
    description: string;
  };
};

type CommitMode = "push" | "replace";
const PROJECTS_VIEW_STORAGE_KEY = "portfolio.projects.view";

type CountedProjectDomainFilterOption = ProjectDomainFilterOption & {
  count: number;
};

const projectsExplorerCopy = {
  fr: {
    searchLabel: "Rechercher un projet ou une technologie",
    searchPlaceholder: "Rechercher un projet, une technologie…",
    clearSearch: "Effacer la recherche",
    viewMode: "Mode d'affichage des projets",
    gridView: "Afficher les projets en grille",
    listView: "Afficher les projets en liste",
    domainFilter: "Filtrer les projets par domaine",
    allDomains: "Tous",
    noFilteredTitle: "Aucun projet trouvé.",
    noFilteredBody: "Essayez une autre recherche ou un autre filtre.",
    noProjectsTitle: "Aucun projet publié.",
    noProjectsBody: "Les projets publiés apparaîtront ici.",
    resetFilters: "Réinitialiser les filtres",
    pagination: "Pagination des projets",
    previous: "Précédent",
    next: "Suivant",
  },
  en: {
    searchLabel: "Search projects or technologies",
    searchPlaceholder: "Search projects or technologies…",
    clearSearch: "Clear search",
    viewMode: "Project view mode",
    gridView: "Show projects as a grid",
    listView: "Show projects as a list",
    domainFilter: "Filter projects by domain",
    allDomains: "All",
    noFilteredTitle: "No project found.",
    noFilteredBody: "Try another search or filter.",
    noProjectsTitle: "No published project.",
    noProjectsBody: "Published projects will appear here.",
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
  heading,
}: ProjectsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resultsRef = useRef<HTMLDivElement>(null);
  const hasSyncedStoredViewRef = useRef(false);
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

  useEffect(() => {
    if (hasSyncedStoredViewRef.current) {
      return;
    }

    hasSyncedStoredViewRef.current = true;
    const searchParams = new URLSearchParams(window.location.search);
    const hasExplicitView = searchParams.has("view");

    if (hasExplicitView) {
      return;
    }

    const storedView = window.localStorage.getItem(
      PROJECTS_VIEW_STORAGE_KEY,
    ) as ProjectViewMode | null;

    if (storedView !== "grid" && storedView !== "list") {
      return;
    }

    if (storedView === initialState.view) {
      return;
    }

    const nextState: ProjectExplorerState = {
      ...initialState,
      page: 1,
      view: storedView,
    };
    const frame = window.requestAnimationFrame(() => {
      setState(nextState);
      router.replace(buildHref(pathname, nextState), { scroll: false });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [initialState, pathname, router]);

  useEffect(() => {
    window.localStorage.setItem(PROJECTS_VIEW_STORAGE_KEY, state.view);
  }, [state.view]);

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

  return (
    <div className="mt-9 sm:mt-10 lg:mt-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,40rem)_minmax(23.75rem,25.75rem)] lg:items-end lg:gap-x-10">
        <header className="max-w-[38rem]">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-[var(--home-accent-2)] sm:text-[0.72rem]">
            {heading.kicker}
          </p>
          <h1
            id="projects-page-title"
            className="mt-2.5 text-[clamp(2.65rem,5vw,3.45rem)] font-semibold leading-[1.03] tracking-[-0.055em] text-[var(--home-text)]"
          >
            {heading.title}
          </h1>
          <p className="mt-3.5 max-w-[37.5rem] text-[0.93rem] leading-[1.66] text-[var(--home-text-secondary)] sm:text-[0.96rem]">
            {heading.description}
          </p>
        </header>

        <div className="flex w-full max-w-[25.75rem] flex-col gap-2.5 justify-self-start lg:justify-self-end">
          <div className="flex w-full items-center gap-2.5">
            <div className="relative flex-1">
              <label htmlFor="project-search" className="sr-only">
                {copy.searchLabel}
              </label>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--home-muted)]"
              />
              <input
                id="project-search"
                type="search"
                value={state.query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-10 w-full rounded-[9px] border border-[rgba(180,177,194,0.1)] bg-[rgba(23,22,28,0.24)] pl-11 pr-11 text-[0.82rem] text-[var(--home-text)] outline-none transition-[border-color,box-shadow,color,background-color] duration-200 placeholder:text-[var(--home-muted)] focus:border-[rgba(97,86,183,0.45)] focus:bg-[rgba(23,22,28,0.32)] focus:shadow-[0_0_0_3px_rgba(97,86,183,0.07)]"
              />
              {state.query ? (
                <button
                  type="button"
                  onClick={() => updateQuery("")}
                  className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[6px] text-[var(--home-muted)] transition duration-200 hover:bg-[rgba(97,86,183,0.06)] hover:text-[var(--home-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
                  aria-label={copy.clearSearch}
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div
              className="inline-flex h-10 rounded-[9px] border border-[rgba(180,177,194,0.1)] bg-[rgba(23,22,28,0.18)] p-1"
              aria-label={copy.viewMode}
            >
              <button
                type="button"
                aria-label={copy.gridView}
                aria-pressed={state.view === "grid"}
                onClick={() => updateView("grid")}
                className={[
                  "grid h-8 w-8 place-items-center rounded-[7px] border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]",
                  state.view === "grid"
                    ? "border-[rgba(97,86,183,0.34)] bg-[rgba(97,86,183,0.1)] text-[var(--home-text)]"
                    : "border-transparent text-[var(--home-muted)] hover:text-[var(--home-text-secondary)]",
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
                  "grid h-8 w-8 place-items-center rounded-[7px] border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]",
                  state.view === "list"
                    ? "border-[rgba(97,86,183,0.34)] bg-[rgba(97,86,183,0.1)] text-[var(--home-text)]"
                    : "border-transparent text-[var(--home-muted)] hover:text-[var(--home-text-secondary)]",
                ].join(" ")}
              >
                <List aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 border-y border-[rgba(180,177,194,0.065)] py-3.5">
        <div
          className="flex gap-6 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                  "group/domain relative inline-flex min-h-8 shrink-0 items-center gap-2 whitespace-nowrap pb-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)]",
                  isActive
                    ? "text-[var(--home-text)]"
                    : "text-[var(--home-text-secondary)] hover:text-[var(--home-text)]",
                ].join(" ")}
              >
                <span className="text-[0.92rem] font-medium">{domain.label}</span>
                <span
                  aria-hidden="true"
                  className={[
                    "text-[0.6rem] font-medium tracking-[0.12em] tabular-nums uppercase transition-colors duration-200",
                    isActive
                      ? "text-[var(--home-muted)]"
                      : "text-[rgb(var(--foreground-rgb)/0.56)] group-hover/domain:text-[rgb(var(--foreground-rgb)/0.72)]",
                  ].join(" ")}
                >
                  {formatProjectFilterCount(domain.count)}
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    "pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left rounded-full bg-[var(--home-accent-2)] transition duration-200",
                    isActive
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0 group-hover/domain:scale-x-100 group-hover/domain:opacity-40",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div ref={resultsRef} className="scroll-mt-8">
        <div className="mt-4 flex items-center justify-between gap-4">
          <p
            aria-live="polite"
            className="text-[0.74rem] font-medium tracking-[0.06em] text-[var(--home-muted)] sm:text-[0.76rem]"
          >
            {formatProjectsCount(filteredProjects.length, locale)}
          </p>

          {hasActiveFilters(state) ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-8 items-center gap-2 text-[0.74rem] font-medium text-[var(--home-text-secondary)] transition duration-200 hover:text-[var(--home-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              {copy.resetFilters}
            </button>
          ) : null}
        </div>

        {pagination.items.length > 0 ? (
          <div
            className={[
              "mt-4.5",
              state.view === "grid"
                ? "grid items-stretch gap-4 md:grid-cols-2 lg:gap-[1.1rem] xl:grid-cols-3"
                : "grid gap-3 sm:gap-3.5",
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
          <div className="mt-8 border-t border-[rgba(180,177,194,0.065)] pt-8">
            <h2 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-[var(--home-text)]">
              {hasActiveFilters(state)
                ? copy.noFilteredTitle
                : copy.noProjectsTitle}
            </h2>
            <p className="mt-2 max-w-[34rem] text-[0.86rem] leading-6 text-[var(--home-text-secondary)]">
              {hasActiveFilters(state)
                ? copy.noFilteredBody
                : copy.noProjectsBody}
            </p>
            {hasActiveFilters(state) ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex min-h-8 items-center gap-2 text-[0.78rem] font-medium text-[var(--home-text-secondary)] transition duration-200 hover:text-[var(--home-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
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
            className="min-h-9 rounded-[8px] border border-[rgba(180,177,194,0.1)] px-4 text-[0.76rem] font-medium text-[var(--home-text-secondary)] transition duration-200 hover:border-[rgba(139,128,217,0.28)] hover:text-[var(--home-text)] disabled:cursor-not-allowed disabled:opacity-35"
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
                  "grid h-9 w-9 place-items-center rounded-[8px] border text-[0.76rem] font-medium transition duration-200",
                  pagination.currentPage === page
                    ? "border-[rgba(97,86,183,0.34)] bg-[rgba(97,86,183,0.1)] text-[var(--home-text)]"
                    : "border-[rgba(180,177,194,0.1)] text-[var(--home-text-secondary)] hover:border-[rgba(139,128,217,0.28)] hover:text-[var(--home-text)]",
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
            className="min-h-9 rounded-[8px] border border-[rgba(180,177,194,0.1)] px-4 text-[0.76rem] font-medium text-[var(--home-text-secondary)] transition duration-200 hover:border-[rgba(139,128,217,0.28)] hover:text-[var(--home-text)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {copy.next}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
