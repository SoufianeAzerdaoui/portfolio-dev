import "server-only";

import { buildAliases, uniqueStrings } from "@/features/portfolio-ai/knowledge/build-aliases";
import { buildCoreRelations } from "@/features/portfolio-ai/knowledge/build-relations";
import { buildSkillsIndex } from "@/features/portfolio-ai/knowledge/build-skills-index";
import { normalizeEducation } from "@/features/portfolio-ai/knowledge/normalize-education";
import { normalizeExperiences } from "@/features/portfolio-ai/knowledge/normalize-experiences";
import { normalizeProfile } from "@/features/portfolio-ai/knowledge/normalize-profile";
import { normalizeProjects } from "@/features/portfolio-ai/knowledge/normalize-projects";
import { buildKnownSourceRefs } from "@/features/portfolio-ai/knowledge/knowledge.sources";
import type {
  KnowledgeBase,
  KnowledgeEntity,
  KnowledgeFact,
  KnowledgeRelation,
  KnowledgeSourceRef,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

function mergeSourceRefs(
  left: readonly KnowledgeSourceRef[],
  right: readonly KnowledgeSourceRef[],
) {
  const byId = new Map<string, KnowledgeSourceRef>();

  [...left, ...right].forEach((sourceRef) => {
    byId.set(sourceRef.id, sourceRef);
  });

  return [...byId.values()];
}

function dedupeEntities(entities: readonly KnowledgeEntity[]) {
  const byId = new Map<string, KnowledgeEntity>();

  entities.forEach((entity) => {
    const existing = byId.get(entity.id);

    if (!existing) {
      byId.set(entity.id, {
        ...entity,
        aliases: uniqueStrings(entity.aliases),
      });
      return;
    }

    byId.set(entity.id, {
      ...existing,
      aliases: uniqueStrings([
        existing.canonicalName,
        ...existing.aliases,
        entity.canonicalName,
        ...entity.aliases,
      ]),
      sourceRefs: mergeSourceRefs(existing.sourceRefs, entity.sourceRefs),
      metadata: {
        ...existing.metadata,
        ...entity.metadata,
      },
    });
  });

  return [...byId.values()];
}

function dedupeFacts(facts: readonly KnowledgeFact[]) {
  const byId = new Map<string, KnowledgeFact>();

  facts.forEach((fact) => {
    byId.set(fact.id, fact);
  });

  return [...byId.values()];
}

function dedupeRelations(relations: readonly KnowledgeRelation[]) {
  const byId = new Map<string, KnowledgeRelation>();

  relations.forEach((relation) => {
    byId.set(relation.id, relation);
  });

  return [...byId.values()];
}

export function buildKnowledgeBase(): KnowledgeBase {
  const profile = normalizeProfile();
  const education = normalizeEducation();
  const experiences = normalizeExperiences();
  const projects = normalizeProjects();

  const baseEntities = dedupeEntities([
    ...profile.entities,
    ...education.entities,
    ...experiences.entities,
    ...projects.entities,
  ]);
  const coreRelations = buildCoreRelations(baseEntities);
  const facts = dedupeFacts([
    ...profile.facts,
    ...education.facts,
    ...experiences.facts,
    ...projects.facts,
  ]);
  const relations = dedupeRelations([
    ...experiences.relations,
    ...projects.relations,
    ...coreRelations,
  ]);
  const entitiesById = new Map(baseEntities.map((entity) => [entity.id, entity]));

  return {
    entities: baseEntities,
    facts,
    relations,
    aliases: buildAliases(baseEntities),
    sourceRefs: buildKnownSourceRefs(),
    skillsIndex: buildSkillsIndex(facts, relations, entitiesById),
  };
}

export const knowledgeBase = buildKnowledgeBase();
