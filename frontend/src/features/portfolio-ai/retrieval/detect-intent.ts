import type {
  DetectedEntity,
  IntentDetection,
  NormalizedQuery,
} from "@/features/portfolio-ai/retrieval/retrieval.types";

function hasAny(query: NormalizedQuery, terms: readonly string[]) {
  return terms.some((term) => query.normalized.includes(term));
}

export function detectIntent(
  query: NormalizedQuery,
  matchedEntities: readonly DetectedEntity[] = [],
): IntentDetection {
  const entityTypes = new Set(matchedEntities.map((match) => match.entity.type));

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
