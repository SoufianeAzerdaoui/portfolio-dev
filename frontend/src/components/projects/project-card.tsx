import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";

import {
  getProjectContent,
  resolveProjectMediaUrl,
} from "@/lib/projects";
import type { Project, ProjectViewMode, SupportedLocale } from "@/types/project";

type ProjectCardProps = {
  project: Project;
  view: ProjectViewMode;
  locale?: SupportedLocale;
};

const projectCardCopy = {
  fr: {
    featured: "Projet phare",
    categories: "Catégories du projet",
    technologies: "Technologies principales",
    actionFallback: "Voir le projet",
    externalProjectSuffix:
      "ouvrir le dépôt GitHub dans un nouvel onglet",
  },
  en: {
    featured: "Featured project",
    categories: "Project categories",
    technologies: "Main technologies",
    actionFallback: "View project",
    externalProjectSuffix: "open the GitHub repository in a new tab",
  },
} as const satisfies Record<
  SupportedLocale,
  {
    featured: string;
    categories: string;
    technologies: string;
    actionFallback: string;
    externalProjectSuffix: string;
  }
>;

function ProjectPreview({
  project,
  view,
  locale,
}: {
  project: Project;
  view: ProjectViewMode;
  locale: SupportedLocale;
}) {
  const coverImage = project.coverImage;
  const isList = view === "list";
  const copy = projectCardCopy[locale];

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-[10px] border border-[var(--border-muted)] bg-[var(--media-frame)]",
      ].join(" ")}
    >
      <div
        className={[
          "relative grid place-items-center bg-[radial-gradient(circle_at_50%_20%,rgb(var(--accent-rgb)/0.08),transparent_34%),linear-gradient(135deg,var(--surface-soft),var(--media-frame))]",
          isList
            ? "aspect-[3/2]"
            : "aspect-[16/9] md:h-[9.75rem] md:aspect-auto xl:h-[10.25rem] 2xl:h-[10.75rem]",
        ].join(" ")}
      >
        {coverImage ? (
          <Image
            src={resolveProjectMediaUrl(coverImage)}
            alt={coverImage.alt}
            fill
            sizes={
              isList
                ? "(min-width: 768px) 24vw, 92vw"
                : "(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            }
            className="object-contain p-3 opacity-95 transition duration-300 group-hover:scale-[1.01] group-hover:opacity-100 motion-reduce:transition-none"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <FolderOpen
              aria-hidden="true"
              className="h-8 w-8 text-[var(--accent-muted)] opacity-45"
            />
          </div>
        )}
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--cover-overlay)" }}
      />
      {project.featured ? (
        <div className="absolute left-3 top-3 rounded-full border border-[rgb(var(--accent-rgb)/0.22)] bg-[var(--surface-elevated)] px-2 py-0.5 text-[0.52rem] font-medium uppercase tracking-[0.13em] text-[var(--foreground-muted)] backdrop-blur-sm">
          {copy.featured}
        </div>
      ) : null}
    </div>
  );
}

function ProjectTags({
  project,
  compact = false,
  locale,
}: {
  project: Project;
  compact?: boolean;
  locale: SupportedLocale;
}) {
  const visibleCategories = project.categories.slice(0, 3);
  const hiddenCount = Math.max(0, project.categories.length - visibleCategories.length);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={projectCardCopy[locale].categories}
      className={["flex flex-wrap", compact ? "gap-1.5" : "gap-2"].join(" ")}
    >
      {visibleCategories.map((category) => (
        <li
          key={category.id}
          className={[
            "rounded-full border border-[var(--border-muted)] bg-[var(--surface-elevated)] font-medium uppercase tracking-[0.12em] text-[var(--accent-muted)]",
            compact ? "px-2 py-0.5 text-[0.58rem]" : "px-2.5 py-1 text-[0.62rem]",
          ].join(" ")}
        >
          {category.name}
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li
          className={[
            "rounded-full border border-[var(--border-muted)] bg-[var(--surface-elevated)] font-medium text-[var(--accent-muted)]",
            compact ? "px-2 py-0.5 text-[0.58rem]" : "px-2.5 py-1 text-[0.62rem]",
          ].join(" ")}
        >
          +{hiddenCount}
        </li>
      ) : null}
    </ul>
  );
}

function ProjectTechStack({
  project,
  compact = false,
  locale,
}: {
  project: Project;
  compact?: boolean;
  locale: SupportedLocale;
}) {
  const visibleTech = project.technologies.slice(0, 4);
  const hiddenCount = Math.max(0, project.technologies.length - visibleTech.length);

  if (visibleTech.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label={projectCardCopy[locale].technologies}
      className={["flex flex-wrap", compact ? "gap-1.5" : "gap-2"].join(" ")}
    >
      {visibleTech.map((technology) => (
        <li
          key={technology.id}
          className={[
            "rounded-full bg-[var(--surface-soft)] font-medium text-[var(--foreground-secondary)]",
            compact ? "px-2 py-0.5 text-[0.64rem]" : "px-2.5 py-1 text-[0.7rem]",
          ].join(" ")}
        >
          {technology.name}
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li
          className={[
            "rounded-full bg-[var(--surface-soft)] font-medium text-[var(--foreground-secondary)]",
            compact ? "px-2 py-0.5 text-[0.64rem]" : "px-2.5 py-1 text-[0.7rem]",
          ].join(" ")}
        >
          +{hiddenCount}
        </li>
      ) : null}
    </ul>
  );
}

function ProjectAction({
  project,
  compact = false,
  locale,
}: {
  project: Project;
  compact?: boolean;
  locale: SupportedLocale;
}) {
  const copy = projectCardCopy[locale];
  const content = getProjectContent(project, locale);
  const githubLink = project.links.find((link) => link.type === "github");
  const href = githubLink?.url ?? `/projects/${project.slug}`;
  const isExternal = Boolean(githubLink);
  const label = githubLink?.label ?? copy.actionFallback;

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={
        isExternal
          ? `${label} - ${content.title} - ${copy.externalProjectSuffix}`
          : `${label} ${content.title}`
      }
      className={[
        "group/link inline-flex items-center gap-2 font-medium text-[var(--foreground)] transition duration-200 hover:text-[var(--accent-strong)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--focus-ring-offset)]",
        compact ? "text-[0.76rem]" : "text-[0.78rem]",
      ].join(" ")}
    >
      <span>{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className={[
          "transition-transform duration-200 group-hover/link:translate-x-[3px] motion-reduce:transition-none",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
        ].join(" ")}
      />
    </Link>
  );
}

export function ProjectCard({ project, view, locale = "fr" }: ProjectCardProps) {
  const isList = view === "list";
  const content = getProjectContent(project, locale);

  return (
    <article
      className={[
        "group relative overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:border-[rgb(var(--accent-rgb)/0.22)] hover:bg-[var(--surface-strong)] motion-reduce:transition-none",
        isList
          ? "grid gap-5 rounded-[14px] p-3 md:grid-cols-[minmax(13rem,0.34fr)_minmax(0,1fr)]"
          : "flex h-full min-h-[27rem] flex-col rounded-[13px] p-2.5",
      ].join(" ")}
    >
      <ProjectPreview project={project} view={view} locale={locale} />

      <div className={isList ? "flex min-w-0 flex-col py-1" : "flex flex-1 min-w-0 flex-col px-2 pb-2 pt-3"}>
        <ProjectTags project={project} compact={!isList} locale={locale} />

        <h2
          className={[
            "font-semibold leading-[1.16] tracking-[-0.025em] text-[var(--foreground)]",
            isList
              ? "mt-2 text-[clamp(1.25rem,2.2vw,1.55rem)]"
              : "mt-2 line-clamp-2 text-[clamp(1.12rem,1.34vw,1.24rem)] leading-[1.22]",
          ].join(" ")}
        >
          {content.title}
        </h2>

        <p
          className={[
            "text-[var(--foreground-muted)]",
            isList
              ? "mt-2 line-clamp-4 text-[0.9rem] leading-6"
              : "mt-2.5 line-clamp-3 text-[0.86rem] leading-[1.6]",
          ].join(" ")}
        >
          {content.shortDescription}
        </p>

        <div className={isList ? "mt-3.5 flex flex-1 flex-col justify-end gap-4" : "mt-auto flex flex-col gap-3 pt-5"}>
          <ProjectTechStack
            project={project}
            compact={!isList}
            locale={locale}
          />
          <div className="flex items-center justify-between gap-4">
            {project.year ? (
              <p
                className={[
                  "font-medium tracking-[0.12em] text-[var(--foreground-subtle)]",
                  isList ? "text-[0.72rem]" : "text-[0.7rem]",
                ].join(" ")}
              >
                {project.year}
              </p>
            ) : (
              <span aria-hidden="true" />
            )}
            <ProjectAction
              project={project}
              compact={!isList}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
