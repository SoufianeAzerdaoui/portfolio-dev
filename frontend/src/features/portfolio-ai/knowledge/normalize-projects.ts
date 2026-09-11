import { PROJECTS } from "@/features/projects/data/projects";
import type {
  Project,
  ProjectLocalizedContent,
  SupportedLocale,
} from "@/features/projects/domain/project.types";
import {
  medicalRagVerifiedCapabilities,
  overrideEvidence,
  projectTechnologyStatusOverrides,
} from "@/features/portfolio-ai/knowledge/knowledge.overrides";
import { sourceRef } from "@/features/portfolio-ai/knowledge/knowledge.sources";
import {
  canonicalizeTechnology,
  createTechnologyEntity,
} from "@/features/portfolio-ai/knowledge/build-skills-index";
import { toSlug, uniqueStrings } from "@/features/portfolio-ai/knowledge/build-aliases";
import type {
  KnowledgeEntity,
  KnowledgeFact,
  KnowledgeRelation,
  KnowledgeVerificationStatus,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

const PROJECT_DOMAIN_LABELS: Record<Project["domain"], string> = {
  "ai-ml": "AI / Machine Learning",
  "data-analytics": "Data Analytics",
  "data-engineering": "Data Engineering",
  "software-engineering": "Software Engineering",
};

function projectFactId(projectId: string, predicate: string, value: string) {
  return `fact:${projectId}:${predicate}:${value}`;
}

function projectContentFactId(
  projectId: string,
  predicate: string,
  locale: SupportedLocale,
  index?: number,
) {
  return projectFactId(
    projectId,
    predicate,
    index === undefined ? locale : `${locale}:${index + 1}`,
  );
}

function getTechnologyStatus(projectId: string, technologyName: string) {
  return (
    projectTechnologyStatusOverrides[projectId]?.[technologyName] ?? "verified"
  );
}

function getProjectTechnologyNames(project: Project) {
  return uniqueStrings([
    ...project.technologies.map((technology) => technology.name),
    ...(project.id === "medical-rag-platform"
      ? [
          "BAAI/bge-m3",
          "intfloat/multilingual-e5-base",
          "Hybrid Retrieval",
          "multimodal RAG",
        ]
      : []),
  ]);
}

function projectEvidence(project: Project, field: string) {
  return {
    sourceType: "project" as const,
    sourceId: project.id,
    field,
    strength: "primary" as const,
  };
}

function addProjectContentFact(
  facts: KnowledgeFact[],
  project: Project,
  locale: SupportedLocale,
  predicate: string,
  value: string,
  field: string,
  index?: number,
) {
  if (!value.trim()) {
    return;
  }

  facts.push({
    id: projectContentFactId(project.id, predicate, locale, index),
    subjectId: project.id,
    predicate,
    value: value.trim(),
    status: "verified",
    evidence: [projectEvidence(project, field)],
  });
}

function addProjectLocalizedContentFacts(
  facts: KnowledgeFact[],
  project: Project,
  locale: SupportedLocale,
  content: ProjectLocalizedContent | undefined,
) {
  if (!content) {
    return;
  }

  addProjectContentFact(
    facts,
    project,
    locale,
    "projectShortDescription",
    content.shortDescription,
    `content.${locale}.shortDescription`,
  );

  const caseStudy = content.caseStudy;

  if (!caseStudy) {
    return;
  }

  addProjectContentFact(
    facts,
    project,
    locale,
    "projectOverview",
    caseStudy.overview ?? "",
    `content.${locale}.caseStudy.overview`,
  );
  addProjectContentFact(
    facts,
    project,
    locale,
    "projectContext",
    caseStudy.context ?? "",
    `content.${locale}.caseStudy.context`,
  );
  addProjectContentFact(
    facts,
    project,
    locale,
    "projectProblem",
    caseStudy.problem ?? "",
    `content.${locale}.caseStudy.problem`,
  );
  caseStudy.objectives?.forEach((objective, index) =>
    addProjectContentFact(
      facts,
      project,
      locale,
      "projectObjective",
      objective,
      `content.${locale}.caseStudy.objectives`,
      index,
    ),
  );
  addProjectContentFact(
    facts,
    project,
    locale,
    "projectApproach",
    caseStudy.approach ?? "",
    `content.${locale}.caseStudy.approach`,
  );
  addProjectContentFact(
    facts,
    project,
    locale,
    "projectArchitecture",
    caseStudy.architecture ?? "",
    `content.${locale}.caseStudy.architecture`,
  );
  caseStudy.architectureSteps?.forEach((step, index) =>
    addProjectContentFact(
      facts,
      project,
      locale,
      "projectArchitectureStep",
      step,
      `content.${locale}.caseStudy.architectureSteps`,
      index,
    ),
  );
  caseStudy.results?.forEach((result, index) =>
    addProjectContentFact(
      facts,
      project,
      locale,
      "projectResult",
      [result.label, result.value, result.description].filter(Boolean).join(": "),
      `content.${locale}.caseStudy.results`,
      index,
    ),
  );
}

function projectOverrideEvidence(projectId: string) {
  if (projectId === "medical-rag-platform") {
    return overrideEvidence("medical-rag-confirmations");
  }

  if (projectId === "syndismart-ai") {
    return overrideEvidence("syndismart-technology-status");
  }

  if (projectId === "callcenter-frustration-ai") {
    return overrideEvidence("call-center-technology-status");
  }

  return undefined;
}

export function normalizeProjects(projects: readonly Project[] = PROJECTS) {
  const entities: KnowledgeEntity[] = [];
  const facts: KnowledgeFact[] = [];
  const relations: KnowledgeRelation[] = [];

  projects
    .filter((project) => project.status === "published")
    .forEach((project) => {
      const projectEntity: KnowledgeEntity = {
        id: project.id,
        type: "project",
        canonicalName: project.content.fr.title,
        aliases: uniqueStrings([
          project.id,
          project.slug,
          project.content.fr.title,
          project.content.en?.title ?? "",
          ...(project.searchKeywords ?? []),
        ]),
        localeContent: {
          fr: {
            title: project.content.fr.title,
            description: project.content.fr.shortDescription,
            summary: project.content.fr.caseStudy?.overview,
          },
          en: {
            title: project.content.en?.title,
            description: project.content.en?.shortDescription,
            summary: project.content.en?.caseStudy?.overview,
          },
        },
        sourceRefs: [sourceRef("project", project.id)],
        metadata: {
          slug: project.slug,
          year: project.year,
          type: project.type,
          role: project.role,
          organization: project.organization,
          duration: project.duration,
          contributors: project.contributors ?? [],
          links: project.links,
          featured: project.featured,
          retrievalTerms: (project.searchKeywords ?? []).map((term) => ({
            term,
            evidence: {
              sourceType: "project",
              sourceId: project.id,
              field: "searchKeywords",
              strength: "retrieval-only",
            },
          })),
        },
      };

      entities.push(projectEntity);

      addProjectLocalizedContentFacts(facts, project, "fr", project.content.fr);
      addProjectLocalizedContentFacts(facts, project, "en", project.content.en);

      facts.push(
        {
          id: projectFactId(project.id, "year", "value"),
          subjectId: project.id,
          predicate: "year",
          value: project.year,
          status: project.year ? "verified" : "not-documented",
          evidence: project.year ? [projectEvidence(project, "year")] : [],
        },
        {
          id: projectFactId(project.id, "type", "value"),
          subjectId: project.id,
          predicate: "projectType",
          value: project.type,
          status: project.type ? "verified" : "not-documented",
          evidence: project.type ? [projectEvidence(project, "type")] : [],
        },
      );

      if (project.role) {
        facts.push({
          id: projectFactId(project.id, "role", "value"),
          subjectId: project.id,
          predicate: "role",
          value: project.role,
          status: "verified",
          evidence: [projectEvidence(project, "role")],
        });
      }

      if (project.duration) {
        facts.push({
          id: projectFactId(project.id, "duration", "value"),
          subjectId: project.id,
          predicate: "duration",
          value: project.duration,
          status: "verified",
          evidence: [projectEvidence(project, "duration")],
        });
      }

      const domainId = `domain:${project.domain}`;
      entities.push({
        id: domainId,
        type: "domain",
        canonicalName: PROJECT_DOMAIN_LABELS[project.domain],
        aliases: [project.domain, PROJECT_DOMAIN_LABELS[project.domain]],
        sourceRefs: [sourceRef("project", project.id, "domain")],
      });
      facts.push({
        id: projectFactId(project.id, "domain", project.domain),
        subjectId: project.id,
        predicate: "domain",
        value: domainId,
        status: "verified",
        evidence: [projectEvidence(project, "domain")],
      });
      relations.push({
        id: `relation:${project.id}:domain:${domainId}`,
        type: "project-domain",
        fromEntityId: project.id,
        toEntityId: domainId,
        predicate: "hasDomain",
        status: "verified",
        evidence: [projectEvidence(project, "domain")],
      });

      project.categories.forEach((category) => {
        const categoryId = `skill:${category.slug}`;
        entities.push({
          id: categoryId,
          type: "skill",
          canonicalName: category.name,
          aliases: [category.name, category.slug, category.id],
          sourceRefs: [sourceRef("project", project.id, "categories")],
        });
        facts.push({
          id: projectFactId(project.id, "category", category.slug),
          subjectId: project.id,
          predicate: "category",
          value: categoryId,
          status: "derived",
          evidence: [
            {
              sourceType: "project",
              sourceId: project.id,
              field: "categories",
              strength: "supporting",
            },
          ],
          tags: ["classification"],
        });
        relations.push({
          id: `relation:${project.id}:category:${categoryId}`,
          type: "project-category",
          fromEntityId: project.id,
          toEntityId: categoryId,
          predicate: "hasCategory",
          status: "derived",
          evidence: [
            {
              sourceType: "project",
              sourceId: project.id,
              field: "categories",
              strength: "supporting",
            },
          ],
        });
      });

      getProjectTechnologyNames(project).forEach((technologyName) => {
        const technology = canonicalizeTechnology(technologyName);
        const status = getTechnologyStatus(
          project.id,
          technologyName,
        ) as Exclude<KnowledgeVerificationStatus, "not-documented">;
        const override = projectOverrideEvidence(project.id);
        const evidence = [
          projectEvidence(
            project,
            project.technologies.some((item) => item.name === technologyName)
              ? "technologies"
              : "caseStudy",
          ),
          ...(override ? [override] : []),
        ];
        const factId = projectFactId(
          project.id,
          "usesTechnology",
          technology.id.replace("tech:", ""),
        );

        entities.push(createTechnologyEntity(technologyName));
        facts.push({
          id: factId,
          subjectId: project.id,
          predicate: "usesTechnology",
          value: technology.id,
          status,
          evidence,
        });
        relations.push({
          id: `relation:${project.id}:technology:${technology.id}`,
          type: "project-technology",
          fromEntityId: project.id,
          toEntityId: technology.id,
          predicate: "usesTechnology",
          status,
          evidence,
          metadata: {
            factId,
          },
        });
      });

      if (project.id === "medical-rag-platform") {
        medicalRagVerifiedCapabilities.forEach((capability) => {
          facts.push({
            id: projectFactId(project.id, "capability", toSlug(capability)),
            subjectId: project.id,
            predicate: "demonstratesCapability",
            value: capability,
            status: "verified",
            evidence: [
              projectEvidence(project, "content.fr.caseStudy"),
              overrideEvidence("medical-rag-confirmations"),
            ],
          });
        });
      }
    });

  return { entities, facts, relations };
}
