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
const MAX_CANDIDATE_FIT_CONTEXT_ENTITIES = 10;
const MAX_CONTEXT_FACTS_PER_ENTITY = 10;

type RetrievedFact =
  GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number];

const CANDIDATE_FIT_PROFILE_SKILL_PRIORITY = {
  "data-ai": [
    "tech:apache-spark",
    "tech:apache-kafka",
    "tech:rag-llm-systems",
    "tech:qdrant",
  ],
  "data-engineering": [
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
  ],
  "ai-engineering": [
    "tech:rag-llm-systems",
    "tech:qdrant",
    "tech:tensorflow",
    "tech:pytorch",
  ],
  "technical-strengths": [
    "tech:apache-spark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:python",
  ],
  comparison: [
    "tech:apache-spark",
    "tech:apache-kafka",
    "tech:rag-llm-systems",
    "tech:qdrant",
  ],
} as const;

const CANDIDATE_FIT_PROJECT_TECH_PRIORITY = {
  "data-ai": [
    "tech:apache-kafka",
    "tech:apache-spark",
    "tech:delta-lake",
    "tech:qdrant",
    "tech:faiss",
  ],
  "data-engineering": [
    "tech:apache-kafka",
    "tech:apache-spark",
    "tech:delta-lake",
    "tech:pyspark",
  ],
  "ai-engineering": [
    "tech:qdrant",
    "tech:faiss",
    "tech:whisper",
    "tech:tensorflow",
    "tech:pytorch",
  ],
  "technical-strengths": [
    "tech:apache-kafka",
    "tech:apache-spark",
    "tech:delta-lake",
  ],
  comparison: [
    "tech:apache-kafka",
    "tech:apache-spark",
    "tech:qdrant",
    "tech:faiss",
  ],
} as const;

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
  entities?: GroundedContext["entities"],
): GroundedEvidence[] {
  const allowedIds = entities
    ? new Set(entities.flatMap((entity) => entity.facts.flatMap((fact) => fact.evidenceIds)))
    : undefined;
  const allEvidence = input.retrieval.results.flatMap((result) => [
    ...result.evidence,
    ...result.facts.flatMap((fact) => fact.evidence),
    ...result.relations.flatMap((relation) => relation.evidence),
  ]);
  const byId = new Map<string, GroundedEvidence>();

  allEvidence.forEach((evidence) => {
    const id = createEvidenceId(evidence);

    if (allowedIds && !allowedIds.has(id)) {
      return;
    }

    byId.set(id, {
      id,
      sourceType: evidence.sourceType,
      sourceId: evidence.sourceId,
      field: evidence.field,
      strength: evidence.strength,
    });
  });

  return [...byId.values()];
}

function profileSkillId(fact: RetrievedFact) {
  if (
    fact.predicate !== "hasProfileSkill" ||
    typeof fact.value !== "object" ||
    fact.value === null ||
    !("entityId" in fact.value)
  ) {
    return undefined;
  }

  const entityId = (fact.value as { entityId?: unknown }).entityId;

  return typeof entityId === "string" ? entityId : undefined;
}

function factValueTechnologyId(fact: RetrievedFact) {
  return fact.predicate === "usesTechnology" && typeof fact.value === "string"
    ? fact.value
    : undefined;
}

function fieldMatchesLocale(field: string | undefined, locale: string) {
  if (!field) {
    return true;
  }

  return !field.includes("content.") || field.includes(`content.${locale}.`);
}

function factMatchesLocale(fact: RetrievedFact, locale: string) {
  return fact.evidence.some((evidence) =>
    fieldMatchesLocale(evidence.field, locale),
  );
}

function localizedDescriptionFacts(
  facts: readonly RetrievedFact[],
  locale: string,
) {
  return facts.filter(
    (fact) =>
      fact.predicate === "projectShortDescription" &&
      factMatchesLocale(fact, locale),
  );
}

function uniqueFacts(facts: readonly RetrievedFact[]) {
  return [...new Map(facts.map((fact) => [fact.id, fact])).values()];
}

function orderedProfileSkillFacts(
  facts: readonly RetrievedFact[],
  focus: NonNullable<GroundedContext["candidateFitFocus"]>,
) {
  const bySkillId = new Map(
    facts
      .map((fact) => [profileSkillId(fact), fact] as const)
      .filter((entry): entry is readonly [string, RetrievedFact] =>
        Boolean(entry[0]),
      ),
  );

  return CANDIDATE_FIT_PROFILE_SKILL_PRIORITY[focus]
    .map((skillId) => bySkillId.get(skillId))
    .filter((fact): fact is RetrievedFact => Boolean(fact));
}

function orderedTechnologyFacts(
  facts: readonly RetrievedFact[],
  focus: NonNullable<GroundedContext["candidateFitFocus"]>,
) {
  const byTechnologyId = new Map(
    facts
      .map((fact) => [factValueTechnologyId(fact), fact] as const)
      .filter((entry): entry is readonly [string, RetrievedFact] =>
        Boolean(entry[0]),
      ),
  );

  return CANDIDATE_FIT_PROJECT_TECH_PRIORITY[focus]
    .map((technologyId) => byTechnologyId.get(technologyId))
    .filter((fact): fact is RetrievedFact => Boolean(fact));
}

function selectCandidateFitFacts(
  entity: GeneratePortfolioAnswerInput["retrieval"]["results"][number]["entity"],
  facts: readonly RetrievedFact[],
  input: GeneratePortfolioAnswerInput,
) {
  const focus = input.retrieval.candidateFitFocus ?? "technical-strengths";

  if (entity.type === "person") {
    return orderedProfileSkillFacts(facts, focus);
  }

  if (entity.type === "education") {
    return uniqueFacts([
      ...facts.filter((fact) => fact.predicate === "programme").slice(0, 1),
      ...facts.filter((fact) => fact.predicate === "institution").slice(0, 1),
      ...facts.filter((fact) => fact.predicate === "educationStatus").slice(0, 1),
    ]);
  }

  if (entity.type === "experience") {
    return uniqueFacts([
      ...facts.filter((fact) => fact.predicate === "role").slice(0, 1),
      ...facts.filter((fact) => fact.predicate === "organization").slice(0, 1),
      ...facts.filter((fact) => fact.predicate === "domain").slice(0, 1),
      ...orderedTechnologyFacts(facts, focus).slice(0, 1),
    ]);
  }

  if (entity.type === "project") {
    return uniqueFacts([
      ...localizedDescriptionFacts(facts, input.locale).slice(0, 1),
      ...orderedTechnologyFacts(facts, focus).slice(0, 2),
      ...facts
        .filter((fact) => fact.predicate === "demonstratesCapability")
        .filter((fact) => factMatchesLocale(fact, input.locale))
        .slice(0, 1),
    ]);
  }

  return facts.slice(0, 3);
}

function selectGroundedFacts(
  result: GeneratePortfolioAnswerInput["retrieval"]["results"][number],
  input: GeneratePortfolioAnswerInput,
) {
  if (input.retrieval.intent === "candidate_fit") {
    return selectCandidateFitFacts(result.entity, result.facts, input);
  }

  return result.facts.slice(0, MAX_CONTEXT_FACTS_PER_ENTITY);
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
  const maxContextEntities =
    input.retrieval.intent === "candidate_fit"
      ? MAX_CANDIDATE_FIT_CONTEXT_ENTITIES
      : MAX_CONTEXT_ENTITIES;
  const entities = input.retrieval.results
    .slice(0, maxContextEntities)
    .map((result) => {
      const facts = selectGroundedFacts(result, input);

      return {
        id: result.entity.id,
        type: result.entity.type,
        name: result.entity.canonicalName,
        score: result.score,
        status: result.status,
        facts: facts.map(buildGroundedFact),
        relatedEntityIds: result.relations
          .filter((relation) => relation.type === "experience-project")
          .map((relation) =>
            relation.fromEntityId === result.entity.id
              ? relation.toEntityId
              : relation.fromEntityId,
          ),
        whyMatched: result.whyMatched,
      };
    })
    .filter((entity) => entity.facts.length > 0);

  return {
    intent: input.retrieval.intent,
    requestedProjectAttribute: input.retrieval.requestedProjectAttribute,
    skillCategory: input.retrieval.skillCategory,
    normalizedSkillId: input.retrieval.normalizedSkillId,
    languageId: input.retrieval.languageId,
    languageQueryKind: input.retrieval.languageQueryKind,
    candidateFitFocus: input.retrieval.candidateFitFocus,
    status: input.retrieval.status,
    notDocumented: input.retrieval.notDocumented,
    focus: buildProjectTechnologyExplanationFocus(input, entities),
    projectAttributeFocus: buildProjectAttributeFocus(input, entities),
    entities,
    evidence: buildEvidence(
      input,
      input.retrieval.intent === "candidate_fit" ? entities : undefined,
    ),
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
