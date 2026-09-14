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

const PROFILE_SKILL_CATEGORY_ORDER: ProfileSkillCategory[] = [
  "data-engineering",
  "ai-nlp-genai",
  "databases-bi",
  "programming-languages",
  "cloud-devops",
  "web-development",
  "design-methods",
];

const DEFAULT_CATEGORY_LABELS: Record<
  ProfileSkillCategory,
  Record<LocaleCode, string>
> = {
  "data-engineering": {
    fr: "Data Engineering",
    en: "Data Engineering",
  },
  "ai-nlp-genai": {
    fr: "IA / NLP / GenAI",
    en: "AI / NLP / GenAI",
  },
  "databases-bi": {
    fr: "Bases de données & BI",
    en: "Databases & BI",
  },
  "programming-languages": {
    fr: "Langages",
    en: "Programming languages",
  },
  "cloud-devops": {
    fr: "Cloud & DevOps",
    en: "Cloud & DevOps",
  },
  "web-development": {
    fr: "Développement web",
    en: "Web development",
  },
  "design-methods": {
    fr: "Conception & méthodes",
    en: "Design & methods",
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
  const sections = PROFILE_SKILL_CATEGORY_ORDER.map((category) => {
    const categorySkills = skills.filter(
      (skill) => skill.value.category === category,
    );

    if (categorySkills.length === 0) {
      return undefined;
    }

    return `${categoryLabel(category, language, categorySkills[0]?.value)} : ${categorySkills
      .map((skill) => skill.value.name)
      .join(", ")}`;
  }).filter((section): section is string => Boolean(section));
  const answer =
    language === "en"
      ? `His main documented technical skills cover:\n\n${sections.join("\n\n")}.`
      : `Ses principales compétences techniques documentées couvrent :\n\n${sections.join("\n\n")}.`;

  return {
    answer,
    usedEvidenceIds: primaryEvidenceIds(skills.map((skill) => skill.fact)),
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
  const languageItems = orderedFacts.map((item) => ({
    name: languageName(item.value.languageId, language),
    level: languageLevel(item.value, language),
  }));
  const formattedLanguageItems = languageItems.map((item) =>
    language === "en"
      ? `${item.name} (${item.level})`
      : `${item.name} : ${item.level}`,
  );

  return {
    answer:
      language === "en"
        ? `Documented languages: ${joinEnglishList(formattedLanguageItems)}.`
        : `Langues documentées :\n\n${formattedLanguageItems.join("\n")}.`,
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

export function buildProfileFastPathAnswer(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (input.retrieval.notDocumented || input.retrieval.status !== "verified") {
    return undefined;
  }

  if (input.retrieval.intent === "technical_skills_overview") {
    return answerForTechnicalSkillsOverview(input);
  }

  if (input.retrieval.intent === "skills_by_category") {
    return answerForSkillsByCategory(input);
  }

  if (input.retrieval.intent === "skill_lookup") {
    return answerForSkillLookup(input);
  }

  if (input.retrieval.intent === "language_overview") {
    return answerForLanguageOverview(input);
  }

  if (input.retrieval.intent === "language_lookup") {
    return answerForLanguageLookup(input);
  }

  return undefined;
}
