import type {
  DetectedEntity,
  IntentDetection,
  NormalizedQuery,
  ProjectAttribute,
} from "@/features/portfolio-ai/retrieval/retrieval.types";

function hasAny(query: NormalizedQuery, terms: readonly string[]) {
  return terms.some((term) => query.normalized.includes(term));
}

function hasTechnologyAttributeRequest(query: NormalizedQuery) {
  return hasAny(query, [
    "technologie",
    "technologies",
    "tech stack",
    "stack",
    "tools",
    "tooling",
    "outils",
  ]);
}

function detectProjectAttribute(
  query: NormalizedQuery,
): ProjectAttribute | undefined {
  if (
    hasAny(query, [
      "objectif",
      "objectifs",
      "but",
      "a quoi sert le projet",
      "que cherche a faire le projet",
      "objective",
      "goal",
      "purpose",
      "what does the project aim to do",
    ])
  ) {
    return "objective";
  }

  if (
    hasAny(query, [
      "quel probleme",
      "problematique",
      "quel besoin",
      "what problem",
      "problem addressed",
      "what issue",
    ])
  ) {
    return "problem";
  }

  if (
    hasAny(query, [
      "architecture",
      "pipeline",
      "etapes",
      "workflow",
      "steps",
    ])
  ) {
    return "architecture";
  }

  if (
    hasAny(query, [
      "comment fonctionne",
      "fonctionnement",
      "comment marche",
      "comment a-t-il ete construit",
      "quelle approche",
      "how does it work",
      "how does",
      "how does the project work",
      "how was it built",
      "approach",
    ])
  ) {
    return "approach";
  }

  return undefined;
}

function hasTechnologyExplanationRequest(query: NormalizedQuery) {
  return hasAny(query, [
    "why",
    "pourquoi",
    "role",
    "rôle",
    "purpose",
    "objectif",
    "fonction",
    "utilise pour",
    "utilise for",
    "used for",
    "what was",
    "a quoi sert",
    "sert a",
    "choisi",
    "choisie",
    "chosen",
    "selected",
    "instead of",
    "rather than",
    "au lieu de",
    "over",
  ]);
}

function normalizeMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasSpecificProjectTechnologyPair(
  matchedEntities: readonly DetectedEntity[],
) {
  const technologyTerms = new Set(
    matchedEntities
      .filter((match) => match.entity.type === "technology")
      .flatMap((match) => [
        match.matchedAlias,
        match.entity.canonicalName,
        ...match.entity.aliases,
      ])
      .map(normalizeMatch),
  );

  return matchedEntities
    .filter((match) => match.entity.type === "project")
    .some((match) => !technologyTerms.has(normalizeMatch(match.matchedAlias)));
}

export function detectIntent(
  query: NormalizedQuery,
  matchedEntities: readonly DetectedEntity[] = [],
): IntentDetection {
  const entityTypes = new Set(matchedEntities.map((match) => match.entity.type));
  const requestedProjectAttribute = detectProjectAttribute(query);

  if (
    hasAny(query, ["compare", "comparer", "versus", " vs "]) &&
    matchedEntities.filter((match) =>
      ["project", "skill", "domain"].includes(match.entity.type),
    ).length >= 2
  ) {
    return {
      intent: "comparison",
      confidence: 0.95,
      reasons: ["comparison keyword with at least two project matches"],
    };
  }

  if (
    hasAny(query, [
      "formation",
      "master",
      "diplome",
      "education",
      "obtenu",
      "academic program",
      "current academic",
      "current program",
    ])
  ) {
    return {
      intent: "education_lookup",
      confidence: 0.9,
      reasons: ["education keywords matched"],
    };
  }

  if (
    entityTypes.has("technology") &&
    hasSpecificProjectTechnologyPair(matchedEntities) &&
    hasTechnologyExplanationRequest(query)
  ) {
    return {
      intent: "project_technology_explanation",
      confidence: 0.93,
      reasons: ["project, technology, and explanation wording matched"],
    };
  }

  if (entityTypes.has("technology") && hasTechnologyExplanationRequest(query)) {
    return {
      intent: "technology_explanation",
      confidence: 0.91,
      reasons: ["technology and explanation wording matched"],
    };
  }

  if (entityTypes.has("project") && hasTechnologyAttributeRequest(query)) {
    return {
      intent: "project_technology_lookup",
      confidence: 0.92,
      reasons: ["project entity and technology attribute wording matched"],
      requestedProjectAttribute: "technologies",
    };
  }

  if (entityTypes.has("project") && requestedProjectAttribute) {
    return {
      intent: "project_lookup",
      confidence: 0.91,
      reasons: ["project entity and requested project attribute matched"],
      requestedProjectAttribute,
    };
  }

  if (
    hasAny(query, [
      "projets utilisent",
      "projet utilise",
      "projects use",
      "used in projects",
    ]) &&
    entityTypes.has("technology")
  ) {
    return {
      intent: "projects_by_technology",
      confidence: 0.9,
      reasons: ["project and technology terms matched"],
    };
  }

  if (
    hasAny(query, ["projet", "projets", "project", "projects"]) &&
    (entityTypes.has("domain") || entityTypes.has("skill"))
  ) {
    return {
      intent: "projects_by_domain",
      confidence: 0.86,
      reasons: ["project and domain/category terms matched"],
    };
  }

  if (
    hasAny(query, ["atline", "chu", "stage", "alternance", "travaille"]) ||
    entityTypes.has("experience") ||
    entityTypes.has("organization")
  ) {
    return {
      intent: "experience_lookup",
      confidence: 0.86,
      reasons: ["experience or organization terms matched"],
    };
  }

  if (
    entityTypes.has("project") &&
    hasAny(query, [
      "presente",
      "parle",
      "que fait",
      "tell me about",
      "what does",
    ])
  ) {
    return {
      intent: "project_lookup",
      confidence: 0.9,
      reasons: ["project explanation wording with project entity matched"],
    };
  }

  if (
    hasAny(query, [
      "utilise",
      "used",
      "connais",
      "connaissance",
      "expert",
      "maitrise",
    ]) ||
    entityTypes.has("technology")
  ) {
    return {
      intent: "technology_evidence",
      confidence: entityTypes.has("technology") ? 0.88 : 0.68,
      reasons: ["technology usage wording matched"],
    };
  }

  if (entityTypes.has("project")) {
    return {
      intent: "project_lookup",
      confidence: 0.84,
      reasons: ["project entity matched"],
    };
  }

  if (
    hasAny(query, [
      "competences",
      "skills",
      "stack",
      "domaines techniques",
      "technical domains",
    ])
  ) {
    return {
      intent: "skills_overview",
      confidence: 0.7,
      reasons: ["skills overview keywords matched"],
    };
  }

  if (hasAny(query, ["parcours", "profile", "profil", "soufiane"])) {
    return {
      intent: "profile_lookup",
      confidence: 0.68,
      reasons: ["profile keywords matched"],
    };
  }

  return {
    intent: "unknown",
    confidence: 0.2,
    reasons: ["no deterministic intent rule matched"],
  };
}
