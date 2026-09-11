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
  ProjectAttribute,
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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function createCandidate(
  entity: KnowledgeEntity,
  matchedEntities: readonly DetectedEntity[],
  reason: string,
  baseScore = 0,
  factFilter?: (fact: KnowledgeFact) => boolean,
  relationFilter?: (relation: KnowledgeRelation) => boolean,
): RetrievalCandidate {
  const knowledgeBase = getKnowledgeBase();
  const facts = knowledgeBase.facts.filter(
    (fact) => fact.subjectId === entity.id && (!factFilter || factFilter(fact)),
  );
  const relations = knowledgeBase.relations.filter(
    (relation) =>
      (relation.fromEntityId === entity.id || relation.toEntityId === entity.id) &&
      (!relationFilter || relationFilter(relation)),
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

function isStrongProjectIdentityMatch(match: DetectedEntity) {
  return (
    match.entity.type === "project" &&
    (match.matchType === "exact-canonical" ||
      match.matchType === "exact-alias" ||
      match.matchType === "normalized-canonical" ||
      match.matchType === "normalized-alias")
  );
}

function resolvedProjectMatches(matchedEntities: readonly DetectedEntity[]) {
  const projectMatches = matchedEntities.filter(
    (match) => match.entity.type === "project",
  );
  const strongProjectMatches = projectMatches.filter(isStrongProjectIdentityMatch);

  return strongProjectMatches.length > 0 ? strongProjectMatches : projectMatches;
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

function candidatesForProjectTechnologyLookup(
  matchedEntities: readonly DetectedEntity[],
) {
  return resolvedProjectMatches(matchedEntities).map((match) =>
    createCandidate(
      match.entity,
      matchedEntities,
      "project technology attribute lookup matched",
      match.score + 70,
      (fact) => fact.predicate === "usesTechnology",
      (relation) => relation.type === "project-technology",
    ),
  );
}

const PROJECT_ATTRIBUTE_FACTS: Record<ProjectAttribute, readonly string[]> = {
  overview: [
    "projectOverview",
    "projectShortDescription",
    "projectProblem",
    "projectApproach",
  ],
  objective: [
    "projectObjective",
    "projectShortDescription",
    "projectOverview",
    "projectProblem",
    "projectApproach",
  ],
  problem: [
    "projectProblem",
    "projectContext",
    "projectOverview",
    "projectShortDescription",
  ],
  approach: [
    "projectApproach",
    "projectArchitecture",
    "projectArchitectureStep",
    "projectShortDescription",
  ],
  architecture: [
    "projectArchitecture",
    "projectArchitectureStep",
    "projectApproach",
    "projectShortDescription",
  ],
  technologies: ["usesTechnology"],
  results: ["projectResult"],
  role: ["role", "projectOverview"],
  metadata: ["year", "projectType", "role", "duration", "domain", "category"],
};

function attributeFactRank(attribute: ProjectAttribute, fact: KnowledgeFact) {
  const rank = PROJECT_ATTRIBUTE_FACTS[attribute].indexOf(fact.predicate);

  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank;
}

function matchesProjectAttributeFact(
  fact: KnowledgeFact,
  attribute: ProjectAttribute,
) {
  return PROJECT_ATTRIBUTE_FACTS[attribute].includes(fact.predicate);
}

function candidatesForProjectAttributeLookup(
  matchedEntities: readonly DetectedEntity[],
  attribute: ProjectAttribute,
) {
  return resolvedProjectMatches(matchedEntities).map((match) => {
    const candidate = createCandidate(
      match.entity,
      matchedEntities,
      `project ${attribute} attribute lookup matched`,
      match.score + 75,
      (fact) => matchesProjectAttributeFact(fact, attribute),
      () => false,
    );

    return {
      ...candidate,
      facts: [...candidate.facts].sort(
        (left, right) =>
          attributeFactRank(attribute, left) -
          attributeFactRank(attribute, right),
      ),
    };
  });
}

const ARCHITECTURE_EXPLANATION_TERMS = [
  "embedding",
  "embeddings",
  "indexation",
  "indexing",
  "retrieval",
  "llama",
  "source",
  "sources",
  "pipeline",
];

function includesNormalizedTerm(value: string, term: string) {
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(
    value,
  );
}

function factTechnologyName(fact: KnowledgeFact) {
  if (typeof fact.value !== "string") {
    return undefined;
  }

  return entityById(fact.value)?.canonicalName;
}

function isProjectTechnologyExplanationFact(
  fact: KnowledgeFact,
  technologyIds: ReadonlySet<string>,
) {
  if (fact.predicate === "usesTechnology" && typeof fact.value === "string") {
    if (technologyIds.has(fact.value)) {
      return true;
    }

    const technologyName = factTechnologyName(fact);

    return Boolean(
      technologyName &&
        fact.status === "verified" &&
        ARCHITECTURE_EXPLANATION_TERMS.some((term) =>
          includesNormalizedTerm(normalizeText(technologyName), term),
        ),
    );
  }

  if (fact.predicate !== "demonstratesCapability" || fact.status !== "verified") {
    return false;
  }

  const value = normalizeText(String(fact.value));

  return (
    [...technologyIds].some((technologyId) => {
      const technologyName = entityById(technologyId)?.canonicalName;

      return Boolean(
        technologyName && value.includes(normalizeText(technologyName)),
      );
    }) ||
    ARCHITECTURE_EXPLANATION_TERMS.some((term) =>
      includesNormalizedTerm(value, term),
    )
  );
}

function candidatesForProjectTechnologyExplanation(
  matchedEntities: readonly DetectedEntity[],
) {
  const technologyIds = new Set(
    matchedEntities
      .filter((match) => match.entity.type === "technology")
      .map((match) => match.entity.id),
  );

  if (technologyIds.size === 0) {
    return [];
  }

  return resolvedProjectMatches(matchedEntities).map((match) =>
    createCandidate(
      match.entity,
      matchedEntities,
      "project technology explanation matched",
      match.score + 80,
      (fact) => isProjectTechnologyExplanationFact(fact, technologyIds),
      (relation) =>
        relation.type === "project-technology" &&
        technologyIds.has(relation.toEntityId),
    ),
  );
}

function candidatesForTechnologyExplanation(
  matchedEntities: readonly DetectedEntity[],
) {
  const knowledgeBase = getKnowledgeBase();
  const technologyMatches = matchedEntities.filter(
    (match) => match.entity.type === "technology",
  );

  return technologyMatches.flatMap((technologyMatch) => {
    const verifiedProjectItems = (
      knowledgeBase.skillsIndex[technologyMatch.entity.id] ?? []
    )
      .filter((item) => item.entityType === "project" && item.status === "verified")
      .filter(
        (item, index, items) =>
          items.findIndex((candidate) => candidate.entityId === item.entityId) ===
          index,
      );
    const technologyIds = new Set([technologyMatch.entity.id]);

    return verifiedProjectItems
      .map((item) => entityById(item.entityId))
      .filter((entity): entity is KnowledgeEntity => Boolean(entity))
      .map((entity) =>
        createCandidate(
          entity,
          matchedEntities,
          `verified technology explanation evidence: ${technologyMatch.entity.canonicalName}`,
          technologyMatch.score + 80,
          (fact) => isProjectTechnologyExplanationFact(fact, technologyIds),
          (relation) =>
            relation.type === "project-technology" &&
            relation.toEntityId === technologyMatch.entity.id,
        ),
      );
  });
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

  if (intent.intent === "project_technology_lookup") {
    candidates = [
      ...candidates,
      ...candidatesForProjectTechnologyLookup(matchedEntities),
    ];
  }

  if (intent.intent === "project_technology_explanation") {
    candidates = [
      ...candidates,
      ...candidatesForProjectTechnologyExplanation(matchedEntities),
    ];
  }

  if (intent.intent === "technology_explanation") {
    candidates = [
      ...candidates,
      ...candidatesForTechnologyExplanation(matchedEntities),
    ];
  }

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
    candidates = [
      ...candidates,
      ...(intent.requestedProjectAttribute
        ? candidatesForProjectAttributeLookup(
            matchedEntities,
            intent.requestedProjectAttribute,
          )
        : candidatesForDirectEntities(
            resolvedProjectMatches(matchedEntities),
            ["project"],
          )),
    ];
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
