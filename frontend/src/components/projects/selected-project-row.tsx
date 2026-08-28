"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { ProjectGlyph } from "@/components/projects/project-glyph";
import { usePreferences } from "@/components/providers/preferences-provider";
import { getProjectContent } from "@/lib/projects";
import type {
  Project,
  ProjectHomeIconKey,
  SupportedLocale,
} from "@/types/project";

type SelectedProjectRowProps = {
  project: Project;
  index: number;
  locale?: SupportedLocale;
};

const MAX_HOME_CATEGORIES = 3;

const selectedProjectCopy = {
  fr: {
    actionFallback: "Voir le projet",
    externalProjectSuffix:
      "ouvrir le dépôt GitHub du projet dans un nouvel onglet",
  },
  en: {
    actionFallback: "View project",
    externalProjectSuffix:
      "open the project GitHub repository in a new tab",
  },
} as const satisfies Record<
  SupportedLocale,
  {
    actionFallback: string;
    externalProjectSuffix: string;
  }
>;

function formatProjectIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function getHomeCategories(project: Project, locale: SupportedLocale) {
  const overrides =
    locale === "fr"
      ? project.homeCategoryNames?.fr
      : project.homeCategoryNames?.en ?? project.homeCategoryNames?.fr;

  if (overrides?.length) {
    return overrides.slice(0, MAX_HOME_CATEGORIES);
  }

  return project.categories
    .slice(0, MAX_HOME_CATEGORIES)
    .map((category) => category.name);
}

function resolveProjectIconKey(project: Project): ProjectHomeIconKey {
  if (project.homeIconKey) {
    return project.homeIconKey;
  }

  return "medical-rag";
}

export function SelectedProjectRow({
  project,
  index,
  locale = "fr",
}: SelectedProjectRowProps) {
  const systemReducedMotion = useReducedMotion();
  const { reduceMotion } = usePreferences();
  const reducedMotion = systemReducedMotion || reduceMotion;
  const copy = selectedProjectCopy[locale];
  const content = getProjectContent(project, locale);
  const githubLink = project.links.find((link) => link.type === "github");
  const projectHref = githubLink?.url;
  const categories = getHomeCategories(project, locale);
  const iconKey = resolveProjectIconKey(project);

  const motionProps = reducedMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 6 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.28 },
      };

  return (
    <motion.article
      {...motionProps}
      transition={{
        duration: 0.58,
        ease: [0.22, 1, 0.36, 1],
        delay: reducedMotion ? 0 : index * 0.05,
      }}
      className="project-interactive-row editorial-interactive-row group -mx-4 grid grid-cols-[3.55rem_minmax(0,1fr)] gap-x-4 gap-y-4 px-4 py-[1.05rem] md:grid-cols-[3rem_4.9rem_minmax(0,1fr)] md:items-center md:gap-x-5 md:gap-y-0 lg:-mx-5 lg:grid-cols-[3.25rem_5.5rem_minmax(0,1fr)_5.5rem] lg:px-5 lg:py-[1.12rem]"
    >
      <div className="col-span-2 flex items-center justify-between md:hidden">
          <p className="selected-project-index text-[1.02rem] font-normal leading-none tracking-[-0.02em] text-[var(--accent-muted)]">
            {formatProjectIndex(index)}
          </p>
        {project.year ? (
          <p className="selected-project-year text-[0.68rem] font-medium tracking-[0.12em] text-[var(--foreground-muted)] opacity-70">
            {project.year}
          </p>
        ) : null}
      </div>

      <div className="hidden md:flex md:items-start md:justify-start lg:pt-1">
        <p className="selected-project-index text-[1.32rem] font-normal leading-none tracking-[-0.02em] text-[var(--accent-muted)]">
          {formatProjectIndex(index)}
        </p>
      </div>

      <div className="flex items-start justify-start md:items-center">
        <ProjectGlyph iconKey={iconKey} />
      </div>

      <div className="editorial-interactive-content min-w-0 md:pr-2">
        <h3 className="selected-project-title line-clamp-2 max-w-[42rem] text-[1.12rem] font-semibold leading-[1.2] tracking-[-0.03em] text-[var(--foreground)] md:text-[1.22rem] lg:text-[1.3rem]">
          {content.title}
        </h3>

        <p className="selected-project-description mt-1.5 line-clamp-2 max-w-[43rem] text-[0.87rem] leading-[1.6] text-[var(--foreground-muted)] md:text-[0.9rem]">
          {content.shortDescription}
        </p>

        {categories.length > 0 ? (
          <p className="selected-project-categories project-meta-line mt-2 text-[0.7rem] font-medium tracking-[0.08em] text-[var(--accent-muted)] opacity-80 md:text-[0.72rem]">
            {categories.join(" · ")}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-5 lg:hidden">
          {project.year ? (
            <p className="selected-project-year hidden text-[0.68rem] font-medium tracking-[0.12em] text-[var(--foreground-muted)] opacity-70 md:block">
              {project.year}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          <ProjectLink
            href={projectHref}
            label={githubLink?.label ?? copy.actionFallback}
            title={content.title}
            externalSuffix={copy.externalProjectSuffix}
          />
        </div>
      </div>

      <div className="hidden h-full flex-col items-end justify-between gap-5 pt-1 lg:flex">
        {project.year ? (
          <p className="selected-project-year text-[0.68rem] font-medium tracking-[0.12em] text-[var(--foreground-muted)] opacity-70">
            {project.year}
          </p>
        ) : (
          <span aria-hidden="true" />
        )}
        <ProjectLink
          href={projectHref}
          label={githubLink?.label ?? copy.actionFallback}
          title={content.title}
          externalSuffix={copy.externalProjectSuffix}
        />
      </div>
    </motion.article>
  );
}

function ProjectLink({
  href,
  label,
  title,
  externalSuffix,
}: {
  href: string | undefined;
  label: string;
  title: string;
  externalSuffix: string;
}) {
  if (!href) {
    return (
      <span
        aria-label={`${label} - ${title}`}
        className="inline-flex min-h-8 items-center gap-1.5 border-b border-[rgb(var(--accent-rgb)/0.22)] pb-1 text-[0.74rem] font-medium tracking-[0.04em] text-[var(--foreground-muted)] opacity-70"
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
      aria-label={`${label} - ${title} - ${externalSuffix}`}
      className="selected-project-link inline-flex min-h-8 items-center gap-1.5 border-b border-[rgb(var(--accent-rgb)/0.42)] pb-1 text-[0.74rem] font-medium tracking-[0.04em] text-[var(--foreground)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--focus-ring-offset)]"
    >
      <span>{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="selected-project-link-icon h-3.5 w-3.5"
      />
    </Link>
  );
}
