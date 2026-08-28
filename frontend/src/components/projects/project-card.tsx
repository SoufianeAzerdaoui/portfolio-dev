"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";

import { ProjectGlyph } from "@/components/projects/project-glyph";
import {
  getProjectContent,
  resolveProjectMediaUrl,
} from "@/lib/projects";
import type {
  Project,
  ProjectDomain,
  ProjectHomeIconKey,
  ProjectViewMode,
  SupportedLocale,
} from "@/types/project";

type ProjectCardProps = {
  project: Project;
  view: ProjectViewMode;
  locale?: SupportedLocale;
};

type ProjectMetaTone = "accent" | "neutral";

const projectCardCopy = {
  fr: {
    categories: "Catégories du projet",
    technologies: "Technologies principales",
    actionFallback: "GitHub",
    externalProjectSuffix:
      "ouvrir le dépôt GitHub dans un nouvel onglet",
  },
  en: {
    categories: "Project categories",
    technologies: "Main technologies",
    actionFallback: "GitHub",
    externalProjectSuffix: "open the GitHub repository in a new tab",
  },
} as const satisfies Record<
  SupportedLocale,
  {
    categories: string;
    technologies: string;
    actionFallback: string;
    externalProjectSuffix: string;
  }
>;

function resolveProjectGlyphKey(project: Project): ProjectHomeIconKey | null {
  if (project.homeIconKey) {
    return project.homeIconKey;
  }

  const primaryCategory = project.categories[0]?.slug;

  const categoryFallbacks: Partial<Record<string, ProjectHomeIconKey>> = {
    rag: "medical-rag",
    "speech-ai": "call-center",
    "recommender-systems": "recommendation",
    "time-series": "algorithmic-trading",
    "credit-risk": "bank-decision",
    "education-data": "school-analytics",
    "health-data": "nutrition-analysis",
    healthtech: "blood-donation",
    "big-data": "realtime-tracking",
  };

  if (primaryCategory && categoryFallbacks[primaryCategory]) {
    return categoryFallbacks[primaryCategory];
  }

  const domainFallbacks: Record<ProjectDomain, ProjectHomeIconKey> = {
    "ai-ml": "medical-rag",
    "data-analytics": "school-analytics",
    "data-engineering": "realtime-tracking",
    "software-engineering": "blood-donation",
  };

  return domainFallbacks[project.domain];
}

const LIGHT_COVER_PROJECT_SLUGS = new Set([
  "syndismart-ai",
  "callcenter-frustration-ai",
  "real-time-ecommerce-activity-tracking",
  "personalized-recommendation-system",
  "bank-credit-decision-support-system",
  "alcohol-school-performance-analysis",
  "nutrition-atherosclerosis-analysis",
  "blood-donation-platform",
]);

function formatTagLine(tags: readonly string[], limit: number) {
  const visible = tags.slice(0, limit);
  const hiddenCount = Math.max(0, tags.length - visible.length);

  return {
    text: visible.join(" · "),
    hiddenCount,
  };
}

function ProjectAction({
  project,
  locale,
}: {
  project: Project;
  locale: SupportedLocale;
}) {
  const copy = projectCardCopy[locale];
  const content = getProjectContent(project, locale);
  const githubLink = project.links.find((link) => link.type === "github");
  const href = githubLink?.url;
  const label = githubLink?.label ?? copy.actionFallback;

  if (!href) {
    return (
      <span
        aria-label={`${label} - ${content.title}`}
        className="inline-flex min-h-8 items-center gap-1.5 border-b border-[rgb(var(--accent-rgb)/0.22)] pb-1 text-[0.74rem] font-medium tracking-[0.04em] text-[var(--home-muted)] opacity-70"
      >
        <span>{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} - ${content.title} - ${copy.externalProjectSuffix}`}
      className="selected-project-link inline-flex min-h-8 items-center gap-1.5 border-b border-[rgb(var(--accent-rgb)/0.42)] pb-1 text-[0.74rem] font-medium tracking-[0.04em] text-[var(--home-text-secondary)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-bg-0)]"
    >
      <span>{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="selected-project-link-icon h-3.5 w-3.5"
      />
    </Link>
  );
}

function GridProjectMedia({
  project,
}: {
  project: Project;
}) {
  const coverImage = project.coverImage;
  const glyphKey = resolveProjectGlyphKey(project);
  const isLightCover = LIGHT_COVER_PROJECT_SLUGS.has(project.slug);

  return (
    <div className="relative overflow-hidden rounded-[9px] border border-[rgba(180,177,194,0.075)] bg-[rgba(8,13,26,0.34)]">
      <div className="relative h-[112px] sm:h-[114px] xl:h-[118px]">
        {coverImage ? (
          <>
            <Image
              src={resolveProjectMediaUrl(coverImage)}
              alt={coverImage.alt}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
              className={[
                "object-contain p-3 opacity-[0.94]",
                isLightCover ? "brightness-[0.95] saturate-[0.96]" : "",
              ].join(" ")}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: isLightCover
                  ? "linear-gradient(180deg, rgba(23,22,28,0.04), rgba(23,22,28,0.08))"
                  : "var(--cover-overlay)",
              }}
            />
          </>
        ) : (
          <div className="grid h-full place-items-center">
            {glyphKey ? (
              <div className="scale-[0.9]">
                <ProjectGlyph iconKey={glyphKey} />
              </div>
            ) : (
              <FolderOpen
                aria-hidden="true"
                className="h-7 w-7 text-[var(--home-accent-2)] opacity-45"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectMetaLine({
  label,
  hiddenCount,
  ariaLabel,
  tone = "accent",
}: {
  label: string;
  hiddenCount: number;
  ariaLabel: string;
  tone?: ProjectMetaTone;
}) {
  if (!label && hiddenCount <= 0) {
    return null;
  }

  return (
    <p
      aria-label={ariaLabel}
      className={[
        "project-meta-line text-[0.62rem] font-medium tracking-[0.1em]",
        tone === "accent"
          ? "text-[var(--home-accent-2)] opacity-[0.9]"
          : "text-[var(--home-muted)] opacity-[0.92]",
      ].join(" ")}
    >
      {label}
      {hiddenCount > 0 ? ` +${hiddenCount}` : ""}
    </p>
  );
}

function GridProjectCard({
  project,
  locale,
}: {
  project: Project;
  locale: SupportedLocale;
}) {
  const copy = projectCardCopy[locale];
  const content = getProjectContent(project, locale);
  const categories = formatTagLine(
    project.categories.map((category) => category.name),
    3,
  );
  const technologies = formatTagLine(
    project.technologies.map((technology) => technology.name),
    3,
  );

  return (
    <article className="project-interactive-surface editorial-interactive-surface group flex h-full min-h-[18.1rem] flex-col gap-3.5 bg-[rgba(32,33,38,0.1)] p-3.5 sm:min-h-[18.4rem] sm:p-4">
      <GridProjectMedia project={project} />

      <div className="editorial-interactive-content flex min-w-0 flex-1 flex-col">
        <ProjectMetaLine
          ariaLabel={copy.categories}
          label={categories.text}
          hiddenCount={categories.hiddenCount}
        />

        <h2 className="project-card-title mt-1.5 line-clamp-2 text-[1.07rem] font-semibold leading-[1.22] tracking-[-0.03em] text-[var(--home-text)] sm:text-[1.11rem]">
          {content.title}
        </h2>

        <p className="project-card-description mt-1.5 line-clamp-3 text-[0.81rem] leading-[1.58] text-[rgb(var(--foreground-rgb)/0.76)] sm:text-[0.82rem]">
          {content.shortDescription}
        </p>

        <div className="mt-auto flex flex-col gap-2.5 pt-3.5">
          <ProjectMetaLine
            ariaLabel={copy.technologies}
            label={technologies.text}
            hiddenCount={technologies.hiddenCount}
            tone="neutral"
          />
          <div className="flex items-center justify-between gap-4">
            {project.year ? (
              <p className="project-card-year text-[0.68rem] font-medium tracking-[0.12em] text-[var(--home-muted)]">
                {project.year}
              </p>
            ) : (
              <span aria-hidden="true" />
            )}
            <ProjectAction project={project} locale={locale} />
          </div>
        </div>
      </div>
    </article>
  );
}

function ListProjectCard({
  project,
  locale,
}: {
  project: Project;
  locale: SupportedLocale;
}) {
  const copy = projectCardCopy[locale];
  const content = getProjectContent(project, locale);
  const categories = formatTagLine(
    project.categories.map((category) => category.name),
    3,
  );
  const technologies = formatTagLine(
    project.technologies.map((technology) => technology.name),
    3,
  );
  const glyphKey = resolveProjectGlyphKey(project);

  return (
    <article className="project-interactive-row editorial-interactive-row group -mx-3.5 grid grid-cols-[3.2rem_minmax(0,1fr)] gap-x-3.5 gap-y-3.5 px-3.5 py-3.5 sm:-mx-4 sm:px-4 md:grid-cols-[4.2rem_minmax(0,1fr)_5rem] md:items-center md:gap-y-0">
      <div className="flex items-start justify-start md:items-center">
        {glyphKey ? (
          <ProjectGlyph iconKey={glyphKey} />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-[3.2rem] w-[3.2rem] place-items-center rounded-full border border-[rgba(180,177,194,0.085)] bg-[rgba(8,13,26,0.2)] md:h-[4.2rem] md:w-[4.2rem]"
          >
            <FolderOpen className="h-4 w-4 text-[var(--home-accent-2)] opacity-55 md:h-[1.15rem] md:w-[1.15rem]" />
          </div>
        )}
      </div>

      <div className="editorial-interactive-content min-w-0 md:pr-3">
        <h2 className="project-card-title line-clamp-2 text-[1.06rem] font-semibold leading-[1.18] tracking-[-0.03em] text-[var(--home-text)] md:text-[1.12rem]">
          {content.title}
        </h2>
        <p className="project-card-description mt-1.5 line-clamp-2 text-[0.81rem] leading-[1.56] text-[rgb(var(--foreground-rgb)/0.75)] md:text-[0.82rem]">
          {content.shortDescription}
        </p>
        <div className="mt-2.5 flex flex-col gap-1.5 md:flex-row md:flex-nowrap md:items-center md:gap-x-4 md:gap-y-0">
          <ProjectMetaLine
            ariaLabel={copy.categories}
            label={categories.text}
            hiddenCount={categories.hiddenCount}
          />
          <ProjectMetaLine
            ariaLabel={copy.technologies}
            label={technologies.text}
            hiddenCount={technologies.hiddenCount}
            tone="neutral"
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-4 md:hidden">
          {project.year ? (
            <p className="project-card-year text-[0.68rem] font-medium tracking-[0.12em] text-[var(--home-muted)]">
              {project.year}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          <ProjectAction project={project} locale={locale} />
        </div>
      </div>

      <div className="hidden h-full flex-col items-end justify-between gap-3 pt-0.5 md:flex">
        {project.year ? (
          <p className="project-card-year text-[0.68rem] font-medium tracking-[0.12em] text-[var(--home-muted)]">
            {project.year}
          </p>
        ) : (
          <span aria-hidden="true" />
        )}
        <ProjectAction project={project} locale={locale} />
      </div>
    </article>
  );
}

export function ProjectCard({ project, view, locale = "fr" }: ProjectCardProps) {
  if (view === "list") {
    return <ListProjectCard project={project} locale={locale} />;
  }

  return <GridProjectCard project={project} locale={locale} />;
}
