import type {
  CandidateFitFocus,
  CertificationQueryKind,
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
    text.includes("machine learning") ||
    text.includes("deep learning") ||
    text.includes(" ml ") ||
    text.includes(" dl ")
  ) {
    return "ml-deep-learning";
  }

  if (
    matchedEntityIds.has("skill:nlp") ||
    matchedEntityIds.has("skill:rag") ||
    text.includes("genai") ||
    text.includes("gen ai") ||
    text.includes("nlp") ||
    text.includes("traitement de texte") ||
    text.includes("text processing") ||
    text.includes("natural language processing") ||
    text.includes("llm") ||
    text.includes("rag") ||
    text.includes("intelligence artificielle") ||
    text.includes(" ai ") ||
    text.includes(" ia ")
  ) {
    return "nlp-llm-rag";
  }

  if (
    text.includes("business intelligence") ||
    text.includes(" bi ") ||
    text.includes("power bi") ||
    text.includes("dax") ||
    text.includes("pandas") ||
    text.includes("numpy") ||
    text.includes("data analysis") ||
    text.includes("analyse de donnees")
  ) {
    return "data-analysis-bi";
  }

  if (
    text.includes("base de donnees") ||
    text.includes("bases de donnees") ||
    text.includes("database") ||
    text.includes("databases") ||
    text.includes("mysql") ||
    text.includes("sql server") ||
    text.includes("mongodb") ||
    text.includes("sqlite") ||
    text.includes("qdrant")
  ) {
    return "databases";
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
    return "web-api";
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
    return "design-agile";
  }

  return undefined;
}

function hasTechnicalSkillsOverviewRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "competences principales",
    "principales competences",
    "quelles sont tes competences",
    "quelles sont ses competences",
    "quelles competences",
    "quel est ton stack",
    "quel est son stack",
    "main skills",
    "core skills",
    "primary skills",
    "what are your skills",
    "what are his skills",
    "what is your stack",
    "what is his stack",
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

function hasProgrammingLanguagesRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "langages de programmation",
    "langage de programmation",
    "langages programmation",
    "langage programmation",
    "programming languages",
    "programming language",
    "coding languages",
    "quels langages",
  ].some((term) => text.includes(term));
}

function hasCloudProviderRequest(query: NormalizedQuery) {
  const text = queryText(query);
  const asksProvider =
    text.includes("aws") ||
    text.includes("azure") ||
    text.includes("gcp") ||
    text.includes("google cloud") ||
    text.includes("cloud provider") ||
    text.includes("fournisseur cloud");

  return text.includes("cloud") && asksProvider;
}

function hasLatestProjectRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "dernier projet",
    "projet le plus recent",
    "projet le plus récent",
    "projet recent",
    "projet récent",
    "dernier projet realise",
    "dernier projet réalisé",
    "projet actuel",
    "latest project",
    "most recent project",
    "newest project",
    "most recent work",
  ].some((term) => text.includes(term));
}

function hasDomainProjectExperienceRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "deja travaille avec",
    "déjà travaillé avec",
    "as deja travaille avec",
    "as déjà travaillé avec",
    "worked with",
    "have you worked with",
    "has he worked with",
    "deja fait",
    "déjà fait",
    "traitement de texte",
    "text processing",
  ].some((term) => text.includes(term));
}

function hasProfileSummaryRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "qui est soufiane",
    "qui est soufiane azerdaoui",
    "qui es-tu",
    "qui es tu",
    "peux-tu te presenter",
    "peux tu te presenter",
    "presente-toi",
    "presente toi",
    "quel est ton profil",
    "quel est son profil",
    "parle-moi de ton profil",
    "parle moi de ton profil",
    "who is soufiane",
    "who is soufiane azerdaoui",
    "who are you",
    "tell me about yourself",
    "can you introduce yourself",
    "what is your profile",
    "what is his profile",
  ].some((term) => text.includes(term));
}

function hasJourneySummaryRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "presente ton parcours",
    "presente son parcours",
    "presenter ton parcours",
    "presenter son parcours",
    "quel est ton parcours",
    "quel est son parcours",
    "resume-moi ton parcours",
    "resume son parcours",
    "parcours en quelques lignes",
    "parcours professionnel",
    "quelle est ton experience",
    "quelle est son experience",
    "comment as-tu evolue",
    "comment a-t-il evolue",
    "summarize your background",
    "summarise your background",
    "summarize his background",
    "summarise his background",
    "what is your background",
    "what is his background",
    "professional journey",
    "career path",
  ].some((term) => text.includes(term));
}

function hasAvailabilityRequest(query: NormalizedQuery) {
  const text = queryText(query);

  if (
    [
      "disponibilite",
      "disponibilites",
      "disponible",
      "availability",
      "available",
      "starting when",
      "from when",
      "a partir de quand",
    ].some((term) => text.includes(term))
  ) {
    return true;
  }

  const contractMentions = [
    text.includes("stage") || text.includes("internship"),
    text.includes("alternance") || text.includes("apprenticeship"),
    text.includes("cdi") ||
      text.includes("full-time") ||
      text.includes("full time"),
  ].filter(Boolean).length;

  return (
    contractMentions > 0 &&
    (text.includes("/") ||
      (contractMentions >= 2 &&
        (text.includes(" or ") || text.includes(" ou "))))
  );
}

function hasCertificationRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "certification",
    "certifications",
    "certificat",
    "certificats",
    "certificate",
    "certificates",
    "credential",
    "credentials",
  ].some((term) => text.includes(term));
}

function detectCertificationQueryKind(query: NormalizedQuery): CertificationQueryKind {
  const text = queryText(query);

  if (
    [
      "quelles certifications",
      "quels certificats",
      "liste des certifications",
      "tes certifications",
      "ses certifications",
      "what certifications",
      "which certifications",
      "list certifications",
    ].some((term) => text.includes(term))
  ) {
    return "overview";
  }

  return "specific";
}

function hasCareerTargetRequest(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "quel type de poste recherches",
    "quel type de poste recherche",
    "quel poste recherches",
    "quel poste recherche",
    "quels postes t interessent",
    "quels postes l interessent",
    "quel stage recherches",
    "quel stage recherche",
    "objectif professionnel",
    "tu recherches plutot",
    "tu recherches plutôt",
    "what roles are you targeting",
    "what roles is he targeting",
    "what kind of internship are you looking for",
    "what kind of internship is he looking for",
    "what positions are you interested in",
    "what positions is he interested in",
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

function hasRecruiterSynthesisCue(query: NormalizedQuery) {
  const text = queryText(query);

  return [
    "pourquoi",
    "why",
    "pertinent",
    "relevant",
    "bon candidat",
    "good candidate",
    "bon profil",
    "good fit",
    "fit for",
    "candidat",
    "candidate",
    "forces",
    "strength",
    "strengths",
    "poste",
    "role",
    "plutot",
    "plutôt",
    "plus adapte",
    "plus adapté",
    "lean more",
    "rather",
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
    text.includes("plus adapte") ||
    text.includes("plus adapté") ||
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

  if (hasProgrammingLanguagesRequest(query)) {
    return {
      intent: "programming_languages_lookup",
      confidence: 0.96,
      reasons: ["programming languages wording matched"],
      skillCategory: "programming-languages",
    };
  }

  if (hasCloudProviderRequest(query)) {
    return {
      intent: "cloud_provider_lookup",
      confidence: 0.95,
      reasons: ["cloud provider wording matched"],
      skillCategory: "cloud-devops",
    };
  }

  if (hasLatestProjectRequest(query)) {
    return {
      intent: "latest_project_lookup",
      confidence: 0.95,
      reasons: ["latest project wording matched"],
      requestedProjectAttribute: "overview",
    };
  }

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

  if (hasAvailabilityRequest(query)) {
    return {
      intent: "availability_lookup",
      confidence: 0.94,
      reasons: ["availability wording matched"],
    };
  }

  if (hasCareerTargetRequest(query)) {
    return {
      intent: "career_target_lookup",
      confidence: 0.94,
      reasons: ["career target wording matched"],
    };
  }

  if (hasCertificationRequest(query)) {
    return {
      intent: "certification_lookup",
      confidence: 0.94,
      reasons: ["certification wording matched"],
      skillCategory,
      certificationQueryKind: detectCertificationQueryKind(query),
    };
  }

  if (hasProfileSummaryRequest(query)) {
    return {
      intent: "profile_lookup",
      confidence: 0.92,
      reasons: ["profile summary wording matched"],
    };
  }

  if (hasJourneySummaryRequest(query)) {
    return {
      intent: "journey_summary",
      confidence: 0.91,
      reasons: ["journey summary wording matched"],
    };
  }

  if (
    hasAny(query, [
      "formation",
      "etudes",
      "études",
      "etudies",
      "étudies",
      "ecole",
      "école",
      "master",
      "diplome",
      "education",
      "studies",
      "studying",
      "school",
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
    skillCategory &&
    hasDomainProjectExperienceRequest(query) &&
    ["ml-deep-learning", "nlp-llm-rag"].includes(skillCategory)
  ) {
    return {
      intent: "projects_by_domain",
      confidence: 0.9,
      reasons: ["domain project experience wording matched"],
      skillCategory,
    };
  }

  if (
    (candidateFitFocus || skillCategory) &&
    hasRecruiterFitRequest(query) &&
    hasRecruiterSynthesisCue(query)
  ) {
    return {
      intent: "candidate_fit",
      confidence: 0.91,
      reasons: ["recruiter synthesis wording matched before experience entity"],
      skillCategory,
      candidateFitFocus: candidateFitFocus ?? "technical-strengths",
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
      normalizedSkillId: matchedSkillEntityId(matchedEntities),
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
