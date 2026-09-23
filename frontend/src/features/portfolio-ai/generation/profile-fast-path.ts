import "server-only";

import { PERSON_ID } from "@/features/portfolio-ai/knowledge/knowledge.sources";
import { createEvidenceId } from "@/features/portfolio-ai/generation/build-grounded-context";
import {
  detectPortfolioAIResponseLanguage,
} from "@/features/portfolio-ai/generation/response-language";
import type {
  GeneratePortfolioAnswerInput,
  PortfolioAnswer,
} from "@/features/portfolio-ai/generation/generation.types";
import type {
  LanguageQueryKind,
  ProfileSkillCategory,
} from "@/features/portfolio-ai/retrieval";
import type { LocaleCode } from "@/types/portfolio";

type RetrievalFact =
  GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number];
type RetrievalResult =
  GeneratePortfolioAnswerInput["retrieval"]["results"][number];

type ProfileSkillFactValue = {
  entityId: string;
  name: string;
  category: ProfileSkillCategory;
  categoryLabel: Record<LocaleCode, string>;
};

type LanguageFactValue = {
  languageId: string;
  name: string;
  levelType: "native" | "cefr";
  cefrLevel?: string;
  display: Record<LocaleCode, string>;
};

type AvailabilityFactValue = {
  internship: {
    status: "documented";
    availableFrom: Record<LocaleCode, string>;
    targetAreas: readonly string[];
  };
  apprenticeship: {
    status: "not-documented";
  };
  fullTime: {
    status: "not-documented";
  };
};

type CareerTargetFactValue = {
  opportunityType: "internship";
  targetRoles: readonly string[];
};

type CertificationFactPair = {
  titleFact: RetrievalFact;
  issuerFact: RetrievalFact;
};

const DEFAULT_CATEGORY_LABELS: Record<
  ProfileSkillCategory,
  Record<LocaleCode, string>
> = {
  "data-engineering": {
    fr: "Data Engineering",
    en: "Data Engineering",
  },
  "ml-deep-learning": {
    fr: "ML & Deep Learning",
    en: "ML & Deep Learning",
  },
  "nlp-llm-rag": {
    fr: "NLP, LLM & RAG",
    en: "NLP, LLM & RAG",
  },
  "data-analysis-bi": {
    fr: "Data Analysis & BI",
    en: "Data Analysis & BI",
  },
  databases: {
    fr: "Bases de données",
    en: "Databases",
  },
  "programming-languages": {
    fr: "Langages",
    en: "Programming Languages",
  },
  "cloud-devops": {
    fr: "Cloud & DevOps",
    en: "Cloud & DevOps",
  },
  "web-api": {
    fr: "Web & API",
    en: "Web & API",
  },
  "design-agile": {
    fr: "Conception & Agile",
    en: "Design & Agile",
  },
};

const LANGUAGE_ORDER = [
  "language:arabic",
  "language:french",
  "language:english",
  "language:german",
];

const LANGUAGE_NAMES: Record<string, Record<LocaleCode, string>> = {
  "language:arabic": {
    fr: "arabe",
    en: "Arabic",
  },
  "language:french": {
    fr: "français",
    en: "French",
  },
  "language:english": {
    fr: "anglais",
    en: "English",
  },
  "language:german": {
    fr: "allemand",
    en: "German",
  },
};

const FRENCH_LANGUAGE_WITH_ARTICLE: Record<string, string> = {
  "language:arabic": "l'arabe",
  "language:french": "le français",
  "language:english": "l'anglais",
  "language:german": "l'allemand",
};

const FRENCH_LANGUAGE_AFTER_DE: Record<string, string> = {
  "language:arabic": "d'arabe",
  "language:french": "de français",
  "language:english": "d'anglais",
  "language:german": "d'allemand",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLocalizedLabel(value: unknown): value is Record<LocaleCode, string> {
  return (
    isRecord(value) &&
    typeof value.fr === "string" &&
    typeof value.en === "string"
  );
}

function isProfileSkillFactValue(
  value: unknown,
): value is ProfileSkillFactValue {
  return (
    isRecord(value) &&
    typeof value.entityId === "string" &&
    typeof value.name === "string" &&
    typeof value.category === "string" &&
    isLocalizedLabel(value.categoryLabel)
  );
}

function isLanguageFactValue(value: unknown): value is LanguageFactValue {
  return (
    isRecord(value) &&
    typeof value.languageId === "string" &&
    typeof value.name === "string" &&
    (value.levelType === "native" || value.levelType === "cefr") &&
    isLocalizedLabel(value.display)
  );
}

function isAvailabilityFactValue(
  value: unknown,
): value is AvailabilityFactValue {
  return (
    isRecord(value) &&
    isRecord(value.internship) &&
    value.internship.status === "documented" &&
    isRecord(value.internship.availableFrom) &&
    typeof value.internship.availableFrom.fr === "string" &&
    typeof value.internship.availableFrom.en === "string" &&
    Array.isArray(value.internship.targetAreas) &&
    isRecord(value.apprenticeship) &&
    value.apprenticeship.status === "not-documented" &&
    isRecord(value.fullTime) &&
    value.fullTime.status === "not-documented"
  );
}

function isCareerTargetFactValue(
  value: unknown,
): value is CareerTargetFactValue {
  return (
    isRecord(value) &&
    value.opportunityType === "internship" &&
    Array.isArray(value.targetRoles) &&
    value.targetRoles.every((item) => typeof item === "string")
  );
}

function profileFacts(input: GeneratePortfolioAnswerInput) {
  return (
    input.retrieval.results.find((result) => result.entity.id === PERSON_ID)
      ?.facts ?? []
  );
}

function profileSkillFacts(input: GeneratePortfolioAnswerInput) {
  return profileFacts(input)
    .filter(
      (fact) =>
        fact.predicate === "hasProfileSkill" &&
        fact.status === "verified" &&
        isProfileSkillFactValue(fact.value),
    )
    .map((fact) => ({
      fact,
      value: fact.value as ProfileSkillFactValue,
    }));
}

function languageFacts(input: GeneratePortfolioAnswerInput) {
  return profileFacts(input)
    .filter(
      (fact) =>
        fact.predicate === "speaksLanguage" &&
        fact.status === "verified" &&
        isLanguageFactValue(fact.value),
    )
    .map((fact) => ({
      fact,
      value: fact.value as LanguageFactValue,
    }));
}

function availabilityFact(input: GeneratePortfolioAnswerInput) {
  return profileFacts(input)
    .filter(
      (fact) =>
        fact.predicate === "hasAvailability" &&
        fact.status === "verified" &&
        isAvailabilityFactValue(fact.value),
    )
    .map((fact) => ({
      fact,
      value: fact.value as AvailabilityFactValue,
    }))[0];
}

function careerTargetFact(input: GeneratePortfolioAnswerInput) {
  return profileFacts(input)
    .filter(
      (fact) =>
        fact.predicate === "hasCareerTarget" &&
        fact.status === "verified" &&
        isCareerTargetFactValue(fact.value),
    )
    .map((fact) => ({
      fact,
      value: fact.value as CareerTargetFactValue,
    }))[0];
}

function certificationFacts(input: GeneratePortfolioAnswerInput) {
  return input.retrieval.results
    .filter((result) => result.entity.type === "certification")
    .map((result) => {
      const titleFact = result.facts.find(
        (fact) =>
          fact.predicate === "certificationTitle" &&
          fact.status === "verified" &&
          typeof fact.value === "string",
      );
      const issuerFact = result.facts.find(
        (fact) =>
          fact.predicate === "certificationIssuer" &&
          fact.status === "verified" &&
          typeof fact.value === "string",
      );

      return titleFact && issuerFact
        ? { titleFact, issuerFact }
        : undefined;
    })
    .filter((item): item is CertificationFactPair => Boolean(item));
}

function uniqueStrings(items: readonly string[]) {
  return [...new Set(items)];
}

function primaryEvidenceIds(facts: readonly RetrievalFact[]) {
  return uniqueStrings(
    facts.flatMap((fact) =>
      fact.evidence
        .filter((evidence) => evidence.strength === "primary")
        .map(createEvidenceId),
    ),
  );
}

function resultByEntityId(input: GeneratePortfolioAnswerInput, entityId: string) {
  return input.retrieval.results.find((result) => result.entity.id === entityId);
}

function factEvidenceForPredicates(
  result: RetrievalResult | undefined,
  predicates: readonly string[],
) {
  if (!result) {
    return [];
  }

  return primaryEvidenceIds(
    result.facts.filter((fact) => predicates.includes(fact.predicate)),
  );
}

function representativeExperienceEvidenceIds(input: GeneratePortfolioAnswerInput) {
  return [
    "atline-alternance-2025",
    "pfe-business-intelligence-2024",
    "chu-mohammed-vi-pfe-2026",
  ].flatMap((entityId) =>
    factEvidenceForPredicates(resultByEntityId(input, entityId), [
      "role",
      "domain",
      "organization",
      "usesTechnology",
    ]).slice(0, 1),
  );
}

function currentEducationEvidenceIds(input: GeneratePortfolioAnswerInput) {
  return factEvidenceForPredicates(
    resultByEntityId(input, "education-isima-siad-2026"),
    ["programme", "institution", "educationStatus", "period"],
  ).slice(0, 2);
}

function profileRoleEvidenceIds(input: GeneratePortfolioAnswerInput) {
  return primaryEvidenceIds(
    profileFacts(input).filter((fact) => fact.predicate === "hasRole"),
  );
}

function categoryLabel(
  category: ProfileSkillCategory,
  language: LocaleCode,
  factValue?: ProfileSkillFactValue,
) {
  return (
    factValue?.categoryLabel[language] ??
    DEFAULT_CATEGORY_LABELS[category][language]
  );
}

function joinEnglishList(items: readonly string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function joinFrenchList(items: readonly string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  return `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function asksForExpertise(input: GeneratePortfolioAnswerInput) {
  const normalizedQuestion = normalizeText(input.question);

  return [
    "expert",
    "expertise",
    "specialiste",
    "specialist",
    "senior",
    "niveau avance",
    "advanced level",
  ].some((term) => normalizedQuestion.includes(term));
}

function asksForTechnologyUsage(input: GeneratePortfolioAnswerInput) {
  const normalizedQuestion = normalizeText(input.question);

  return [
    "utilise",
    "utilisé",
    "travaille avec",
    "worked with",
    "has he used",
    "uses",
  ].some((term) => normalizedQuestion.includes(normalizeText(term)));
}

function answerForTechnicalSkillsOverview(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const skills = profileSkillFacts(input);

  if (skills.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const highlightedSkills = [
    "Apache Kafka",
    "Apache Spark",
    "PySpark",
    "Qdrant",
    "Power BI",
    "Python",
    "FastAPI",
    "Docker",
    "Kubernetes",
  ].filter((name) => skills.some((skill) => skill.value.name === name));
  const answer =
    language === "en"
      ? `His main skills cover Data Engineering, Data Science and AI, especially Machine Learning, Deep Learning, NLP and RAG/LLM systems. He also works with technologies such as ${highlightedSkills.join(", ")}.`
      : `Ses compétences principales couvrent le Data Engineering, la Data Science et l'IA, notamment le Machine Learning, le Deep Learning, le NLP et les systèmes RAG/LLM. Il travaille également avec des technologies comme ${highlightedSkills.join(", ")}.`;

  return {
    answer,
    usedEvidenceIds: primaryEvidenceIds(skills.map((skill) => skill.fact)),
    uncertainty: "none",
    language,
  };
}

function answerForProfileSummary(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const evidenceIds = uniqueStrings([
    ...profileRoleEvidenceIds(input),
    ...currentEducationEvidenceIds(input),
    ...primaryEvidenceIds(
      profileSkillFacts(input)
        .filter((skill) =>
          [
            "data-engineering",
            "ml-deep-learning",
            "nlp-llm-rag",
            "cloud-devops",
          ].includes(skill.value.category),
        )
        .slice(0, 3)
        .map((skill) => skill.fact),
    ),
    ...representativeExperienceEvidenceIds(input),
  ]);

  if (evidenceIds.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

  return {
    answer:
      language === "en"
        ? "Soufiane Azerdaoui is a Data & AI profile currently in Master 2 SIAD at ISIMA - Université Clermont Auvergne. His background combines software development, Business Intelligence, Data Engineering and Artificial Intelligence, with a particular interest in Machine Learning, NLP, RAG systems and data environments."
        : "Soufiane Azerdaoui est un profil Data & AI actuellement en Master 2 SIAD à l'ISIMA - Université Clermont Auvergne. Son parcours combine développement logiciel, Business Intelligence, Data Engineering et Intelligence Artificielle, avec un intérêt particulier pour le Machine Learning, le NLP, les systèmes RAG et les environnements Data.",
    usedEvidenceIds: evidenceIds.slice(0, 6),
    uncertainty: "none",
    language,
  };
}

function answerForJourneySummary(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const evidenceIds = uniqueStrings([
    ...currentEducationEvidenceIds(input),
    ...factEvidenceForPredicates(
      resultByEntityId(input, "education-ofppt-fullstack-2021"),
      ["programme", "institution", "period"],
    ).slice(0, 1),
    ...representativeExperienceEvidenceIds(input),
  ]);

  if (evidenceIds.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

  return {
    answer:
      language === "en"
        ? "Soufiane started with Full Stack development before moving toward Business Intelligence, then Data and Artificial Intelligence. He has worked on BI projects and on a multimodal RAG platform for medical reports. He is now pursuing a Master 2 SIAD at ISIMA - Université Clermont Auvergne."
        : "Soufiane a commencé son parcours par le développement Full Stack, avant de s'orienter vers la Business Intelligence puis la Data et l'Intelligence Artificielle. Il a notamment travaillé sur des projets de BI et sur une plateforme RAG multimodale appliquée aux rapports médicaux. Il poursuit aujourd'hui un Master 2 SIAD à l'ISIMA - Université Clermont Auvergne.",
    usedEvidenceIds: evidenceIds.slice(0, 6),
    uncertainty: "none",
    language,
  };
}

function requestedAvailabilityContracts(input: GeneratePortfolioAnswerInput) {
  const text = normalizeText(input.question);
  const asksInternship =
    text.includes("stage") || text.includes("internship");
  const asksApprenticeship =
    text.includes("alternance") || text.includes("apprenticeship");
  const asksFullTime =
    text.includes("cdi") ||
    text.includes("full-time") ||
    text.includes("full time");

  if (!asksInternship && !asksApprenticeship && !asksFullTime) {
    return {
      internship: true,
      apprenticeship: true,
      fullTime: true,
    };
  }

  return {
    internship: asksInternship,
    apprenticeship: asksApprenticeship,
    fullTime: asksFullTime,
  };
}

function answerForAvailability(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const availability = availabilityFact(input);

  if (!availability) {
    return undefined;
  }

  const evidenceIds = primaryEvidenceIds([availability.fact]);

  if (evidenceIds.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const requested = requestedAvailabilityContracts(input);
  const target =
    language === "en"
      ? availability.value.internship.targetAreas.join(" / ")
      : availability.value.internship.targetAreas.join(" / ");
  const parts: string[] = [];
  const asksForMixedComparison =
    [requested.internship, requested.apprenticeship, requested.fullTime].filter(
      Boolean,
    ).length > 1;

  if (asksForMixedComparison && requested.internship) {
    return {
      answer:
        language === "en"
          ? `Soufiane is looking for a ${target}-related internship from ${availability.value.internship.availableFrom.en}. His availability for an apprenticeship or a full-time role is not specified in the portfolio.`
          : `Soufiane recherche un stage en ${target} à partir d'${availability.value.internship.availableFrom.fr}. Sa disponibilité pour une alternance ou un CDI n'est pas précisée dans le portfolio.`,
      usedEvidenceIds: evidenceIds,
      uncertainty: "none",
      language,
    };
  }

  if (requested.internship) {
    parts.push(
      language === "en"
        ? `Soufiane is looking for a ${target}-related internship from ${availability.value.internship.availableFrom.en}.`
        : `Soufiane recherche un stage en ${target} à partir d'${availability.value.internship.availableFrom.fr}.`,
    );
  }

  if (requested.apprenticeship) {
    parts.push(
      language === "en"
        ? "Apprenticeship: this availability is not specified in the portfolio."
        : "Alternance : cette disponibilité n'est pas précisée dans le portfolio.",
    );
  }

  if (requested.fullTime) {
    parts.push(
      language === "en"
        ? "Full-time role: this availability is not specified in the portfolio."
        : "CDI : cette disponibilité n'est pas précisée dans le portfolio.",
    );
  }

  return {
    answer: parts.join(language === "en" ? " " : " "),
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}

function answerForCareerTarget(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const careerTarget = careerTargetFact(input);

  if (!careerTarget) {
    return undefined;
  }

  const evidenceIds = primaryEvidenceIds([careerTarget.fact]);

  if (evidenceIds.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const roles = careerTarget.value.targetRoles;

  return {
    answer:
      language === "en"
        ? `Soufiane is mainly targeting Data Engineering and AI Engineering internship opportunities, including roles such as ${joinEnglishList(roles)}.`
        : `Soufiane cible principalement des opportunités de stage en Data Engineering et AI Engineering, notamment pour des postes de ${joinFrenchList(roles)}.`,
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}

function certificationLabel(item: CertificationFactPair) {
  return `${String(item.titleFact.value)} — ${String(item.issuerFact.value)}`;
}

function answerForCertifications(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const certifications = certificationFacts(input);

  if (certifications.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const labels = certifications.map(certificationLabel);

  return {
    answer:
      language === "en"
        ? `Soufiane has certifications covering Data Engineering, Big Data, data preprocessing and Python: ${labels.join("; ")}.`
        : `Soufiane dispose de certifications couvrant le Data Engineering, le Big Data, la préparation de données et Python : ${labels.join(" ; ")}.`,
    usedEvidenceIds: primaryEvidenceIds(
      certifications.flatMap((item) => [item.titleFact, item.issuerFact]),
    ),
    uncertainty: "none",
    language,
  };
}

function answerForSkillsByCategory(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const category = input.retrieval.skillCategory;

  if (!category) {
    return undefined;
  }

  const skills = profileSkillFacts(input).filter(
    (skill) => skill.value.category === category,
  );

  if (skills.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const label = categoryLabel(category, language, skills[0]?.value);
  const names = skills.map((skill) => skill.value.name).join(", ");

  return {
    answer:
      language === "en"
        ? `In ${label}, his documented skills are: ${names}.`
        : `En ${label}, ses compétences documentées sont : ${names}.`,
    usedEvidenceIds: primaryEvidenceIds(skills.map((skill) => skill.fact)),
    uncertainty: "none",
    language,
  };
}

function answerForProgrammingLanguages(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const orderedLanguages = ["Python", "SQL", "Java", "TypeScript", "JavaScript", "PHP"];
  const skills = profileSkillFacts(input).filter(
    (skill) => skill.value.category === "programming-languages",
  );
  const skillNames = new Set(skills.map((skill) => skill.value.name));
  const languages = orderedLanguages.filter((name) => skillNames.has(name));
  const evidenceIds = primaryEvidenceIds(skills.map((skill) => skill.fact));

  if (languages.length === 0 || evidenceIds.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

  return {
    answer:
      language === "en"
        ? `Soufiane works with ${joinEnglishList(languages)}.`
        : `Soufiane travaille notamment avec ${joinFrenchList(languages)}.`,
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}

function answerForCloudProviders(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const skills = profileSkillFacts(input).filter(
    (skill) => skill.value.category === "cloud-devops",
  );
  const digitalOceanSkill = skills.find(
    (skill) => skill.value.name === "DigitalOcean",
  );

  if (!digitalOceanSkill) {
    return undefined;
  }

  const evidenceIds = primaryEvidenceIds([digitalOceanSkill.fact]);

  if (evidenceIds.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

  return {
    answer:
      language === "en"
        ? "AWS, Azure and GCP experience is not explicitly documented in the portfolio. DigitalOcean, however, is listed among the documented Cloud & DevOps technologies."
        : "Je n’ai pas d’expérience AWS, Azure ou GCP explicitement documentée dans le portfolio. En revanche, DigitalOcean figure dans les technologies Cloud & DevOps documentées.",
    usedEvidenceIds: evidenceIds,
    uncertainty: "ambiguous",
    language,
  };
}

function answerForSkillLookup(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const skillId = input.retrieval.normalizedSkillId;
  const skills = profileSkillFacts(input);
  const skill =
    skills.find((item) => item.value.entityId === skillId) ?? skills[0];

  if (!skill) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const label = categoryLabel(skill.value.category, language, skill.value);
  const evidenceIds = primaryEvidenceIds([skill.fact]);

  if (evidenceIds.length === 0) {
    return undefined;
  }

  if (asksForExpertise(input)) {
    return {
      answer:
        language === "en"
          ? `${skill.value.name} is listed among his ${label} skills, but the portfolio does not document an expertise level that would support calling him an expert.`
          : `${skill.value.name} figure parmi ses compétences ${label}, mais le portfolio ne documente pas un niveau permettant d'affirmer qu'il est expert.`,
      usedEvidenceIds: evidenceIds,
      uncertainty: "ambiguous",
      language,
    };
  }

  if (
    input.retrieval.intent === "technology_evidence" &&
    asksForTechnologyUsage(input)
  ) {
    return {
      answer:
        language === "en"
          ? `${skill.value.name} is listed among his ${label} skills, but the portfolio does not document project or experience usage for it.`
          : `${skill.value.name} figure parmi ses compétences ${label}, mais le portfolio ne documente pas son utilisation dans un projet ou une expérience.`,
      usedEvidenceIds: evidenceIds,
      uncertainty: "ambiguous",
      language,
    };
  }

  return {
    answer:
      language === "en"
        ? `Yes. ${skill.value.name} is listed among his ${label} skills.`
        : `Oui. ${skill.value.name} figure parmi ses compétences ${label}.`,
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}

function languageName(languageId: string, language: LocaleCode) {
  return (
    LANGUAGE_NAMES[languageId]?.[language] ?? languageId.replace("language:", "")
  );
}

function languageLevel(
  value: LanguageFactValue,
  language: LocaleCode,
) {
  if (value.levelType === "native") {
    return language === "en" ? "native" : "langue maternelle";
  }

  return value.cefrLevel ?? value.display[language];
}

function answerForLanguageOverview(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const facts = languageFacts(input);

  if (facts.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const orderedFacts = [...facts].sort(
    (left, right) =>
      LANGUAGE_ORDER.indexOf(left.value.languageId) -
      LANGUAGE_ORDER.indexOf(right.value.languageId),
  );
  return {
    answer:
      language === "en"
        ? `Soufiane speaks Arabic as his native language. His levels are French B2, English B1 and German B1.`
        : `Soufiane parle arabe comme langue maternelle. Il a un niveau B2 en français, B1 en anglais et B1 en allemand.`,
    usedEvidenceIds: primaryEvidenceIds(orderedFacts.map((item) => item.fact)),
    uncertainty: "none",
    language,
  };
}

function exactLanguageFact(
  input: GeneratePortfolioAnswerInput,
  queryKind?: LanguageQueryKind,
) {
  const facts = languageFacts(input);

  if (input.retrieval.languageId) {
    return facts.find(
      (item) => item.value.languageId === input.retrieval.languageId,
    );
  }

  if (queryKind === "native") {
    return facts.find((item) => item.value.levelType === "native");
  }

  return facts[0];
}

function answerForLanguageLookup(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  const languageFact = exactLanguageFact(
    input,
    input.retrieval.languageQueryKind,
  );

  if (!languageFact) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const evidenceIds = primaryEvidenceIds([languageFact.fact]);

  if (evidenceIds.length === 0) {
    return undefined;
  }

  if (languageFact.value.levelType === "native") {
    const frenchLanguage =
      FRENCH_LANGUAGE_WITH_ARTICLE[languageFact.value.languageId] ??
      languageName(languageFact.value.languageId, "fr");

    return {
      answer:
        language === "en"
          ? `Yes. ${languageName(languageFact.value.languageId, "en")} is his documented native language.`
          : `Oui. ${frenchLanguage} est sa langue maternelle documentée.`,
      usedEvidenceIds: evidenceIds,
      uncertainty: "none",
      language,
    };
  }

  const level = languageLevel(languageFact.value, language);
  const frenchLevelLabel =
    FRENCH_LANGUAGE_AFTER_DE[languageFact.value.languageId] ??
    `de ${languageName(languageFact.value.languageId, "fr")}`;
  const asksWhetherSpeaks = input.retrieval.languageQueryKind === "speaks";

  return {
    answer:
      language === "en"
        ? `${asksWhetherSpeaks ? "Yes. " : ""}His ${languageName(languageFact.value.languageId, "en")} level is ${level}.`
        : `${asksWhetherSpeaks ? "Oui. " : ""}Son niveau ${frenchLevelLabel} est ${level}.`,
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}

function asksDataEngineeringVsDataScience(input: GeneratePortfolioAnswerInput) {
  const normalizedQuestion = normalizeText(input.question);

  return (
    input.retrieval.intent === "candidate_fit" &&
    input.retrieval.candidateFitFocus === "comparison" &&
    normalizedQuestion.includes("data engineering") &&
    normalizedQuestion.includes("data science")
  );
}

function answerForDataEngineeringDataScienceComparison(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (!asksDataEngineeringVsDataScience(input)) {
    return undefined;
  }

  const evidenceIds = uniqueStrings([
    ...primaryEvidenceIds(
      profileSkillFacts(input)
        .filter((skill) =>
          [
            "data-engineering",
            "ml-deep-learning",
            "nlp-llm-rag",
            "data-analysis-bi",
          ].includes(skill.value.category),
        )
        .map((skill) => skill.fact),
    ).slice(0, 2),
    ...factEvidenceForPredicates(
      resultByEntityId(input, "personalized-recommendation-system"),
      ["projectShortDescription", "usesTechnology", "category"],
    ).slice(0, 1),
    ...factEvidenceForPredicates(
      resultByEntityId(input, "real-time-ecommerce-activity-tracking"),
      ["projectShortDescription", "usesTechnology", "category"],
    ).slice(0, 1),
    ...factEvidenceForPredicates(resultByEntityId(input, "algorithmic-trading-ml"), [
      "projectShortDescription",
      "category",
    ]).slice(0, 1),
    ...factEvidenceForPredicates(resultByEntityId(input, "callcenter-frustration-ai"), [
      "projectShortDescription",
      "category",
    ]).slice(0, 1),
  ]).slice(0, 5);

  if (evidenceIds.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

  return {
    answer:
      language === "en"
        ? "Soufiane's documented background has a particularly strong Data Engineering component: Spark/PySpark, Kafka, Delta Lake, ETL, Data Warehousing, BI/SQL work, plus projects such as Personalized Recommendation System and Real-time E-commerce Activity Tracking. It also includes Data Science and AI work through Machine Learning, NLP, RAG/LLM and projects such as Algorithmic Trading ML, Call Center AI, SyndiSmart AI and Medical RAG. Overall, the documented evidence leans slightly more toward Data Engineering, while still showing applied Machine Learning, NLP and AI experience."
        : "Son parcours présente une composante Data Engineering particulièrement marquée : Spark/PySpark, Kafka, Delta Lake, ETL, Data Warehousing, BI/SQL, avec des projets comme Personalized Recommendation System et Real-time E-commerce Activity Tracking. Il intègre aussi une composante Data Science et IA avec le Machine Learning, le NLP, le RAG/LLM et des projets comme Algorithmic Trading ML, Call Center AI, SyndiSmart AI et Medical RAG. Globalement, les preuves documentées penchent légèrement vers le Data Engineering, tout en montrant une pratique appliquée du Machine Learning, du NLP et de l’IA.",
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}

export function buildProfileFastPathAnswer(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (input.retrieval.notDocumented || input.retrieval.status !== "verified") {
    return undefined;
  }

  if (input.retrieval.intent === "technical_skills_overview") {
    return answerForTechnicalSkillsOverview(input);
  }

  if (input.retrieval.intent === "programming_languages_lookup") {
    return answerForProgrammingLanguages(input);
  }

  if (input.retrieval.intent === "cloud_provider_lookup") {
    return answerForCloudProviders(input);
  }

  if (input.retrieval.intent === "candidate_fit") {
    return answerForDataEngineeringDataScienceComparison(input);
  }

  if (input.retrieval.intent === "profile_lookup") {
    return answerForProfileSummary(input);
  }

  if (input.retrieval.intent === "journey_summary") {
    return answerForJourneySummary(input);
  }

  if (input.retrieval.intent === "availability_lookup") {
    return answerForAvailability(input);
  }

  if (input.retrieval.intent === "career_target_lookup") {
    return answerForCareerTarget(input);
  }

  if (input.retrieval.intent === "certification_lookup") {
    return answerForCertifications(input);
  }

  if (input.retrieval.intent === "skills_by_category") {
    return answerForSkillsByCategory(input);
  }

  if (input.retrieval.intent === "skill_lookup") {
    return answerForSkillLookup(input);
  }

  if (input.retrieval.intent === "technology_evidence") {
    const hasProjectOrExperienceEvidence = input.retrieval.results.some((result) =>
      ["project", "experience"].includes(result.entity.type),
    );

    return hasProjectOrExperienceEvidence ? undefined : answerForSkillLookup(input);
  }

  if (input.retrieval.intent === "language_overview") {
    return answerForLanguageOverview(input);
  }

  if (input.retrieval.intent === "language_lookup") {
    return answerForLanguageLookup(input);
  }

  return undefined;
}
