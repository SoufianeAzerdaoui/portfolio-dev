import "server-only";

import { normalizeAlias } from "@/features/portfolio-ai/knowledge/build-aliases";
import { canonicalizeTechnology } from "@/features/portfolio-ai/knowledge/build-skills-index";
import { knowledgeBase } from "@/features/portfolio-ai/knowledge/knowledge.registry";
import { validateKnowledgeBase } from "@/features/portfolio-ai/knowledge/knowledge.validate";
import type {
  EducationStatus,
  KnowledgeEntity,
  KnowledgeVerificationStatus,
  TechnologyEvidenceItem,
  TechnologyEvidenceResult,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

export { buildKnowledgeBase, knowledgeBase } from "@/features/portfolio-ai/knowledge/knowledge.registry";
export { validateKnowledgeBase } from "@/features/portfolio-ai/knowledge/knowledge.validate";
export type {
  EducationStatus,
  KnowledgeBase,
  KnowledgeEntity,
  KnowledgeEntityType,
  KnowledgeEvidence,
  KnowledgeEvidenceStrength,
  KnowledgeFact,
  KnowledgeRelation,
  KnowledgeRelationType,
  KnowledgeSourceRef,
  KnowledgeSourceType,
  KnowledgeValidationIssue,
  KnowledgeValidationResult,
  KnowledgeVerificationStatus,
  TechnologyEvidenceItem,
  TechnologyEvidenceResult,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

function statusFromEvidence(
  evidence: readonly TechnologyEvidenceItem[],
): KnowledgeVerificationStatus {
  if (evidence.some((item) => item.status === "verified")) {
    return "verified";
  }

  if (evidence.some((item) => item.status === "ambiguous")) {
    return "ambiguous";
  }

  if (evidence.some((item) => item.status === "derived")) {
    return "derived";
  }

  return "not-documented";
}

export function getKnowledgeBase() {
  return knowledgeBase;
}

export function getEntityById(id: string) {
  return knowledgeBase.entities.find((entity) => entity.id === id);
}

export function findEntitiesByAlias(alias: string): KnowledgeEntity[] {
  const entityIds = knowledgeBase.aliases[normalizeAlias(alias)] ?? [];

  return entityIds
    .map((id) => getEntityById(id))
    .filter((entity): entity is KnowledgeEntity => Boolean(entity));
}

export function getFactsForEntity(entityId: string) {
  return knowledgeBase.facts.filter((fact) => fact.subjectId === entityId);
}

export function getEvidenceForTechnology(
  technologyName: string,
  options: { verifiedOnly?: boolean } = {},
): TechnologyEvidenceResult {
  const technology = canonicalizeTechnology(technologyName);
  const evidence = knowledgeBase.skillsIndex[technology.id] ?? [];
  const filteredEvidence = options.verifiedOnly
    ? evidence.filter((item) => item.status === "verified")
    : evidence;

  return {
    technologyId: technology.id,
    canonicalName:
      getEntityById(technology.id)?.canonicalName ?? technology.canonicalName,
    status: statusFromEvidence(filteredEvidence),
    evidence: filteredEvidence,
  };
}

export function getProjectsUsingTechnology(
  technologyName: string,
  options: { verifiedOnly?: boolean } = {},
) {
  return getEvidenceForTechnology(technologyName, options).evidence.filter(
    (item) => item.entityType === "project",
  );
}

export function getExperiencesUsingTechnology(
  technologyName: string,
  options: { verifiedOnly?: boolean } = {},
) {
  return getEvidenceForTechnology(technologyName, options).evidence.filter(
    (item) => item.entityType === "experience",
  );
}

export function getRelatedProjectsForExperience(experienceId: string) {
  return knowledgeBase.relations
    .filter(
      (relation) =>
        relation.type === "experience-project" &&
        relation.fromEntityId === experienceId,
    )
    .map((relation) => getEntityById(relation.toEntityId))
    .filter((entity): entity is KnowledgeEntity => Boolean(entity));
}

export function getEducationByStatus(status: EducationStatus) {
  const matchingEducationIds = new Set(
    knowledgeBase.facts
      .filter(
        (fact) =>
          fact.predicate === "educationStatus" && fact.value === status,
      )
      .map((fact) => fact.subjectId),
  );

  return knowledgeBase.entities.filter(
    (entity) => entity.type === "education" && matchingEducationIds.has(entity.id),
  );
}

export function validateCurrentKnowledgeBase() {
  return validateKnowledgeBase(knowledgeBase);
}
