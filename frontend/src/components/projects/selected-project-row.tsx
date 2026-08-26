"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { usePreferences } from "@/components/providers/preferences-provider";
import {
  getProjectContent,
  resolveProjectMediaUrl,
} from "@/lib/projects";
import {
  TechnologyIcon,
  getTechnologyIconSrc,
} from "@/components/projects/technology-icon";
import type { Project, ProjectTechnology, SupportedLocale } from "@/types/project";

type SelectedProjectRowProps = {
  project: Project;
  index: number;
  locale?: SupportedLocale;
};

const CATEGORY_PRIORITY = [
  "rag",
  "nlp",
  "multimodal-ai",
  "generative-ai",
] as const;

const MAX_HOME_TECHNOLOGIES = 4;

const selectedProjectCopy = {
  fr: {
    categories: "Catégories principales",
    technologies: "Technologies principales",
    actionFallback: "Voir le projet",
    externalProjectSuffix:
      "ouvrir le dépôt GitHub dans un nouvel onglet",
  },
  en: {
    categories: "Main categories",
    technologies: "Main technologies",
    actionFallback: "View project",
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

function getPriorityNames<T extends { name: string; slug: string }>(
  items: readonly T[],
  priority: readonly string[],
  limit: number,
) {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const prioritized = priority
    .map((slug) => bySlug.get(slug))
    .filter((item): item is T => Boolean(item));
  const remaining = items.filter(
    (item) => !prioritized.some((priorityItem) => priorityItem.slug === item.slug),
  );

  return [...prioritized, ...remaining]
    .slice(0, limit)
    .map((item) => item.name);
}

function formatProjectIndex(index: number) {
  return String(index + 1).padStart(2, "0");
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
  const coverImage = project.coverImage;
  const githubLink = project.links.find((link) => link.type === "github");
  const projectHref = githubLink?.url ?? `/projects/${project.slug}`;
  const projectLinkTarget = githubLink ? "github" : "details";
  const categories = getPriorityNames(project.categories, CATEGORY_PRIORITY, 3);
  const technologies = project.technologies.slice(0, MAX_HOME_TECHNOLOGIES);

  const motionProps = reducedMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 6 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
      };

  return (
    <motion.article
      {...motionProps}
      transition={{
        duration: 0.58,
        ease: [0.22, 1, 0.36, 1],
        delay: reducedMotion ? 0 : index * 0.06,
      }}
      className="editorial-interactive-row -mx-4 grid cursor-default px-4 py-[1.625rem] md:grid-cols-[2.75rem_minmax(12rem,15.5rem)_minmax(0,1fr)] md:gap-x-6 lg:-mx-5 lg:grid-cols-[3.5rem_minmax(14rem,18rem)_minmax(0,1fr)_8rem] lg:items-start lg:gap-x-7 lg:px-5 xl:grid-cols-[3.5rem_minmax(15rem,19.5rem)_minmax(0,1fr)_8.5rem]"
    >
      <div className="mb-5 flex items-center justify-between md:mb-0 md:block">
        <p className="selected-project-index text-[1.15rem] font-normal leading-none tracking-[-0.02em] text-[var(--accent-muted)] md:text-[1.28rem]">
          {formatProjectIndex(index)}
        </p>
        {project.year ? (
          <p className="text-[0.72rem] font-medium tracking-[0.08em] text-[var(--foreground-muted)] opacity-70 md:hidden">
            {project.year}
          </p>
        ) : null}
      </div>

      <div className="mb-6 md:mb-0">
        <div className="relative overflow-hidden rounded-[9px] border border-[var(--border-subtle)] bg-[var(--media-frame)]">
          <div className="relative aspect-[16/9]">
            {coverImage ? (
              <>
                <Image
                  src={resolveProjectMediaUrl(coverImage)}
                  alt={coverImage.alt}
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 768px) 240px, 92vw"
                  className="object-contain opacity-[0.92] brightness-[0.96] contrast-[0.98]"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "var(--cover-overlay)" }}
                />
              </>
            ) : (
              <div className="grid h-full place-items-center">
                <FolderOpen
                  aria-hidden="true"
                  className="h-7 w-7 text-[var(--accent-muted)] opacity-45"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="editorial-interactive-content min-w-0 md:pr-4 lg:pr-0">
        <h3 className="max-w-[38rem] text-[clamp(1.38rem,4.6vw,1.62rem)] font-semibold leading-[1.18] tracking-[-0.035em] text-[var(--foreground)] lg:text-[clamp(1.35rem,1.7vw,1.55rem)]">
          {content.title}
        </h3>

        <p className="mt-3 max-w-[38rem] text-[0.94rem] leading-[1.62] text-[var(--foreground-muted)]">
          {content.shortDescription}
        </p>

        {categories.length > 0 ? (
          <p
            aria-label={copy.categories}
            className="mt-4 text-[0.78rem] font-medium tracking-[0.06em] text-[var(--accent-muted)]"
          >
            {categories.join(" · ")}
          </p>
        ) : null}

        {technologies.length > 0 ? (
          <TechnologyLogoRow
            technologies={technologies}
            ariaLabel={copy.technologies}
          />
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-6 lg:hidden">
          {project.year ? (
            <p className="hidden text-[0.72rem] font-medium tracking-[0.08em] text-[var(--foreground-muted)] opacity-70 md:block">
              {project.year}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          <ProjectLink
            href={projectHref}
            label={githubLink?.label ?? copy.actionFallback}
            title={content.title}
            target={projectLinkTarget}
            externalSuffix={copy.externalProjectSuffix}
          />
        </div>
      </div>

      <div className="hidden h-full flex-col items-end justify-between gap-8 pt-1 lg:flex">
        {project.year ? (
          <p className="text-[0.72rem] font-medium tracking-[0.08em] text-[var(--foreground-muted)] opacity-70">
            {project.year}
          </p>
        ) : (
          <span aria-hidden="true" />
        )}
        <ProjectLink
          href={projectHref}
          label={githubLink?.label ?? copy.actionFallback}
          title={content.title}
          target={projectLinkTarget}
          externalSuffix={copy.externalProjectSuffix}
        />
      </div>
    </motion.article>
  );
}

function TechnologyLogoRow({
  technologies,
  ariaLabel,
}: {
  technologies: ProjectTechnology[];
  ariaLabel: string;
}) {
  return (
    <ul
      aria-label={ariaLabel}
      className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-2"
    >
      {technologies.map((technology) => {
        const iconSrc = getTechnologyIconSrc(technology);

        return (
          <li
            key={technology.id}
            aria-label={technology.name}
            title={technology.name}
            className="group/tech relative flex min-h-5 min-w-5 items-center rounded-[4px] text-[var(--foreground-muted)] transition duration-200 hover:-translate-y-px hover:text-[var(--foreground)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {iconSrc ? (
              <>
                <TechnologyIcon technology={technology} />
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-[var(--border-subtle)] bg-[var(--surface)] px-2 py-1 text-[0.68rem] font-medium text-[var(--foreground)] shadow-[var(--shadow-soft)] group-hover/tech:block">
                  {technology.name}
                </span>
              </>
            ) : (
              <span className="whitespace-nowrap text-[0.68rem] font-medium leading-none">
                {technology.name}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ProjectLink({
  href,
  label,
  title,
  target,
  externalSuffix,
}: {
  href: string;
  label: string;
  title: string;
  target: "github" | "details";
  externalSuffix: string;
}) {
  const isExternal = target === "github";

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={
        isExternal
          ? `${label} - ${title} - ${externalSuffix}`
          : `${label} ${title}`
      }
      className="selected-project-link inline-flex min-h-9 items-center gap-2 border-b border-[rgb(var(--accent-rgb)/0.42)] pb-1 text-[0.82rem] font-medium text-[var(--foreground)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--focus-ring-offset)]"
    >
      <span>{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="selected-project-link-icon h-3.5 w-3.5"
      />
    </Link>
  );
}
