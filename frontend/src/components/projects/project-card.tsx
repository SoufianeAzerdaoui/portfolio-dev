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

function ProjectPreview({
  project,
  view,
}: {
  project: Project;
  view: ProjectViewMode;
}) {
  const coverImage = project.coverImage;
  const isList = view === "list";

  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-[10px] border border-slate-400/8 bg-[#050912]",
      ].join(" ")}
    >
      <div
        className={[
          "relative grid place-items-center bg-[radial-gradient(circle_at_50%_20%,rgba(124,140,255,0.08),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.48),rgba(5,10,20,0.62))]",
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
              className="h-8 w-8 text-[#7C8CFF]/42"
            />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,13,26,0.04)_0%,transparent_42%,rgba(8,13,26,0.36)_100%)]" />
      {project.featured ? (
        <div className="absolute left-3 top-3 rounded-full border border-[#7C8CFF]/28 bg-[#080D1A]/68 px-2 py-0.5 text-[0.52rem] font-medium uppercase tracking-[0.13em] text-[#E2E8F0]/82 backdrop-blur-sm">
          Projet phare
        </div>
      ) : null}
    </div>
  );
}

function ProjectTags({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  const visibleCategories = project.categories.slice(0, 3);
  const hiddenCount = Math.max(0, project.categories.length - visibleCategories.length);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Catégories du projet"
      className={["flex flex-wrap", compact ? "gap-1.5" : "gap-2"].join(" ")}
    >
      {visibleCategories.map((category) => (
        <li
          key={category.id}
          className={[
            "rounded-full border border-slate-400/8 bg-slate-900/35 font-medium uppercase tracking-[0.12em] text-[#AAB7C8]/75",
            compact ? "px-2 py-0.5 text-[0.58rem]" : "px-2.5 py-1 text-[0.62rem]",
          ].join(" ")}
        >
          {category.name}
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li
          className={[
            "rounded-full border border-slate-400/8 bg-slate-900/35 font-medium text-[#AAB7C8]/70",
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
}: {
  project: Project;
  compact?: boolean;
}) {
  const visibleTech = project.technologies.slice(0, 4);
  const hiddenCount = Math.max(0, project.technologies.length - visibleTech.length);

  if (visibleTech.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Technologies principales"
      className={["flex flex-wrap", compact ? "gap-1.5" : "gap-2"].join(" ")}
    >
      {visibleTech.map((technology) => (
        <li
          key={technology.id}
          className={[
            "rounded-full bg-slate-400/[0.07] font-medium text-[#CBD5E1]/72",
            compact ? "px-2 py-0.5 text-[0.64rem]" : "px-2.5 py-1 text-[0.7rem]",
          ].join(" ")}
        >
          {technology.name}
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li
          className={[
            "rounded-full bg-slate-400/[0.07] font-medium text-[#CBD5E1]/68",
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
}: {
  project: Project;
  compact?: boolean;
}) {
  const content = getProjectContent(project);
  const githubLink = project.links.find((link) => link.type === "github");
  const href = githubLink?.url ?? `/projects/${project.slug}`;
  const isExternal = Boolean(githubLink);
  const label = githubLink?.label ?? "Voir le projet";

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      aria-label={
        isExternal
          ? `${label} du projet ${content.title} - ouvrir le dépôt GitHub dans un nouvel onglet`
          : `${label} ${content.title}`
      }
      className={[
        "group/link inline-flex items-center gap-2 font-medium text-slate-100 transition duration-200 hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A]",
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
        "group relative overflow-hidden border border-slate-400/11 bg-[#090F1C]/58 shadow-[0_18px_54px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#7C8CFF]/28 hover:bg-[#0B1222]/70 motion-reduce:transition-none",
        isList
          ? "grid gap-5 rounded-[14px] p-3 md:grid-cols-[minmax(13rem,0.34fr)_minmax(0,1fr)]"
          : "flex h-full min-h-[27rem] flex-col rounded-[13px] p-2.5",
      ].join(" ")}
    >
      <ProjectPreview project={project} view={view} />

      <div className={isList ? "flex min-w-0 flex-col py-1" : "flex flex-1 min-w-0 flex-col px-2 pb-2 pt-3"}>
        <ProjectTags project={project} compact={!isList} />

        <h2
          className={[
            "font-semibold leading-[1.16] tracking-[-0.025em] text-slate-50",
            isList
              ? "mt-2 text-[clamp(1.25rem,2.2vw,1.55rem)]"
              : "mt-2 line-clamp-2 text-[clamp(1.12rem,1.34vw,1.24rem)] leading-[1.22]",
          ].join(" ")}
        >
          {content.title}
        </h2>

        <p
          className={[
            "text-[#94A3B8]",
            isList
              ? "mt-2 line-clamp-4 text-[0.9rem] leading-6"
              : "mt-2.5 line-clamp-3 text-[0.86rem] leading-[1.6]",
          ].join(" ")}
        >
          {content.shortDescription}
        </p>

        <div className={isList ? "mt-3.5 flex flex-1 flex-col justify-end gap-4" : "mt-auto flex flex-col gap-3 pt-5"}>
          <ProjectTechStack project={project} compact={!isList} />
          <div className="flex items-center justify-between gap-4">
            {project.year ? (
              <p
                className={[
                  "font-medium tracking-[0.12em] text-[#64748B]",
                  isList ? "text-[0.72rem]" : "text-[0.7rem]",
                ].join(" ")}
              >
                {project.year}
              </p>
            ) : (
              <span aria-hidden="true" />
            )}
            <ProjectAction project={project} compact={!isList} />
          </div>
        </div>
      </div>
    </article>
  );
}
