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
        label: domain.label,
        count: domainCounts.get(domain.id) ?? 0,
      })),
    [domainCounts, domains],
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
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
              Rechercher un projet ou une technologie
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]/72"
            />
            <input
              id="project-search"
              type="search"
              value={state.query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Rechercher un projet, technologie..."
              className="h-11 w-full rounded-[9px] border border-slate-400/12 bg-[#080D1A]/58 pl-11 pr-11 text-[0.82rem] text-slate-100 outline-none transition duration-200 placeholder:text-[#64748B] focus:border-[#7C8CFF]/70 focus:ring-2 focus:ring-[#7C8CFF]/10"
            />
            {state.query ? (
              <button
                type="button"
                onClick={() => updateQuery("")}
                className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#94A3B8] transition duration-200 hover:bg-slate-400/10 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1A]"
                aria-label="Effacer la recherche"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div
            className="inline-flex h-11 rounded-[9px] border border-slate-400/12 bg-[#080D1A]/52 p-1"
            aria-label="Mode d'affichage des projets"
          >
            <button
              type="button"
              aria-label="Afficher les projets en grille"
              aria-pressed={state.view === "grid"}
              onClick={() => updateView("grid")}
              className={[
                "grid h-9 w-10 place-items-center rounded-[7px] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1A]",
                state.view === "grid"
                  ? "border border-[#7C8CFF]/45 bg-[#7C8CFF]/12 text-slate-50"
                  : "text-[#94A3B8] hover:text-slate-50",
              ].join(" ")}
            >
              <Grid2X2 aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Afficher les projets en liste"
              aria-pressed={state.view === "list"}
              onClick={() => updateView("list")}
              className={[
                "grid h-9 w-10 place-items-center rounded-[7px] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1A]",
                state.view === "list"
                  ? "border border-[#7C8CFF]/45 bg-[#7C8CFF]/12 text-slate-50"
                  : "text-[#94A3B8] hover:text-slate-50",
              ].join(" ")}
            >
              <List aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 border-y border-slate-400/10 py-4">
        <div className="sm:hidden">
          <label htmlFor="project-domain-filter" className="sr-only">
            Filtrer les projets par domaine
          </label>
          <div className="relative">
            <select
              id="project-domain-filter"
              value={state.domain}
              onChange={(event) =>
                updateDomain(resolveSelectedDomain(event.target.value))
              }
              className="h-11 w-full appearance-none rounded-[8px] border border-slate-400/12 bg-[#080D1A]/58 px-4 pr-10 text-[0.88rem] font-medium text-[#E2E8F0] outline-none transition duration-200 focus:border-[#7C8CFF]/70 focus:ring-2 focus:ring-[#7C8CFF]/10"
            >
              {domainOptions.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.id === "all"
                    ? `Tous les domaines - ${formatProjectFilterCount(domain.count)}`
                    : `${domain.label} - ${formatProjectFilterCount(domain.count)}`}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]"
            />
          </div>
        </div>
        <div
          className="hidden flex-wrap items-center gap-x-8 gap-y-3 sm:flex lg:gap-x-10"
          role="group"
          aria-label="Filtrer les projets par domaine"
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
                )}`}
                onClick={() => updateDomain(domain.id)}
                className={[
                  "group/domain relative inline-flex min-h-9 items-center gap-2 whitespace-nowrap pb-2 text-[0.84rem] font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] md:text-[0.88rem]",
                  isActive
                    ? "text-[#F8FAFC]"
                    : "text-[#94A3B8]/75 hover:text-[#CBD5E1]",
                ].join(" ")}
              >
                <span>{domain.label}</span>
                <span
                  aria-hidden="true"
                  className={[
                    "text-[0.66rem] font-normal tracking-[0.04em] tabular-nums transition duration-200",
                    isActive
                      ? "text-[#CBD5E1]/78"
                      : "text-[#94A3B8]/50 group-hover/domain:text-[#CBD5E1]/64",
                  ].join(" ")}
                >
                  {formatProjectFilterCount(domain.count)}
                </span>
                <span
                  aria-hidden="true"
                  className={[
                    "pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left rounded-full bg-[#7C8CFF] transition duration-200",
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
          className="mt-5 text-[0.78rem] font-medium text-[#94A3B8]"
        >
          {formatProjectsCount(filteredProjects.length)}
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
          <div className="mt-5 rounded-[14px] border border-slate-400/11 bg-[#090F1C]/45 px-6 py-14 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
            <FolderOpen
              aria-hidden="true"
              className="mx-auto h-9 w-9 text-[#7C8CFF]/55"
            />
            <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-50">
              {hasActiveFilters(state)
                ? "Aucun projet ne correspond à ces critères."
                : "Aucun projet publié pour le moment."}
            </h2>
            <p className="mx-auto mt-3 max-w-[36rem] text-sm leading-6 text-[#94A3B8]">
              {hasActiveFilters(state)
                ? "Modifie la recherche ou réinitialise les filtres pour retrouver la collection complète."
                : "Les projets publiés seront bientôt disponibles."}
            </p>
            {hasActiveFilters(state) ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-[#7C8CFF]/36 bg-[rgba(8,13,26,0.5)] px-5 text-[0.82rem] font-medium text-slate-100 transition duration-200 hover:border-[#7C8CFF]/70 hover:bg-[#3F63DD]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1A]"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                Réinitialiser les filtres
              </button>
            ) : null}
          </div>
        )}
      </div>

      {pagination.pageCount > 1 ? (
        <nav
          aria-label="Pagination des projets"
          className="mt-8 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => updatePage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="min-h-10 rounded-[7px] border border-slate-400/12 px-4 text-[0.78rem] font-medium text-[#AAB7C8] transition duration-200 hover:border-[#7C8CFF]/45 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Précédent
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
                    ? "border-[#7C8CFF]/45 bg-[#7C8CFF]/16 text-slate-50"
                    : "border-slate-400/12 text-[#AAB7C8] hover:border-[#7C8CFF]/45 hover:text-slate-50",
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
            className="min-h-10 rounded-[7px] border border-slate-400/12 px-4 text-[0.78rem] font-medium text-[#AAB7C8] transition duration-200 hover:border-[#7C8CFF]/45 hover:text-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
          </button>
        </nav>
      ) : null}
    </div>
  );
}
