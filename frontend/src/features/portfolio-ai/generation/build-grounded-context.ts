import "server-only";

import {
  getEntityById,
  type KnowledgeEvidence,
} from "@/features/portfolio-ai/knowledge";
import type {
  GeneratePortfolioAnswerInput,
  GroundedContext,
  GroundedEvidence,
  GroundedFact,
} from "@/features/portfolio-ai/generation/generation.types";

const MAX_CONTEXT_ENTITIES = 5;
const MAX_CONTEXT_FACTS_PER_ENTITY = 10;

function sanitizeEvidencePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createEvidenceId(evidence: KnowledgeEvidence) {
  return [
    "ev",
    evidence.sourceType,
    sanitizeEvidencePart(evidence.sourceId),
    sanitizeEvidencePart(evidence.field ?? "root"),
    evidence.strength,
  ].join(":");
}

function normalizeValue(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const entity = getEntityById(value);

  if (!entity) {
    return value;
  }

  return {
    entityId: entity.id,
    name: entity.canonicalName,
    type: entity.type,
  };
}

function buildGroundedFact(
  fact: GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number],
): GroundedFact {
  return {
    id: fact.id,
    predicate: fact.predicate,
    value: normalizeValue(fact.value),
    status: fact.status,
    evidenceIds: fact.evidence.map(createEvidenceId),
  };
}

function buildEvidence(
  input: GeneratePortfolioAnswerInput,
): GroundedEvidence[] {
  const allEvidence = input.retrieval.results.flatMap((result) => [
    ...result.evidence,
    ...result.facts.flatMap((fact) => fact.evidence),
    ...result.relations.flatMap((relation) => relation.evidence),
  ]);
  const byId = new Map<string, GroundedEvidence>();

  allEvidence.forEach((evidence) => {
    byId.set(createEvidenceId(evidence), {
      id: createEvidenceId(evidence),
      sourceType: evidence.sourceType,
      sourceId: evidence.sourceId,
      field: evidence.field,
      strength: evidence.strength,
    });
  });

  return [...byId.values()];
}

export function buildGroundedContext(
  input: GeneratePortfolioAnswerInput,
): GroundedContext {
  return {
    intent: input.retrieval.intent,
    status: input.retrieval.status,
    notDocumented: input.retrieval.notDocumented,
    entities: input.retrieval.results
      .slice(0, MAX_CONTEXT_ENTITIES)
      .map((result) => ({
        id: result.entity.id,
        type: result.entity.type,
        name: result.entity.canonicalName,
        score: result.score,
        status: result.status,
        facts: result.facts
          .slice(0, MAX_CONTEXT_FACTS_PER_ENTITY)
          .map(buildGroundedFact),
        relatedEntityIds: result.relations
          .filter((relation) => relation.type === "experience-project")
          .map((relation) =>
            relation.fromEntityId === result.entity.id
              ? relation.toEntityId
              : relation.fromEntityId,
          ),
        whyMatched: result.whyMatched,
      })),
    evidence: buildEvidence(input),
    policy: {
      verified: "May be stated as a fact.",
      derived: "Use only for classification or framing.",
      ambiguous: "Mention as not sufficiently verified, never as confirmed.",
      notDocumented: "State that the portfolio does not document it.",
    },
  };
}

export function getAllowedEvidenceIds(context: GroundedContext) {
  return context.evidence.map((evidence) => evidence.id);
}

export function measureGroundedContextSize(context: GroundedContext) {
  return JSON.stringify(context).length;
}
