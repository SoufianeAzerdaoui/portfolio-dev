import {
  canonicalEducationOverrides,
  experienceProjectOverrides,
  overrideEvidence,
} from "@/features/portfolio-ai/knowledge/knowledge.overrides";
import { PERSON_ID } from "@/features/portfolio-ai/knowledge/knowledge.sources";
import type {
  KnowledgeEntity,
  KnowledgeRelation,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

export function buildCoreRelations(
  entities: readonly KnowledgeEntity[],
): KnowledgeRelation[] {
  const relations: KnowledgeRelation[] = [];
  const projects = entities.filter((entity) => entity.type === "project");
  const experiences = entities.filter((entity) => entity.type === "experience");

  canonicalEducationOverrides.forEach((education) => {
    relations.push({
      id: `relation:${PERSON_ID}:education:${education.id}`,
      type: "person-education",
      fromEntityId: PERSON_ID,
      toEntityId: education.id,
      predicate: "hasEducation",
      status: "verified",
      evidence: [overrideEvidence("education-canonical-status")],
    });
  });

  experiences.forEach((experience) => {
    relations.push({
      id: `relation:${PERSON_ID}:experience:${experience.id}`,
      type: "person-experience",
      fromEntityId: PERSON_ID,
      toEntityId: experience.id,
      predicate: "hasExperience",
      status: "verified",
      evidence: experience.sourceRefs.map((source) => ({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        field: source.field,
        strength: "primary",
      })),
    });
  });

  projects.forEach((project) => {
    relations.push({
      id: `relation:${PERSON_ID}:project:${project.id}`,
      type: "person-project",
      fromEntityId: PERSON_ID,
      toEntityId: project.id,
      predicate: "hasProject",
      status: "verified",
      evidence: [
        {
          sourceType: "project",
          sourceId: project.id,
          strength: "primary",
        },
      ],
    });
  });

  experienceProjectOverrides.forEach((override) => {
    relations.push({
      id: `relation:${override.experienceId}:project:${override.projectId}`,
      type: "experience-project",
      fromEntityId: override.experienceId,
      toEntityId: override.projectId,
      predicate: "relatedProject",
      status: override.status,
      evidence: [overrideEvidence(override.sourceId)],
    });
  });

  return relations;
}
