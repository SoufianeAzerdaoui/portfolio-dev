import {
  getKnowledgeBase,
  type KnowledgeEntity,
  type KnowledgeEvidence,
  type KnowledgeFact,
  type KnowledgeRelation,
  type KnowledgeVerificationStatus,
} from "@/features/portfolio-ai/knowledge";
import type {
  DetectedEntity,
  IntentDetection,
  RetrievalCandidate,
} from "@/features/portfolio-ai/retrieval/retrieval.types";

function uniqueCandidates(items: readonly RetrievalCandidate[]) {
  return [...new Map(items.map((item) => [item.entity.id, item])).values()];
}

function uniqueEvidence(items: readonly KnowledgeEvidence[]) {
  return [
    ...new Map(
      items.map((item) => [
        `${item.sourceType}:${item.sourceId}:${item.field ?? ""}:${item.strength}`,
        item,
      ]),
    ).values(),
  ];
}

function combineStatus(
  facts: readonly KnowledgeFact[],
  relations: readonly KnowledgeRelation[],
): KnowledgeVerificationStatus {
  const statuses = [...facts, ...relations].map((item) => item.status);

  if (statuses.includes("verified")) {
    return "verified";
  }

  if (statuses.includes("ambiguous")) {
    return "ambiguous";
  }

  if (statuses.includes("derived")) {
    return "derived";
  }

  return "not-documented";
}

function statusScore(status: KnowledgeVerificationStatus) {
  if (status === "verified") {
    return 40;
  }

  if (status === "derived") {
    return 10;
  }

  if (status === "ambiguous") {
    return 2;
  }

  return 0;
}

function createCandidate(
  entity: KnowledgeEntity,
  matchedEntities: readonly DetectedEntity[],
  reason: string,
  baseScore = 0,
  factFilter?: (fact: KnowledgeFact) => boolean,
): RetrievalCandidate {
  const knowledgeBase = getKnowledgeBase();
  const facts = knowledgeBase.facts.filter(
    (fact) => fact.subjectId === entity.id && (!factFilter || factFilter(fact)),
  );
  const relations = knowledgeBase.relations.filter(
    (relation) =>
      relation.fromEntityId === entity.id || relation.toEntityId === entity.id,
  );
  const evidence = uniqueEvidence([
    ...facts.flatMap((fact) => fact.evidence),
    ...relations.flatMap((relation) => relation.evidence),
  ]);
  const status =
    facts.length > 0 ? combineStatus(facts, []) : combineStatus([], relations);
  const matchScore = matchedEntities
    .filter((match) => match.entity.id === entity.id)
    .reduce((score, match) => Math.max(score, match.score), 0);

  return {
    entity,
    facts,
    relations,
    evidence,
    status,
    matchedEntities: matchedEntities.filter(
      (match) => match.entity.id === entity.id,
    ),
    score: baseScore + matchScore + statusScore(status),
    reasons: [reason],
  };
}

function entityById(id: string) {
  return getKnowledgeBase().entities.find((entity) => entity.id === id);
}

function candidatesForTechnology(
  matchedEntities: readonly DetectedEntity[],
  projectsOnly: boolean,
) {
  const knowledgeBase = getKnowledgeBase();
  const technologyMatches = matchedEntities.filter(
    (match) => match.entity.type === "technology",
  );

  return technologyMatches.flatMap((technologyMatch) => {
    const evidenceItems =
      knowledgeBase.skillsIndex[technologyMatch.entity.id] ?? [];

    return evidenceItems
      .filter((item) => !projectsOnly || item.entityType === "project")
      .map((item) => {
        const entity = entityById(item.entityId);
        const fact = knowledgeBase.facts.find((entry) => entry.id === item.factId);

        if (!entity || !fact) {
          return undefined;
        }

        return createCandidate(
          entity,
          matchedEntities,
          `${item.status} technology evidence: ${technologyMatch.entity.canonicalName}`,
          technologyMatch.score + statusScore(item.status),
          (candidateFact) => candidateFact.id === fact.id,
        );
      })
      .filter((candidate): candidate is RetrievalCandidate =>
        Boolean(candidate),
      );
  });
}

function candidatesForDomainOrCategory(
  matchedEntities: readonly DetectedEntity[],
) {
  const knowledgeBase = getKnowledgeBase();
  const matches = matchedEntities.filter(
    (match) => match.entity.type === "domain" || match.entity.type === "skill",
  );

  return matches.flatMap((match) =>
    knowledgeBase.relations
      .filter(
        (relation) =>
          relation.toEntityId === match.entity.id &&
          (relation.type === "project-domain" ||
            relation.type === "project-category"),
      )
      .map((relation) => {
        const entity = entityById(relation.fromEntityId);

        if (!entity) {
          return undefined;
        }

        return createCandidate(
          entity,
          matchedEntities,
          `${relation.status} ${relation.type} relation: ${match.entity.canonicalName}`,
          match.score + 30 + statusScore(relation.status),
          (fact) => fact.value === match.entity.id,
        );
      })
      .filter((candidate): candidate is RetrievalCandidate =>
        Boolean(candidate),
      ),
  );
}

function candidatesForDirectEntities(
  matchedEntities: readonly DetectedEntity[],
  acceptedTypes: readonly KnowledgeEntity["type"][],
) {
  return matchedEntities
    .filter((match) => acceptedTypes.includes(match.entity.type))
    .map((match) =>
      createCandidate(match.entity, matchedEntities, match.reasons[0] ?? "entity matched"),
    );
}

function candidatesForCurrentEducation(
  matchedEntities: readonly DetectedEntity[],
) {
  const knowledgeBase = getKnowledgeBase();

  return knowledgeBase.facts
    .filter(
      (fact) =>
        fact.predicate === "educationStatus" && fact.value === "in_progress",
    )
    .map((fact) => entityById(fact.subjectId))
    .filter((entity): entity is KnowledgeEntity => Boolean(entity))
    .map((entity) =>
      createCandidate(
        entity,
        matchedEntities,
        "verified current education status",
        70,
      ),
    );
}

function candidatesForSkillsOverview() {
  const knowledgeBase = getKnowledgeBase();
  const relationCounts = knowledgeBase.relations.reduce<Record<string, number>>(
    (counts, relation) => {
      if (
        relation.type === "project-category" ||
        relation.type === "project-domain"
      ) {
        counts[relation.toEntityId] = (counts[relation.toEntityId] ?? 0) + 1;
      }

      return counts;
    },
    {},
  );

  return Object.entries(relationCounts)
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, 8)
    .map(([entityId, count]) => {
      const entity = entityById(entityId);

      if (!entity) {
        return undefined;
      }

      return createCandidate(
        entity,
        [],
        `frequent portfolio classification across ${count} projects`,
        35 + count * 4,
      );
    })
    .filter((candidate): candidate is RetrievalCandidate =>
      Boolean(candidate),
    );
}

function candidatesRelatedToOrganizations(
  matchedEntities: readonly DetectedEntity[],
) {
  const knowledgeBase = getKnowledgeBase();
  const organizationMatches = matchedEntities.filter(
    (match) => match.entity.type === "organization",
  );

  return organizationMatches.flatMap((match) =>
    knowledgeBase.relations
      .filter(
        (relation) =>
          relation.type === "experience-organization" &&
          relation.toEntityId === match.entity.id,
      )
      .map((relation) => {
        const entity = entityById(relation.fromEntityId);

        if (!entity) {
          return undefined;
        }

        return createCandidate(
          entity,
          matchedEntities,
          `direct organization relation: ${match.entity.canonicalName}`,
          match.score + 30 + statusScore(relation.status),
        );
      })
      .filter((candidate): candidate is RetrievalCandidate =>
        Boolean(candidate),
      ),
  );
}

function candidatesRelatedToExperiences(
  candidates: readonly RetrievalCandidate[],
) {
  const knowledgeBase = getKnowledgeBase();
  const experienceIds = new Set(
    candidates
      .filter((candidate) => candidate.entity.type === "experience")
      .map((candidate) => candidate.entity.id),
  );

  return knowledgeBase.relations
    .filter(
      (relation) =>
        relation.type === "experience-project" &&
        experienceIds.has(relation.fromEntityId),
    )
    .map((relation) => {
      const entity = entityById(relation.toEntityId);

      if (!entity) {
        return undefined;
      }

      return createCandidate(
        entity,
        [],
        `project directly linked to experience: ${relation.fromEntityId}`,
        30 + statusScore(relation.status),
      );
    })
    .filter((candidate): candidate is RetrievalCandidate =>
      Boolean(candidate),
    );
}

function candidatesForBusinessIntelligenceExperience(
  matchedEntities: readonly DetectedEntity[],
) {
  const knowledgeBase = getKnowledgeBase();

  if (
    !matchedEntities.some(
      (match) =>
        match.entity.id === "domain:business-intelligence" ||
        match.matchedAlias.toLowerCase().includes("business intelligence"),
    )
  ) {
    return [];
  }

  return knowledgeBase.facts
    .filter(
      (fact) =>
        fact.predicate === "domain" && fact.value === "Business Intelligence",
    )
    .map((fact) => entityById(fact.subjectId))
    .filter((entity): entity is KnowledgeEntity => Boolean(entity))
    .map((entity) =>
      createCandidate(
        entity,
        matchedEntities,
        "verified Business Intelligence domain override",
        70,
      ),
    );
}

export function generateCandidates(
  intent: IntentDetection,
  matchedEntities: readonly DetectedEntity[],
): RetrievalCandidate[] {
  const directProjectCandidates = candidatesForDirectEntities(matchedEntities, [
    "project",
  ]);
  const directExperienceCandidates = candidatesForDirectEntities(
    matchedEntities,
    ["experience"],
  );
  const directEducationCandidates = candidatesForDirectEntities(matchedEntities, [
    "education",
  ]);

  let candidates: RetrievalCandidate[] = [];

  if (
    intent.intent === "technology_evidence" ||
    intent.intent === "projects_by_technology"
  ) {
    candidates = [
      ...candidates,
      ...candidatesForTechnology(
        matchedEntities,
        intent.intent === "projects_by_technology",
      ),
    ];
  }

  if (intent.intent === "projects_by_domain") {
    candidates = [...candidates, ...candidatesForDomainOrCategory(matchedEntities)];
  }

  if (intent.intent === "experience_lookup") {
    const experienceCandidates = [
      ...directExperienceCandidates,
      ...candidatesRelatedToOrganizations(matchedEntities),
      ...candidatesForBusinessIntelligenceExperience(matchedEntities),
    ];

    candidates = [
      ...candidates,
      ...experienceCandidates,
      ...candidatesRelatedToExperiences(experienceCandidates),
    ];
  }

  if (intent.intent === "education_lookup") {
    candidates = [
      ...candidates,
      ...directEducationCandidates,
      ...candidatesForCurrentEducation(matchedEntities),
    ];
  }

  if (intent.intent === "project_lookup") {
    candidates = [...candidates, ...directProjectCandidates];
  }

  if (intent.intent === "comparison") {
    candidates = [
      ...candidates,
      ...directProjectCandidates,
      ...candidatesForDomainOrCategory(matchedEntities),
    ];
  }

  if (intent.intent === "skills_overview") {
    candidates = [
      ...candidates,
      ...candidatesForDirectEntities(matchedEntities, ["technology", "skill"]),
      ...candidatesForSkillsOverview(),
    ];
  }

  if (intent.intent === "profile_lookup") {
    candidates = [
      ...candidates,
      ...candidatesForDirectEntities(matchedEntities, ["person"]),
    ];
  }

  if (candidates.length === 0) {
    candidates = [
      ...directProjectCandidates,
      ...directExperienceCandidates,
      ...directEducationCandidates,
      ...candidatesForDomainOrCategory(matchedEntities),
    ];
  }

  return uniqueCandidates(candidates);
}
