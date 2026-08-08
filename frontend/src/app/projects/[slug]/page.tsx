import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, GitBranch } from "lucide-react";
import { notFound } from "next/navigation";

import { SpaceBackground } from "@/components/home/space-background";
import { ProjectMediaCarousel } from "@/components/projects/project-media-carousel";
import { TechnologyIcon } from "@/components/projects/technology-icon";
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
  ProjectMedia,
} from "@/features/projects";

type ProjectCaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

const ARCHITECTURE_PIPELINE_MATCHERS = [
  { label: "PDF", pattern: /pdf/i },
  { label: "Extraction", pattern: /extraction/i },
  { label: "Embeddings", pattern: /embedding/i },
  { label: "Qdrant", pattern: /qdrant/i },
  { label: "Hybrid Retrieval", pattern: /hybrid retrieval/i },
  { label: "Llama 3.2", pattern: /llama/i },
  { label: "Sources", pattern: /source/i },
] as const;

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
  const architectureNumber = formatSectionNumber(1);
  const interfaceNumber = formatSectionNumber(
    architectureMedia.length > 0 ? 2 : 1,
  );
  const stackNumber = formatSectionNumber(
    1 +
      (architectureMedia.length > 0 ? 1 : 0) +
      (interfaceMedia.length > 0 ? 1 : 0),
  );
  const teamNumber = formatSectionNumber(
    2 +
      (architectureMedia.length > 0 ? 1 : 0) +
      (interfaceMedia.length > 0 ? 1 : 0),
  );

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[#080D1A]"
      />
      <SpaceBackground />

      <main
        id="main-content"
        className="relative z-10 min-h-svh overflow-x-clip px-5 py-8 sm:px-8 lg:px-12 xl:px-16"
      >
        <article className="mx-auto w-full max-w-[82rem] pb-20 pt-8 sm:pt-12">
          <CaseStudyHero
            project={project}
            caseStudy={caseStudy}
            displayTitle={displayTitle}
            statement={content.title}
            problem={getProblemSummary(caseStudy?.problem)}
            solution={content.shortDescription}
            githubLink={githubLink}
          />

          <div className="mt-16 lg:mt-20">
            {architectureMedia.length > 0 ? (
              <ArchitectureSection
                number={architectureNumber}
                caseStudy={caseStudy}
                media={architectureMedia}
              />
            ) : null}

            {interfaceMedia.length > 0 ? (
              <InterfacesSection
                number={interfaceNumber}
                media={interfaceMedia}
              />
            ) : null}

            {project.technologies.length > 0 ? (
              <StackSection number={stackNumber} project={project} />
            ) : null}

            {project.contributors?.length || githubLink ? (
              <TeamSection
                project={project}
                githubLink={githubLink}
                number={teamNumber}
              />
            ) : null}
          </div>
        </article>
      </main>
    </>
  );
}

function CaseStudyHero({
  project,
  caseStudy,
  displayTitle,
  statement,
  problem,
  solution,
  githubLink,
}: {
  project: Project;
  caseStudy?: ProjectCaseStudy;
  displayTitle: string;
  statement: string;
  problem?: string;
  solution: string;
  githubLink?: ProjectLink;
}) {
  const metaItems = getHeroMetaItems(project, caseStudy);

  return (
    <header className="motion-safe:animate-[case-study-rise_620ms_cubic-bezier(0.22,1,0.36,1)_both]">
      <Link
        href="/projects"
        className="group inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-slate-400/10 bg-[#080D1A]/42 px-4 text-[0.8rem] font-medium text-[#AAB7C8] transition duration-200 hover:border-[#7C8CFF]/40 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none"
      >
        <ArrowLeft
          aria-hidden="true"
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none"
        />
        Retour aux projets
      </Link>

      <div className="mt-12 grid gap-7 lg:grid-cols-[minmax(0,1fr)_max-content] lg:items-end lg:gap-10">
        <div>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-[#7C8CFF]/78">
            / Project case study
          </p>
          <h1 className="mt-5 max-w-[54rem] text-[clamp(3rem,6.2vw,4rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-[#F8FAFC]">
            {displayTitle}
          </h1>
        </div>

        {githubLink ? (
          <div className="flex lg:justify-end lg:pb-1">
            <ExternalProjectLink link={githubLink} label="GitHub" />
          </div>
        ) : null}
      </div>

      <p className="mt-8 max-w-[52rem] text-[clamp(1.28rem,2.2vw,2rem)] font-medium leading-[1.2] tracking-[-0.04em] text-[#E2E8F0]">
        {statement}
      </p>

      {metaItems.length > 0 ? (
        <p className="mt-6 flex max-w-[50rem] flex-wrap gap-x-3 gap-y-2 text-[0.76rem] font-medium uppercase tracking-[0.16em] text-[#94A3B8]/78">
          {metaItems.map((item, index) => (
            <span key={item} className="inline-flex items-center gap-3">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-[#7C8CFF]/55"
                />
              ) : null}
              {item}
            </span>
          ))}
        </p>
      ) : null}

      {project.coverImage ? (
        <MediaFrame
          media={project.coverImage}
          priority
          className="mt-10 motion-safe:animate-[case-study-rise_720ms_cubic-bezier(0.22,1,0.36,1)_100ms_both]"
          sizes="(min-width: 1440px) 1240px, (min-width: 1024px) 88vw, 94vw"
        />
      ) : null}

      <HeroBrief
        subject={statement}
        problem={problem}
        solution={solution}
      />
    </header>
  );
}

function HeroBrief({
  subject,
  problem,
  solution,
}: {
  subject: string;
  problem?: string;
  solution: string;
}) {
  return (
    <div className="mt-12 grid gap-8 border-t border-slate-400/[0.08] pt-8 md:grid-cols-3 md:gap-9 lg:gap-10">
      <SummaryColumn title="Sujet">{subject}</SummaryColumn>
      {problem ? <SummaryColumn title="Problème">{problem}</SummaryColumn> : null}
      <SummaryColumn title="Solution">{solution}</SummaryColumn>
    </div>
  );
}

function SummaryColumn({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <div>
      <h3 className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-[#7C8CFF]/86">
        {title}
      </h3>
      <p className="mt-3 max-w-[25rem] text-[clamp(0.98rem,1.16vw,1.05rem)] leading-[1.65] text-[#CBD5E1]/88">
        {children}
      </p>
    </div>
  );
}

function ArchitectureSection({
  number,
  caseStudy,
  media,
}: {
  number: string;
  caseStudy?: ProjectCaseStudy;
  media: ProjectMedia[];
}) {
  const pipeline = getArchitecturePipeline(caseStudy);
  const embeddingNote = getEmbeddingNote(caseStudy);

  return (
    <CaseStudySection number={number} label="Architecture">
      <div className="space-y-6">
        <p className="max-w-[42rem] text-[0.98rem] leading-7 text-[#AAB7C8]/84">
          Architecture visuelle du pipeline RAG multimodal.
        </p>

        <ProjectMediaCarousel
          media={media}
          label="Galerie architecture du projet"
        />

        {pipeline.length > 0 ? (
          <ol
            aria-label="Pipeline d’architecture résumé"
            className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.78rem] font-medium text-[#E2E8F0]/70"
          >
            {pipeline.map((step, index) => (
              <li key={step} className="inline-flex items-center gap-3">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-[#64748B]">
                    →
                  </span>
                ) : null}
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {embeddingNote ? (
          <p className="text-[0.78rem] leading-6 text-[#94A3B8]/62">
            {embeddingNote}
          </p>
        ) : null}
      </div>
    </CaseStudySection>
  );
}

function StackSection({
  project,
  number,
}: {
  project: Project;
  number: string;
}) {
  return (
    <CaseStudySection number={number} label="Stack">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[14px] border border-slate-400/[0.08] bg-[#090F1C]/18 p-5 sm:p-6 md:grid-cols-3 xl:grid-cols-5">
        {project.technologies.map((technology) => (
          <li
            key={technology.id}
            className="inline-flex min-w-0 items-center gap-2.5 text-[0.84rem] font-medium leading-snug text-[#AAB7C8] transition-colors duration-200 hover:text-[#F8FAFC] motion-reduce:transition-none sm:text-[0.86rem]"
          >
            <TechnologyIcon technology={technology} />
            <span className="min-w-0">{technology.name}</span>
          </li>
        ))}
      </ul>
    </CaseStudySection>
  );
}

function InterfacesSection({
  media,
  number,
}: {
  media: ProjectMedia[];
  number: string;
}) {
  return (
    <CaseStudySection number={number} label="Interfaces">
      <div className="space-y-6">
        <p className="max-w-[42rem] text-[0.98rem] leading-7 text-[#AAB7C8]/84">
          Quelques vues de l’interface desktop et responsive de la plateforme.
        </p>

        <ProjectMediaCarousel
          media={media}
          label="Galerie interfaces du projet"
        />
      </div>
    </CaseStudySection>
  );
}

function TeamSection({
  project,
  githubLink,
  number,
}: {
  project: Project;
  githubLink?: ProjectLink;
  number: string;
}) {
  return (
    <CaseStudySection number={number} label="Team">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        {project.contributors?.length ? (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {project.contributors.map((contributor, index) => (
              <li
                key={contributor.name}
                className="inline-flex items-center gap-4 text-[clamp(1.12rem,1.55vw,1.36rem)] font-medium tracking-[-0.03em] text-[#E2E8F0]"
              >
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-[#7C8CFF]/55"
                  />
                ) : null}
                {contributor.name}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {githubLink ? (
            <ExternalProjectLink
              link={githubLink}
              label="Voir le code source"
              prominent
            />
          ) : null}

          <Link
            href="/projects"
            className="group inline-flex min-h-10 items-center gap-2 rounded-[6px] px-1 text-[0.82rem] font-medium text-[#AAB7C8]/82 transition duration-200 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none"
          >
            <ArrowLeft
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none"
            />
            Retour aux projets
          </Link>
        </div>
      </div>
    </CaseStudySection>
  );
}

function CaseStudySection({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-7 border-t border-slate-400/[0.08] py-14 motion-safe:animate-[case-study-rise_560ms_cubic-bezier(0.22,1,0.36,1)_both] md:py-16 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-12">
      <h2 className="text-[0.74rem] font-medium uppercase tracking-[0.24em] text-[#7C8CFF]/72">
        {number} / {label}
      </h2>
      <div>{children}</div>
    </section>
  );
}

function MediaFrame({
  media,
  className,
  priority = false,
  sizes,
}: {
  media: ProjectMedia;
  className?: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <figure
      className={[
        "overflow-hidden rounded-[16px] border border-slate-400/[0.1] bg-[#050912]/60 shadow-[0_20px_64px_rgba(0,0,0,0.2)]",
        className ?? "",
      ].join(" ")}
    >
      <Image
        src={resolveProjectMediaUrl(media)}
        alt={media.alt}
        width={media.width ?? 1536}
        height={media.height ?? 1024}
        priority={priority}
        sizes={sizes}
        className="h-auto w-full object-contain"
      />
      {media.caption ? (
        <figcaption className="border-t border-slate-400/[0.08] px-4 py-3 text-[0.82rem] text-[#94A3B8]">
          {media.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ExternalProjectLink({
  link,
  label,
  prominent = false,
}: {
  link: ProjectLink;
  label?: string;
  prominent?: boolean;
}) {
  return (
    <Link
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "group inline-flex h-11 w-fit max-w-[11rem] items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border px-4 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C8CFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080D1A] motion-reduce:transition-none",
        prominent
          ? "max-w-none border-[#7C8CFF]/34 bg-[#7C8CFF]/[0.06] px-5 text-[0.88rem] font-medium text-[#F8FAFC] hover:border-[#7C8CFF]/58 hover:bg-[#7C8CFF]/10"
          : "border-slate-400/[0.12] bg-transparent text-[0.82rem] font-medium text-[#AAB7C8] hover:border-[#7C8CFF]/35 hover:text-slate-50",
      ].join(" ")}
    >
      {link.type === "github" ? (
        <GitBranch aria-hidden="true" className="h-4 w-4" />
      ) : null}
      <span>{label ?? link.label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
      />
    </Link>
  );
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
    return undefined;
  }

  return getSentences(problem, 2).join(" ");
}

function getSentences(value: string, limit: number) {
  return value
    .match(/[^.!?]+[.!?]+/g)
    ?.slice(0, limit)
    .map((sentence) => sentence.trim()) ?? [value];
}

function getArchitecturePipeline(caseStudy: ProjectCaseStudy | undefined) {
  const steps = caseStudy?.architectureSteps ?? [];

  return ARCHITECTURE_PIPELINE_MATCHERS.filter((matcher) =>
    steps.some((step) => matcher.pattern.test(step)),
  ).map((matcher) => matcher.label);
}

function getEmbeddingNote(caseStudy: ProjectCaseStudy | undefined) {
  const approach = caseStudy?.approach ?? "";
  const primary = approach.match(/BAAI\/bge-m3/i)?.[0];
  const fallback = approach.match(/intfloat\/multilingual-e5-base/i)?.[0];

  if (!primary && !fallback) {
    return undefined;
  }

  return [
    primary ? `Embeddings : ${primary}` : undefined,
    fallback ? `fallback ${fallback}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

function trimTrailingPeriod(value: string) {
  return value.replace(/\.$/, "");
}

function getProjectLink(project: Project, type: ProjectLink["type"]) {
  return project.links.find((link) => link.type === type);
}

function formatSectionNumber(index: number) {
  return String(index).padStart(2, "0");
}
