import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";

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

function ProjectPreview({ project }: { project: Project }) {
  const coverImage = project.coverImage;

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-slate-400/8 bg-[#050912]">
      <div className="relative aspect-[3/2] bg-[radial-gradient(circle_at_50%_20%,rgba(124,140,255,0.08),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.7),rgba(8,13,26,0.94))]">
        {coverImage ? (
          <Image
            src={resolveProjectMediaUrl(coverImage)}
            alt={coverImage.alt}
            fill
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 92vw"
            className="object-contain opacity-90 transition duration-300 group-hover:scale-[1.015] group-hover:opacity-95 motion-reduce:transition-none"
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
        <div className="absolute left-3 top-3 rounded-full border border-[#7C8CFF]/35 bg-[#080D1A]/72 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[#E2E8F0] backdrop-blur-sm">
          Projet phare
        </div>
      ) : null}
    </div>
  );
}

function ProjectTags({
  project,
}: {
  project: Project;
}) {
  const visibleCategories = project.categories.slice(0, 3);
  const hiddenCount = Math.max(0, project.categories.length - visibleCategories.length);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Catégories du projet" className="flex flex-wrap gap-2">
      {visibleCategories.map((category) => (
        <li
          key={category.id}
          className="rounded-full border border-slate-400/8 bg-slate-900/35 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[#AAB7C8]/75"
        >
          {category.name}
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li className="rounded-full border border-slate-400/8 bg-slate-900/35 px-2.5 py-1 text-[0.62rem] font-medium text-[#AAB7C8]/70">
          +{hiddenCount}
        </li>
      ) : null}
    </ul>
  );
}

function ProjectTechStack({ project }: { project: Project }) {
  const visibleTech = project.technologies.slice(0, 4);
  const hiddenCount = Math.max(0, project.technologies.length - visibleTech.length);

  if (visibleTech.length === 0) {
    return null;
  }

  return (
    <ul aria-label="Technologies principales" className="flex flex-wrap gap-2">
      {visibleTech.map((technology) => (
        <li
          key={technology.id}
          className="rounded-full bg-slate-400/[0.07] px-2.5 py-1 text-[0.7rem] font-medium text-[#CBD5E1]/72"
        >
          {technology.name}
        </li>
      ))}
      {hiddenCount > 0 ? (
        <li className="rounded-full bg-slate-400/[0.07] px-2.5 py-1 text-[0.7rem] font-medium text-[#CBD5E1]/68">
          +{hiddenCount}
        </li>
      ) : null}
    </ul>
  );
}

function ProjectAction({ project }: { project: Project }) {
  const content = getProjectContent(project);

  return (
    <Link
      href={`/projects/${project.slug}`}
      aria-label={`Voir le projet ${content.title}`}
      className="group/link inline-flex items-center gap-2 text-[0.78rem] font-medium text-slate-100 transition duration-200 hover:text-white focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A]"
    >
      <span>Voir le projet</span>
      <ArrowRight
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-[3px] motion-reduce:transition-none"
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
        "group relative overflow-hidden rounded-[14px] border border-slate-400/11 bg-[#090F1C]/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#7C8CFF]/28 hover:bg-[#0B1222]/70 motion-reduce:transition-none",
        isList ? "grid gap-5 md:grid-cols-[minmax(13rem,0.34fr)_minmax(0,1fr)]" : "flex h-full flex-col",
      ].join(" ")}
    >
      <ProjectPreview project={project} />

      <div className={isList ? "flex min-w-0 flex-col py-1" : "flex flex-1 flex-col pt-4"}>
        <ProjectTags project={project} />

        <h2
          className={[
            "mt-3 font-semibold leading-[1.22] tracking-[-0.025em] text-slate-50",
            isList ? "text-[clamp(1.25rem,2.2vw,1.55rem)]" : "text-[clamp(1.15rem,1.45vw,1.35rem)]",
          ].join(" ")}
        >
          {content.title}
        </h2>

        <p className="mt-3 line-clamp-4 text-[0.9rem] leading-6 text-[#94A3B8]">
          {content.shortDescription}
        </p>

        <div className="mt-5 flex flex-1 flex-col justify-end gap-5">
          <ProjectTechStack project={project} />
          <div className="flex items-center justify-between gap-4">
            {project.year ? (
              <p className="text-[0.72rem] font-medium tracking-[0.12em] text-[#64748B]">
                {project.year}
              </p>
            ) : (
              <span aria-hidden="true" />
            )}
            <ProjectAction project={project} />
          </div>
        </div>
      </div>
    </article>
  );
}
