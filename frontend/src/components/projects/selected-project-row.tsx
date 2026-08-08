"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
  getProjectContent,
  resolveProjectMediaUrl,
} from "@/lib/projects";
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

type ProjectTechnologyWithIcon = ProjectTechnology & {
  icon: string;
};

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

function hasTechnologyIcon(
  technology: ProjectTechnology,
): technology is ProjectTechnologyWithIcon {
  return typeof technology.icon === "string" && technology.icon.length > 0;
}

export function SelectedProjectRow({
  project,
  index,
  locale = "fr",
}: SelectedProjectRowProps) {
  const reducedMotion = useReducedMotion();
  const content = getProjectContent(project, locale);
  const coverImage = project.coverImage;
  const projectHref = `/projects/${project.slug}`;
  const categories = getPriorityNames(project.categories, CATEGORY_PRIORITY, 3);
  const technologies = project.technologies
    .filter(hasTechnologyIcon)
    .slice(0, MAX_HOME_TECHNOLOGIES);

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
      className="group/project grid border-t border-slate-400/[0.08] py-7 md:grid-cols-[2.75rem_minmax(12rem,15.5rem)_minmax(0,1fr)] md:gap-x-6 lg:grid-cols-[3.5rem_minmax(14rem,18rem)_minmax(0,1fr)_8.5rem] lg:items-start lg:gap-x-8 xl:grid-cols-[3.5rem_minmax(15rem,19.5rem)_minmax(0,1fr)_9.5rem]"
    >
      <div className="mb-5 flex items-center justify-between md:mb-0 md:block">
        <p className="text-[1.15rem] font-normal leading-none tracking-[-0.02em] text-[#7C8CFF]/85 md:text-[1.28rem]">
          {formatProjectIndex(index)}
        </p>
        {project.year ? (
          <p className="text-[0.72rem] font-medium tracking-[0.08em] text-[#94A3B8]/68 md:hidden">
            {project.year}
          </p>
        ) : null}
      </div>

      <div className="mb-6 md:mb-0">
        <div className="relative overflow-hidden rounded-[9px] border border-slate-400/[0.09] bg-[#050912]/72">
          <div className="relative aspect-[16/9]">
            {coverImage ? (
              <Image
                src={resolveProjectMediaUrl(coverImage)}
                alt={coverImage.alt}
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 768px) 240px, 92vw"
                className="object-contain opacity-[0.94] transition duration-300 group-hover/project:scale-[1.012] group-hover/project:opacity-100 motion-reduce:transition-none motion-reduce:group-hover/project:scale-100"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <FolderOpen
                  aria-hidden="true"
                  className="h-7 w-7 text-[#7C8CFF]/42"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 md:pr-4 lg:pr-0">
        <h3 className="max-w-[38rem] text-[clamp(1.38rem,4.6vw,1.62rem)] font-semibold leading-[1.18] tracking-[-0.035em] text-[#F8FAFC] transition-colors duration-200 group-hover/project:text-white motion-reduce:transition-none lg:text-[clamp(1.35rem,1.7vw,1.55rem)]">
          {content.title}
        </h3>

        <p className="mt-3 line-clamp-3 max-w-[38rem] text-[0.94rem] leading-[1.62] text-[#94A3B8] md:line-clamp-2">
          {content.shortDescription}
        </p>

        {categories.length > 0 ? (
          <p
            aria-label="Catégories principales"
            className="mt-4 text-[0.78rem] font-medium tracking-[0.06em] text-[#7C8CFF]/86"
          >
            {categories.join(" · ")}
          </p>
        ) : null}

        {technologies.length > 0 ? (
          <TechnologyLogoRow technologies={technologies} />
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-6 lg:hidden">
          {project.year ? (
            <p className="hidden text-[0.72rem] font-medium tracking-[0.08em] text-[#94A3B8]/68 md:block">
              {project.year}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          <ProjectLink
            href={projectHref}
            label="Voir le projet"
            title={content.title}
          />
        </div>
      </div>

      <div className="hidden h-full flex-col items-end justify-between gap-8 pt-1 lg:flex">
        {project.year ? (
          <p className="text-[0.72rem] font-medium tracking-[0.08em] text-[#94A3B8]/68">
            {project.year}
          </p>
        ) : (
          <span aria-hidden="true" />
        )}
        <ProjectLink
          href={projectHref}
          label="Voir le projet"
          title={content.title}
        />
      </div>
    </motion.article>
  );
}

function TechnologyLogoRow({
  technologies,
}: {
  technologies: ProjectTechnologyWithIcon[];
}) {
  return (
    <ul
      aria-label="Technologies principales"
      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4"
    >
      {technologies.map((technology) => (
        <li
          key={technology.id}
          aria-label={technology.name}
          title={technology.name}
          tabIndex={0}
          className="group/tech relative grid h-5 w-5 place-items-center rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A]"
        >
          <Image
            src={technology.icon}
            alt=""
            width={20}
            height={20}
            unoptimized
            className="h-[18px] w-[18px] object-contain opacity-[0.72] transition duration-200 group-hover/tech:-translate-y-px group-hover/tech:opacity-100 group-focus-visible/tech:-translate-y-px group-focus-visible/tech:opacity-100 motion-reduce:transition-none sm:h-5 sm:w-5"
          />
          <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-[6px] border border-slate-400/[0.10] bg-[#080D1A]/95 px-2 py-1 text-[0.68rem] font-medium text-[#E2E8F0]/88 shadow-[0_8px_24px_rgba(0,0,0,0.24)] group-hover/tech:block group-focus-visible/tech:block">
            {technology.name}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ProjectLink({
  href,
  label,
  title,
}: {
  href: string;
  label: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${label} ${title}`}
      className="group/link inline-flex min-h-9 items-center gap-2 border-b border-[#7C8CFF]/42 pb-1 text-[0.82rem] font-medium text-slate-100 transition duration-200 hover:border-[#7C8CFF]/80 hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A]"
    >
      <span>{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-[2px] group-hover/link:-translate-y-[2px] motion-reduce:transition-none"
      />
    </Link>
  );
}
