import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  GitBranch,
  Lightbulb,
  Target,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";

import { SpaceBackground } from "@/components/home/space-background";
import { ProjectMediaViewer } from "@/components/projects/project-media-viewer";
import { TechnologyIcon, getTechnologyIconSrc } from "@/components/projects/technology-icon";
import {
  getProjectMediaByRole,
  getProjectBySlug,
  getProjectContent,
  getPublishedProjects,
  resolveProjectMediaUrl,
} from "@/features/projects";
import type {
  Project,
  ProjectCaseStudy,
  ProjectLink,
  ProjectTechnology,
} from "@/features/projects";

type ProjectCaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

type InsightBlock = {
  title: string;
  body: string;
  icon: typeof Target;
};

export async function generateStaticParams() {
  const projects = await getPublishedProjects();

  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProjectCaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const content = getProjectContent(project, "fr");
  const displayTitle = getProjectDisplayTitle(project);
  const description = content.seo?.description ?? content.shortDescription;
  const coverImage = project.coverImage;

  return {
    title: displayTitle,
    description,
    openGraph: {
      title: `${displayTitle} | Soufiane Azerdaoui`,
      description,
      images: coverImage
        ? [
            {
              url: resolveProjectMediaUrl(coverImage),
              width: coverImage.width,
              height: coverImage.height,
              alt: coverImage.alt,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayTitle} | Soufiane Azerdaoui`,
      description,
    },
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: ProjectCaseStudyPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const content = getProjectContent(project, "fr");
  const caseStudy = content.caseStudy;
  const displayTitle = getProjectDisplayTitle(project);
  const githubLink = getProjectLink(project, "github");
  const architectureMedia = getProjectMediaByRole(project, "architecture");
  const interfaceMedia = getProjectMediaByRole(project, "interface");
  const metaItems = getHeroMetaItems(project, caseStudy);
  const insights = getInsightBlocks(caseStudy, content.shortDescription, project);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[#080D1A]"
      />
      <SpaceBackground />

      <main id="main-content" className="relative z-10 min-h-svh overflow-x-clip">
        <article className="min-h-svh min-[1180px]:grid min-[1180px]:grid-cols-[minmax(0,44fr)_minmax(0,56fr)]">
          <section
            aria-labelledby="project-case-study-title"
            className="border-b border-slate-400/[0.09] px-5 py-8 sm:px-8 min-[1180px]:min-h-svh min-[1180px]:border-b-0 min-[1180px]:border-r min-[1180px]:px-11 min-[1180px]:py-10 min-[1440px]:px-12 min-[1600px]:px-14"
          >
            <div className="mx-auto flex w-full max-w-[42rem] flex-col min-[1180px]:mx-0 min-[1180px]:min-h-[calc(100svh-5rem)]">
              <div className="flex items-start justify-between gap-5">
                <BackLink />
                {githubLink ? (
                  <ExternalProjectLink link={githubLink} label="GitHub" />
                ) : null}
              </div>

              <header className="mt-11 max-w-[35rem] min-[1180px]:mt-10 min-[1366px]:mt-11">
                <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-[#7C8CFF]">
                  / Project case study
                </p>
                <h1
                  id="project-case-study-title"
                  className="mt-5 text-[clamp(2.65rem,4vw,3.38rem)] font-semibold leading-[1.06] tracking-[-0.055em] text-[#F8FAFC]"
                >
                  {displayTitle}
                </h1>
                <p className="mt-4 max-w-[33rem] text-[clamp(1.12rem,1.55vw,1.32rem)] leading-[1.47] tracking-[-0.025em] text-[#AAB7C8]">
                  {ensureTerminalPeriod(content.title)}
                </p>

                {metaItems.length > 0 ? (
                  <p className="mt-5 flex flex-wrap gap-x-3 gap-y-2 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-[#94A3B8]/82">
                    {metaItems.map((item, index) => (
                      <span key={item} className="inline-flex items-center gap-3">
                        {index > 0 ? (
                          <span
                            aria-hidden="true"
                            className="h-1 w-1 rounded-full bg-[#7C8CFF]/75"
                          />
                        ) : null}
                        {item}
                      </span>
                    ))}
                  </p>
                ) : null}
              </header>

              <div className="mt-8 border-t border-slate-400/[0.09]">
                {insights.map((block) => (
                  <ProjectInsightBlock
                    key={block.title}
                    block={block}
                    contributors={project.contributors}
                  />
                ))}
              </div>

              <div className="mt-7 border-t border-slate-400/[0.09] pt-7 min-[1180px]:mt-auto">
                <h2 className="text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[#7C8CFF]">
                  Stack principale
                </h2>
                <TechnologyStack technologies={project.technologies} />
              </div>
            </div>
          </section>

          <section
            aria-label="Médias du projet"
            className="px-5 py-8 sm:px-8 min-[1180px]:min-h-svh min-[1180px]:px-8 min-[1180px]:py-10 min-[1440px]:px-10"
          >
            <ProjectMediaViewer
              coverImage={project.coverImage}
              architectureMedia={architectureMedia}
              interfaceMedia={interfaceMedia}
            />
          </section>
        </article>
      </main>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/projects"
      className="group inline-flex min-h-10 items-center gap-3 text-[0.92rem] font-medium text-[#CBD5E1] transition duration-200 hover:text-[#F8FAFC] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none"
    >
      <ArrowLeft
        aria-hidden="true"
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none"
      />
      Retour aux projets
    </Link>
  );
}

function ProjectInsightBlock({
  block,
  contributors,
}: {
  block: InsightBlock;
  contributors?: Project["contributors"];
}) {
  const Icon = block.icon;

  return (
    <section className="grid grid-cols-[3rem_minmax(0,1fr)] gap-5 border-b border-slate-400/[0.09] py-7 min-[1180px]:py-6 min-[1440px]:py-7">
      <div aria-hidden="true" className="pt-0.5 text-[#7C8CFF]">
        <Icon className="h-6 w-6 stroke-[1.7]" />
      </div>
      <div>
        <h2 className="text-[0.82rem] font-semibold uppercase tracking-[0.1em] text-[#9AA6FF]">
          {block.title}
        </h2>
        <p className="mt-3 max-w-[34rem] text-[0.93rem] leading-[1.72] text-[#CBD5E1]/88">
          {block.body}
        </p>
        {block.title === "Contribution" && contributors?.length ? (
          <ContributorsList contributors={contributors} />
        ) : null}
      </div>
    </section>
  );
}

function ContributorsList({
  contributors,
}: {
  contributors: NonNullable<Project["contributors"]>;
}) {
  return (
    <ul className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
      {contributors.map((contributor) => (
        <li
          key={contributor.name}
          className="inline-flex items-center gap-3 text-[0.88rem] font-medium text-[#F8FAFC]"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[#7C8CFF]/32 bg-[#7C8CFF]/14 text-[0.76rem] text-[#C7D2FE]">
            {getInitials(contributor.name)}
          </span>
          <span>{contributor.name}</span>
        </li>
      ))}
    </ul>
  );
}

function TechnologyStack({
  technologies,
}: {
  technologies: ProjectTechnology[];
}) {
  if (technologies.length === 0) {
    return null;
  }

  return (
    <ul className="mt-5 grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-5 min-[1180px]:grid-cols-6 min-[1366px]:grid-cols-9">
      {technologies.map((technology) => {
        const hasIcon = Boolean(getTechnologyIconSrc(technology));

        return (
          <li key={technology.id} className="min-w-0 text-center">
            {hasIcon ? (
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-[9px] border border-slate-400/[0.09] bg-[#0B1222]/72">
                <TechnologyIcon technology={technology} />
              </span>
            ) : (
              <span aria-hidden="true" className="mx-auto block h-10 w-10" />
            )}
            <span className="mt-2 block text-[0.72rem] font-medium leading-[1.18] text-[#E2E8F0]">
              {technology.name}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ExternalProjectLink({
  link,
  label,
}: {
  link: ProjectLink;
  label?: string;
}) {
  return (
    <Link
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label ?? link.label} - ouvrir le dépôt dans un nouvel onglet`}
      className="group inline-flex h-11 w-fit items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border border-slate-400/[0.12] bg-transparent px-4 text-[0.92rem] font-medium text-[#F8FAFC] transition duration-200 hover:border-[#7C8CFF]/38 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none"
    >
      {link.type === "github" ? (
        <GitBranch aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" />
      ) : null}
      <span>{label ?? link.label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
      />
    </Link>
  );
}

function getInsightBlocks(
  caseStudy: ProjectCaseStudy | undefined,
  fallbackSolution: string,
  project: Project,
): InsightBlock[] {
  return [
    {
      title: "Problématique",
      body: getProblemSummary(caseStudy?.problem),
      icon: Target,
    },
    {
      title: "Solution",
      body: getSolutionSummary(caseStudy, fallbackSolution),
      icon: Lightbulb,
    },
    {
      title: "Contribution",
      body: project.role
        ? ensureTerminalPeriod(project.role)
        : "Projet réalisé en binôme.",
      icon: Users,
    },
  ];
}

function getProjectDisplayTitle(project: Project) {
  return project.content.en?.title ?? getProjectContent(project, "fr").title;
}

function getHeroMetaItems(
  project: Project,
  caseStudy: ProjectCaseStudy | undefined,
) {
  return [
    getCompactContextLabel(caseStudy?.context),
    project.year?.toString(),
    project.duration,
  ]
    .filter((item): item is string => Boolean(item))
    .map((item) => trimTrailingPeriod(item).toUpperCase());
}

function getCompactContextLabel(context: string | undefined) {
  if (!context) {
    return undefined;
  }

  if (/fin d[’']études/i.test(context) && /master 2/i.test(context)) {
    return "PFE Master 2";
  }

  return context;
}

function getProblemSummary(problem: string | undefined) {
  if (!problem) {
    return "Les rapports PDF médicaux combinent souvent texte, tableaux, résultats et éléments visuels difficiles à exploiter automatiquement.";
  }

  return getSentences(problem, 2).join(" ");
}

function getSolutionSummary(
  caseStudy: ProjectCaseStudy | undefined,
  fallbackSolution: string,
) {
  const objectives = caseStudy?.objectives ?? [];
  const hasStructuredRagObjectives =
    objectives.some((objective) => /extraire|extraction/i.test(objective)) &&
    objectives.some((objective) => /index/i.test(objective)) &&
    objectives.some((objective) => /réponse|reponse|sources?/i.test(objective));

  if (hasStructuredRagObjectives) {
    return "La plateforme extrait, structure et indexe les informations des rapports afin de permettre une recherche intelligente et des réponses contextualisées et sourcées via une architecture RAG.";
  }

  if (caseStudy?.architecture) {
    return getSentences(caseStudy.architecture, 1).join(" ");
  }

  return fallbackSolution;
}

function getSentences(value: string, limit: number) {
  return (
    value
      .match(/[^.!?]+[.!?]+/g)
      ?.slice(0, limit)
      .map((sentence) => sentence.trim()) ?? [value]
  );
}

function ensureTerminalPeriod(value: string) {
  return /[.!?]$/.test(value.trim()) ? value : `${value}.`;
}

function trimTrailingPeriod(value: string) {
  return value.replace(/\.$/, "");
}

function getProjectLink(project: Project, type: ProjectLink["type"]) {
  return project.links.find((link) => link.type === type);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
