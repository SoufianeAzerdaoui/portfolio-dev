import "server-only";

import { educationContentByLocale } from "@/content/education";
import { journeyExperiencesByLocale } from "@/content/journey";
import { portfolioContentByLocale } from "@/content/portfolio";
import { PROJECTS } from "@/features/projects/data/projects";
import type { KnowledgeSourceRef } from "@/features/portfolio-ai/knowledge/knowledge.types";

export const PERSON_ID = "person:soufiane-azerdaoui";

export const knowledgeSourceData = {
  portfolioContentByLocale,
  educationContentByLocale,
  journeyExperiencesByLocale,
  projects: PROJECTS,
} as const;

export function sourceRef(
  sourceType: KnowledgeSourceRef["sourceType"],
  sourceId: string,
  field?: string,
): KnowledgeSourceRef {
  return {
    id: `${sourceType}:${sourceId}${field ? `:${field}` : ""}`,
    sourceType,
    sourceId,
    field,
  };
}

export function buildKnownSourceRefs(): KnowledgeSourceRef[] {
  const refs: KnowledgeSourceRef[] = [
    sourceRef("portfolio", "identity"),
    sourceRef("portfolio", "about"),
    sourceRef("portfolio", "technical-skills"),
    sourceRef("portfolio", "languages"),
  ];

  knowledgeSourceData.educationContentByLocale.fr.items.forEach((_, index) => {
    refs.push(sourceRef("education", `item-${index}`));
  });

  knowledgeSourceData.journeyExperiencesByLocale.fr.forEach((experience) => {
    refs.push(sourceRef("journey", experience.id));
  });

  knowledgeSourceData.projects.forEach((project) => {
    refs.push(sourceRef("project", project.id));
  });

  refs.push(
    sourceRef("verification-override", "education-canonical-status"),
    sourceRef("verification-override", "atline-stack-2025"),
    sourceRef("verification-override", "business-intelligence-2024"),
    sourceRef("verification-override", "medical-rag-confirmations"),
    sourceRef("verification-override", "syndismart-technology-status"),
    sourceRef("verification-override", "call-center-technology-status"),
  );

  return refs;
}
