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
  GroundedProjectAttributeFocus,
  GroundedTechnologyExplanationFocus,
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function explanationKind(
  question: string,
): GroundedTechnologyExplanationFocus["explanationKind"] {
  const normalizedQuestion = normalizeText(question);

  if (
    [
      "instead of",
      "rather than",
      "au lieu de",
      "chosen",
      "selected",
      "choisi",
      "choisie",
      "why",
      "pourquoi",
    ].some((term) => normalizedQuestion.includes(term))
  ) {
    return "selection_rationale";
  }

  if (
    ["purpose", "objectif", "fonction", "utilise pour", "utilise for"].some(
      (term) => normalizedQuestion.includes(term),
    )
  ) {
    return "purpose";
  }

  return "role";
}

const SELECTION_RATIONALE_TERMS = [
  "rationale",
  "reason",
  "reasons",
  "because",
  "choice",
  "chosen",
  "selected",
  "raison",
  "raisons",
  "choix",
  "choisi",
  "choisie",
];

function buildProjectTechnologyExplanationFocus(
  input: GeneratePortfolioAnswerInput,
  entities: GroundedContext["entities"],
): GroundedTechnologyExplanationFocus | undefined {
  if (
    input.retrieval.intent !== "project_technology_explanation" &&
    input.retrieval.intent !== "technology_explanation"
  ) {
    return undefined;
  }

  const projectResults = input.retrieval.results.filter(
    (result) => result.entity.type === "project",
  );
  const project =
    projectResults.length === 1 ? projectResults[0]?.entity : undefined;
  const technology = input.retrieval.matchedEntities.find(
    (match) => match.entity.type === "technology",
  )?.entity;
  const documentedRoleFactIds = entities.flatMap((entity) =>
    entity.facts
      .filter((fact) => fact.status === "verified")
      .filter((fact) => {
        if (
          fact.predicate === "usesTechnology" &&
          typeof fact.value === "object" &&
          fact.value !== null &&
          "entityId" in fact.value &&
          (fact.value as { entityId?: unknown }).entityId === technology?.id
        ) {
          return true;
        }

        if (fact.predicate !== "demonstratesCapability") {
          return false;
        }

        const value = normalizeText(String(fact.value));

        return technology
          ? value.includes(normalizeText(technology.canonicalName))
          : false;
      })
      .map((fact) => fact.id),
  );
  const rationaleFactIds = entities.flatMap((entity) =>
    entity.facts
      .filter((fact) =>
        SELECTION_RATIONALE_TERMS.some((term) =>
          normalizeText(`${fact.predicate} ${String(fact.value)}`).includes(term),
        ),
      )
      .map((fact) => fact.id),
  );

  return {
    type: input.retrieval.intent,
    project: project
      ? {
          id: project.id,
          name: project.localeContent?.[input.locale]?.title ?? project.canonicalName,
        }
      : undefined,
    technology: technology
      ? {
          id: technology.id,
          name: technology.canonicalName,
        }
      : undefined,
    explanationKind: explanationKind(input.question),
    documentedRoleFactIds,
    selectionRationaleStatus:
      rationaleFactIds.length > 0 ? "documented" : "not-documented",
  };
}

function buildProjectAttributeFocus(
  input: GeneratePortfolioAnswerInput,
  entities: GroundedContext["entities"],
): GroundedProjectAttributeFocus | undefined {
  const attribute = input.retrieval.requestedProjectAttribute;

  if (input.retrieval.intent !== "project_lookup" || !attribute) {
    return undefined;
  }

  const projectResults = input.retrieval.results.filter(
    (result) => result.entity.type === "project",
  );
  const project =
    projectResults.length === 1 ? projectResults[0]?.entity : undefined;
  const factIds = entities.flatMap((entity) =>
    entity.facts
      .filter((fact) => fact.status === "verified")
      .map((fact) => fact.id),
  );

  return {
    type: "project_attribute",
    attribute,
    project: project
      ? {
          id: project.id,
          name: project.localeContent?.[input.locale]?.title ?? project.canonicalName,
        }
      : undefined,
    factIds,
  };
}

export function buildGroundedContext(
  input: GeneratePortfolioAnswerInput,
): GroundedContext {
  const entities = input.retrieval.results
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
    }));

  return {
    intent: input.retrieval.intent,
    requestedProjectAttribute: input.retrieval.requestedProjectAttribute,
    status: input.retrieval.status,
    notDocumented: input.retrieval.notDocumented,
    focus: buildProjectTechnologyExplanationFocus(input, entities),
    projectAttributeFocus: buildProjectAttributeFocus(input, entities),
    entities,
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
