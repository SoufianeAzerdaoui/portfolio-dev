import type {
  CandidateFitFocus,
  DetectedEntity,
  IntentDetection,
  ProfileSkillCategory,
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

function queryText(query: NormalizedQuery) {
  return `${query.normalized} ${normalizeMatch(query.original)}`;
}

function detectProfileSkillCategory(
  query: NormalizedQuery,
  matchedEntities: readonly DetectedEntity[],
): ProfileSkillCategory | undefined {
  const text = queryText(query);
  const matchedEntityIds = new Set(matchedEntities.map((match) => match.entity.id));

  if (
    matchedEntityIds.has("domain:data-engineering") ||
    matchedEntityIds.has("skill:data-engineering") ||
    matchedEntityIds.has("skill:big-data") ||
    hasAny(query, [
      "data engineering",
      "ingenierie data",
      "ingenierie des donnees",
      "stack data",
      "data stack",
      "data engineer",
      "equipe data",
      "data team",
    ])
  ) {
    return "data-engineering";
  }

  if (
    matchedEntityIds.has("domain:ai-ml") ||
    matchedEntityIds.has("skill:nlp") ||
    matchedEntityIds.has("skill:rag") ||
    text.includes("genai") ||
    text.includes("gen ai") ||
    text.includes("nlp") ||
    text.includes("llm") ||
    text.includes("intelligence artificielle") ||
    text.includes(" ai ") ||
    text.includes(" ia ")
  ) {
    return "ai-nlp-genai";
  }

  if (
    text.includes("base de donnees") ||
    text.includes("bases de donnees") ||
    text.includes("database") ||
    text.includes("databases") ||
    text.includes("business intelligence") ||
    text.includes(" bi ") ||
    text.includes("power bi") ||
    text.includes("dax")
  ) {
    return "databases-bi";
  }

  if (
    text.includes("langage") ||
    text.includes("langages") ||
    text.includes("programming language") ||
    text.includes("programming languages")
  ) {
    return "programming-languages";
  }

  if (
    text.includes("cloud") ||
    text.includes("devops") ||
    text.includes("docker") ||
    text.includes("kubernetes") ||
    text.includes("digitalocean") ||
    text.includes("github actions") ||
    text.includes("bitbucket")
  ) {
    return "cloud-devops";
  }

  if (
    matchedEntityIds.has("domain:software-engineering") ||
    matchedEntityIds.has("skill:web-development") ||
    text.includes("web") ||
    text.includes("frontend") ||
    text.includes("backend") ||
    text.includes("fastapi") ||
    text.includes("spring boot") ||
    text.includes("angular") ||
    text.includes("react") ||
    text.includes("next js")
  ) {
    return "web-development";
  }

  if (
    text.includes("uml") ||
    text.includes("merise") ||
    text.includes("modelisation") ||
    text.includes("data modeling") ||
    text.includes("jira") ||
    text.includes("agile") ||
    text.includes("scrum") ||
    text.includes("methode") ||
    text.includes("method")
  ) {
    return "design-methods";
  }

  return undefined;
}

function hasTechnicalSkillsOverviewRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "competences techniques",
    "profil technique",
    "stack technique",
    "technical skills",
    "technical stack",
    "technical profile",
    "technologies travaille",
    "technologies maitrise",
    "technologies maîtrise",
    "what technologies does he know",
    "technologies is he familiar with",
    "outils maitrise",
    "outils maîtrise",
    "quels outils",
    "tools does he know",
  ].some((term) => text.includes(term));
}

function hasSkillCategoryRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "competences en",
    "et en",
    "et pour",
    "and in",
    "and for",
    "stack",
    "technologies en",
    "technologies maitrise",
    "technologies maîtrise",
    "quels outils",
    "outils maitrise",
    "outils maîtrise",
    "what technologies",
    "technologies does he know",
    "technologies is he familiar with",
    "what ai technologies",
    "skills in",
  ].some((term) => text.includes(term));
}

function hasRecruiterFitRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "apporter",
    "equipe",
    "équipe",
    "candidat",
    "candidate",
    "bon profil",
    "bon candidat",
    "good candidate",
    "profil pertinent",
    "profile relevant",
    "relevant profile",
    "pertinent pour",
    "good fit",
    "fit for",
    "why is he a good fit",
    "forces",
    "strength",
    "strengths",
    "strongest",
    "role",
    "poste",
    "stage",
    "internship",
    "hire",
    "recruter",
    "recruit",
    "plutot",
    "plutôt",
    "lean more",
    "more toward",
  ].some((term) => text.includes(term));
}

function detectCandidateFitFocus(query: NormalizedQuery): CandidateFitFocus | undefined {
  const text = queryText(query);
  const hasData =
    text.includes("data and ai") ||
    text.includes("data ai") ||
    text.includes("data & ai") ||
    text.includes("data and ia") ||
    text.includes("data ia") ||
    text.includes("data & ia") ||
    text.includes("data engineer") ||
    text.includes("data engineering") ||
    text.includes("equipe data") ||
    text.includes("data team");
  const hasAi =
    text.includes("ai engineer") ||
    text.includes("ia engineer") ||
    text.includes("ai engineering") ||
    text.includes("ia engineering") ||
    text.includes("intelligence artificielle") ||
    text.includes(" ia ") ||
    text.includes(" ai ") ||
    text.includes("nlp") ||
    text.includes("genai") ||
    text.includes("llm") ||
    text.includes("rag");

  if (
    text.includes("plutot") ||
    text.includes("plutôt") ||
    text.includes("lean more") ||
    text.includes("more toward") ||
    text.includes("rather data") ||
    text.includes("data engineer ou ai engineer") ||
    text.includes("data engineering or ai engineering")
  ) {
    return "comparison";
  }

  if (
    (hasData && hasAi) ||
    text.includes("data and ai") ||
    text.includes("data & ai") ||
    text.includes("data and ia") ||
    text.includes("data & ia")
  ) {
    return "data-ai";
  }

  if (hasAi) {
    return "ai-engineering";
  }

  if (hasData) {
    return "data-engineering";
  }

  if (
    text.includes("forces techniques") ||
    text.includes("strengths") ||
    text.includes("strongest technical")
  ) {
    return "technical-strengths";
  }

  return undefined;
}

function hasSkillLookupRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "connait",
    "connaît",
    "competences en",
    "competence en",
    "maitrise",
    "maîtrise",
    "expert",
    "does he know",
    "is he familiar with",
    "skills in",
  ].some((term) => text.includes(term));
}

function detectLanguageQueryKind(
  query: NormalizedQuery,
  matchedEntities: readonly DetectedEntity[],
) {
  const text = queryText(query);

  if (
    text.includes("langue maternelle") ||
    text.includes("native language") ||
    text.includes("mother tongue")
  ) {
    return "native" as const;
  }

  if (matchedEntities.some((match) => match.entity.type === "language")) {
    if (
      text.includes("parle") ||
      text.includes("speak") ||
      text.includes("speaks")
    ) {
      return "speaks" as const;
    }

    return "level" as const;
  }

  if (
    (text.includes("langues") || text.includes("languages")) &&
    (text.includes("parle") ||
      text.includes("speak") ||
      text.includes("niveau") ||
      text.includes("level"))
  ) {
    return "overview" as const;
  }

  return undefined;
}

function matchedSkillEntityId(matchedEntities: readonly DetectedEntity[]) {
  return (
    matchedEntities.find((match) => match.entity.type === "technology")?.entity
      .id ??
    matchedEntities.find((match) => match.entity.type === "skill")?.entity.id
  );
}

function matchedLanguageEntityId(matchedEntities: readonly DetectedEntity[]) {
  return matchedEntities.find((match) => match.entity.type === "language")?.entity
    .id;
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
  const skillCategory = detectProfileSkillCategory(query, matchedEntities);
  const languageQueryKind = detectLanguageQueryKind(query, matchedEntities);
  const candidateFitFocus = detectCandidateFitFocus(query);

  if (languageQueryKind === "overview") {
    return {
      intent: "language_overview",
      confidence: 0.95,
      reasons: ["language overview wording matched"],
      languageQueryKind,
    };
  }

  if (languageQueryKind) {
    return {
      intent: "language_lookup",
      confidence: 0.95,
      reasons: ["language lookup wording matched"],
      languageId: matchedLanguageEntityId(matchedEntities),
      languageQueryKind,
    };
  }

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

  if (entityTypes.has("project") && requestedProjectAttribute) {
    return {
      intent: "project_lookup",
      confidence: 0.91,
      reasons: ["project entity and requested project attribute matched"],
      requestedProjectAttribute,
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
    hasAny(query, ["atline", "chu", "alternance", "travaille"]) ||
    entityTypes.has("experience") ||
    entityTypes.has("organization")
  ) {
    return {
      intent: "experience_lookup",
      confidence: 0.86,
      reasons: ["experience or organization terms matched"],
    };
  }

  if ((candidateFitFocus || skillCategory) && hasRecruiterFitRequest(query)) {
    return {
      intent: "candidate_fit",
      confidence: 0.9,
      reasons: ["recruiter synthesis wording matched"],
      skillCategory,
      candidateFitFocus: candidateFitFocus ?? "technical-strengths",
    };
  }

  if (skillCategory && hasSkillCategoryRequest(query)) {
    return {
      intent: "skills_by_category",
      confidence: 0.9,
      reasons: ["profile skill category wording matched"],
      skillCategory,
    };
  }

  if (hasTechnicalSkillsOverviewRequest(query)) {
    return {
      intent: "technical_skills_overview",
      confidence: 0.92,
      reasons: ["technical skills overview wording matched"],
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
    entityTypes.has("technology") &&
    hasSkillLookupRequest(query) &&
    !hasAny(query, ["a-t-il utilise", "has he utilise"])
  ) {
    return {
      intent: "skill_lookup",
      confidence: 0.91,
      reasons: ["profile skill lookup wording matched"],
      normalizedSkillId: matchedSkillEntityId(matchedEntities),
      skillCategory,
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
