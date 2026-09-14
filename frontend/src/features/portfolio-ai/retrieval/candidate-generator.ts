import {
  getKnowledgeBase,
  type KnowledgeEntity,
  type KnowledgeEvidence,
  type KnowledgeFact,
  type KnowledgeRelation,
  type KnowledgeVerificationStatus,
} from "@/features/portfolio-ai/knowledge";
import { PERSON_ID } from "@/features/portfolio-ai/knowledge/knowledge.sources";
import type {
  CandidateFitFocus,
  DetectedEntity,
  IntentDetection,
  ProjectAttribute,
  ProfileSkillCategory,
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

const PROFILE_CATEGORY_RELATED_ENTITY_IDS: Record<
  ProfileSkillCategory,
  readonly string[]
> = {
  "data-engineering": [
    "domain:data-engineering",
    "skill:data-engineering",
    "skill:big-data",
  ],
  "ai-nlp-genai": [
    "domain:ai-ml",
    "skill:machine-learning",
    "skill:nlp",
    "skill:generative-ai",
    "skill:rag",
  ],
  "databases-bi": [
    "domain:data-analytics",
    "domain:business-intelligence",
  ],
  "programming-languages": ["domain:software-engineering"],
  "cloud-devops": [],
  "web-development": ["domain:software-engineering", "skill:web-development"],
  "design-methods": [],
};

const FIT_PROFILE_SKILL_IDS: Record<CandidateFitFocus, readonly string[]> = {
  "data-ai": [
    "tech:python",
    "tech:etl",
    "tech:data-warehousing",
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:scikit-learn",
    "tech:tensorflow",
    "tech:pytorch",
    "tech:rag-llm-systems",
    "tech:faiss",
    "tech:qdrant",
    "tech:whisper",
  ],
  "data-engineering": [
    "tech:python",
    "tech:sql",
    "tech:etl",
    "tech:data-warehousing",
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:hadoop",
    "tech:hdfs",
    "tech:mapreduce",
  ],
  "ai-engineering": [
    "tech:python",
    "tech:scikit-learn",
    "tech:xgboost",
    "tech:tensorflow",
    "tech:pytorch",
    "tech:hugging-face-transformers",
    "tech:rag-llm-systems",
    "tech:faiss",
    "tech:qdrant",
    "tech:whisper",
    "tech:ollama",
  ],
  "technical-strengths": [
    "tech:python",
    "tech:sql",
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:tensorflow",
    "tech:pytorch",
    "tech:rag-llm-systems",
    "tech:qdrant",
    "tech:fastapi",
    "tech:docker",
  ],
  comparison: [
    "tech:python",
    "tech:sql",
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:scikit-learn",
    "tech:tensorflow",
    "tech:pytorch",
    "tech:rag-llm-systems",
    "tech:faiss",
    "tech:qdrant",
  ],
};

const FIT_PROJECT_IDS: Record<CandidateFitFocus, readonly string[]> = {
  "data-ai": [
    "personalized-recommendation-system",
    "medical-rag-platform",
    "real-time-ecommerce-activity-tracking",
  ],
  "data-engineering": [
    "personalized-recommendation-system",
    "real-time-ecommerce-activity-tracking",
  ],
  "ai-engineering": [
    "medical-rag-platform",
    "syndismart-ai",
    "callcenter-frustration-ai",
  ],
  "technical-strengths": [
    "personalized-recommendation-system",
    "real-time-ecommerce-activity-tracking",
  ],
  comparison: [
    "personalized-recommendation-system",
    "real-time-ecommerce-activity-tracking",
    "medical-rag-platform",
    "syndismart-ai",
  ],
};

const FIT_EXPERIENCE_IDS: Record<CandidateFitFocus, readonly string[]> = {
  "data-ai": ["chu-mohammed-vi-pfe-2026", "pfe-business-intelligence-2024"],
  "data-engineering": ["pfe-business-intelligence-2024"],
  "ai-engineering": ["chu-mohammed-vi-pfe-2026"],
  "technical-strengths": ["pfe-business-intelligence-2024"],
  comparison: ["chu-mohammed-vi-pfe-2026", "pfe-business-intelligence-2024"],
};

const FIT_PROJECT_TECHNOLOGY_IDS: Record<CandidateFitFocus, readonly string[]> = {
  "data-ai": [
    "tech:python",
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:faiss",
    "tech:qdrant",
    "tech:whisper",
    "tech:tensorflow",
    "tech:pytorch",
  ],
  "data-engineering": [
    "tech:python",
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:etl",
    "tech:sql-server",
    "tech:power-bi",
  ],
  "ai-engineering": [
    "tech:python",
    "tech:faiss",
    "tech:qdrant",
    "tech:whisper",
    "tech:tensorflow",
    "tech:pytorch",
    "tech:hugging-face",
    "tech:ollama",
  ],
  "technical-strengths": [
    "tech:python",
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:faiss",
    "tech:qdrant",
    "tech:fastapi",
  ],
  comparison: [
    "tech:python",
    "tech:apache-spark",
    "tech:pyspark",
    "tech:apache-kafka",
    "tech:delta-lake",
    "tech:faiss",
    "tech:qdrant",
    "tech:tensorflow",
    "tech:pytorch",
  ],
};

function candidateFitFocus(intent: IntentDetection): CandidateFitFocus {
  return intent.candidateFitFocus ?? "technical-strengths";
}

function candidatesForProfileCategoryEvidence(
  category: ProfileSkillCategory,
  matchedEntities: readonly DetectedEntity[],
) {
  const knowledgeBase = getKnowledgeBase();
  const relatedEntityIds = new Set(PROFILE_CATEGORY_RELATED_ENTITY_IDS[category]);

  if (relatedEntityIds.size === 0) {
    return [];
  }

  return knowledgeBase.relations
    .filter(
      (relation) =>
        relatedEntityIds.has(relation.toEntityId) &&
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
        `profile skill category supporting evidence: ${category}`,
        45 + statusScore(relation.status),
      );
    })
    .filter((candidate): candidate is RetrievalCandidate =>
      Boolean(candidate),
    );
}

function candidatesForProfileSkillSubset(
  focus: CandidateFitFocus,
  matchedEntities: readonly DetectedEntity[],
) {
  const person = personProfileEntity();

  if (!person) {
    return [];
  }

  const acceptedSkillIds = new Set(FIT_PROFILE_SKILL_IDS[focus]);

  return [
    createCandidate(
      person,
      matchedEntities,
      `candidate fit profile skill evidence: ${focus}`,
      140,
      (fact) =>
        fact.predicate === "hasProfileSkill" &&
        isProfileSkillFactValue(fact.value) &&
        acceptedSkillIds.has(fact.value.entityId),
      () => false,
    ),
  ];
}

function candidatesForCurrentEducationSummary(
  matchedEntities: readonly DetectedEntity[],
) {
  const education = entityById("education-isima-siad-2026");

  if (!education) {
    return [];
  }

  return [
    createCandidate(
      education,
      matchedEntities,
      "candidate fit current education evidence",
      130,
      (fact) =>
        ["programme", "institution", "period", "educationStatus"].includes(
          fact.predicate,
        ),
      () => false,
    ),
  ];
}

function candidatesForCandidateFitExperiences(
  focus: CandidateFitFocus,
  matchedEntities: readonly DetectedEntity[],
) {
  return FIT_EXPERIENCE_IDS[focus]
    .map((experienceId, index) => {
      const entity = entityById(experienceId);

      if (!entity) {
        return undefined;
      }

      return createCandidate(
        entity,
        matchedEntities,
        `candidate fit professional evidence: ${focus}`,
        120 - index * 5,
        (fact) =>
          ["period", "role", "organization", "domain", "usesTechnology"].includes(
            fact.predicate,
          ),
        (relation) => relation.type === "experience-project",
      );
    })
    .filter((candidate): candidate is RetrievalCandidate =>
      Boolean(candidate),
    );
}

function projectCapabilityIsRelevant(fact: KnowledgeFact, focus: CandidateFitFocus) {
  if (fact.predicate !== "demonstratesCapability") {
    return false;
  }

  const value = normalizeText(String(fact.value));

  if (focus === "data-engineering") {
    return ["embeddings", "indexation", "retrieval"].some((term) =>
      value.includes(term),
    );
  }

  return [
    "extraction",
    "embeddings",
    "indexation",
    "retrieval",
    "contextualise",
    "sources",
  ].some((term) => value.includes(term));
}

function candidateFitProjectFact(
  fact: KnowledgeFact,
  focus: CandidateFitFocus,
) {
  if (fact.predicate === "projectShortDescription") {
    return true;
  }

  if (
    fact.predicate === "usesTechnology" &&
    typeof fact.value === "string" &&
    FIT_PROJECT_TECHNOLOGY_IDS[focus].includes(fact.value)
  ) {
    return true;
  }

  return projectCapabilityIsRelevant(fact, focus);
}

function candidatesForCandidateFitProjects(
  focus: CandidateFitFocus,
  matchedEntities: readonly DetectedEntity[],
) {
  return FIT_PROJECT_IDS[focus]
    .map((projectId, index) => {
      const entity = entityById(projectId);

      if (!entity) {
        return undefined;
      }

      return createCandidate(
        entity,
        matchedEntities,
        `candidate fit project evidence: ${focus}`,
        110 - index * 4,
        (fact) => candidateFitProjectFact(fact, focus),
        () => false,
      );
    })
    .filter((candidate): candidate is RetrievalCandidate =>
      Boolean(candidate),
    );
}

function candidatesForCandidateFit(
  intent: IntentDetection,
  matchedEntities: readonly DetectedEntity[],
) {
  const focus = candidateFitFocus(intent);

  return [
    ...candidatesForProfileSkillSubset(focus, matchedEntities),
    ...candidatesForCurrentEducationSummary(matchedEntities),
    ...candidatesForCandidateFitExperiences(focus, matchedEntities),
    ...candidatesForCandidateFitProjects(focus, matchedEntities),
  ].filter((candidate) => candidate.facts.length > 0);
}

type ProfileSkillFactValue = {
  entityId: string;
  name: string;
  category: ProfileSkillCategory;
};

type LanguageFactValue = {
  languageId: string;
  name: string;
  levelType: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProfileSkillFactValue(value: unknown): value is ProfileSkillFactValue {
  return (
    isRecord(value) &&
    typeof value.entityId === "string" &&
    typeof value.name === "string" &&
    typeof value.category === "string"
  );
}

function isLanguageFactValue(value: unknown): value is LanguageFactValue {
  return (
    isRecord(value) &&
    typeof value.languageId === "string" &&
    typeof value.name === "string" &&
    typeof value.levelType === "string"
  );
}

function personProfileEntity() {
  return entityById(PERSON_ID);
}

function candidatesForProfileSkills(
  matchedEntities: readonly DetectedEntity[],
  category?: ProfileSkillCategory,
) {
  const person = personProfileEntity();

  if (!person) {
    return [];
  }

  return [
    createCandidate(
      person,
      matchedEntities,
      category
        ? `profile technical skill category matched: ${category}`
        : "profile technical skills overview matched",
      95,
      (fact) =>
        fact.predicate === "hasProfileSkill" &&
        (!category ||
          (isProfileSkillFactValue(fact.value) &&
            fact.value.category === category)),
      () => false,
    ),
  ];
}

function candidatesForProfileSkillLookup(
  intent: IntentDetection,
  matchedEntities: readonly DetectedEntity[],
) {
  const person = personProfileEntity();
  const skillId =
    intent.normalizedSkillId ??
    matchedEntities.find((match) => match.entity.type === "technology")?.entity.id;

  if (!person || !skillId) {
    return [];
  }

  const profileCandidate = createCandidate(
    person,
    matchedEntities,
    "profile skill lookup matched",
    100,
    (fact) =>
      fact.predicate === "hasProfileSkill" &&
      isProfileSkillFactValue(fact.value) &&
      fact.value.entityId === skillId,
    () => false,
  );
  const technologyCandidates = candidatesForTechnology(
    matchedEntities.filter(
      (match) =>
        match.entity.type === "technology" && match.entity.id === skillId,
    ),
    false,
  );

  if (profileCandidate.facts.length === 0) {
    return technologyCandidates;
  }

  return [
    profileCandidate,
    ...technologyCandidates.filter((candidate) => candidate.status === "verified"),
  ];
}

function candidatesForLanguages(
  matchedEntities: readonly DetectedEntity[],
  languageId?: string,
  nativeOnly = false,
) {
  const person = personProfileEntity();

  if (!person) {
    return [];
  }

  return [
    createCandidate(
      person,
      matchedEntities,
      languageId
        ? `profile language lookup matched: ${languageId}`
        : "profile language overview matched",
      100,
      (fact) =>
        fact.predicate === "speaksLanguage" &&
        isLanguageFactValue(fact.value) &&
        (!languageId || fact.value.languageId === languageId) &&
        (!nativeOnly || fact.value.levelType === "native"),
      () => false,
    ),
  ];
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

  if (intent.intent === "candidate_fit") {
    candidates = [
      ...candidates,
      ...candidatesForCandidateFit(intent, matchedEntities),
    ];
  }

  if (intent.intent === "technical_skills_overview") {
    candidates = [...candidates, ...candidatesForProfileSkills(matchedEntities)];
  }

  if (intent.intent === "skills_by_category") {
    candidates = [
      ...candidates,
      ...candidatesForProfileSkills(matchedEntities, intent.skillCategory),
    ];
  }

  if (intent.intent === "skill_lookup") {
    candidates = [
      ...candidates,
      ...candidatesForProfileSkillLookup(intent, matchedEntities),
    ];
  }

  if (intent.intent === "language_overview") {
    candidates = [...candidates, ...candidatesForLanguages(matchedEntities)];
  }

  if (intent.intent === "language_lookup") {
    candidates = [
      ...candidates,
      ...candidatesForLanguages(
        matchedEntities,
        intent.languageId,
        intent.languageQueryKind === "native",
      ),
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
      ...(intent.skillCategory
        ? [
            ...candidatesForProfileSkills(matchedEntities, intent.skillCategory),
            ...candidatesForProfileCategoryEvidence(
              intent.skillCategory,
              matchedEntities,
            ),
          ]
        : []),
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
