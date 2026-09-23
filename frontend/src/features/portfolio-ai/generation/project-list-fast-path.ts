import "server-only";

import { createEvidenceId } from "@/features/portfolio-ai/generation/build-grounded-context";
import {
  detectPortfolioAIResponseLanguage,
} from "@/features/portfolio-ai/generation/response-language";
import type {
  GeneratePortfolioAnswerInput,
  PortfolioAnswer,
} from "@/features/portfolio-ai/generation/generation.types";

type RetrievalResult =
  GeneratePortfolioAnswerInput["retrieval"]["results"][number];
type RetrievalFact = RetrievalResult["facts"][number];

const ML_PROJECT_IDS = [
  "algorithmic-trading-ml",
  "callcenter-frustration-ai",
  "personalized-recommendation-system",
] as const;

const NLP_PROJECT_IDS = [
  "callcenter-frustration-ai",
  "medical-rag-platform",
  "syndismart-ai",
] as const;

function uniqueStrings(items: readonly string[]) {
  return [...new Set(items)];
}

function projectLabel(project: RetrievalResult, language: "fr" | "en") {
  return project.entity.localeContent?.[language]?.title ?? project.entity.canonicalName;
}

function primaryOrSupportingEvidenceIds(facts: readonly RetrievalFact[]) {
  return uniqueStrings(
    facts.flatMap((fact) =>
      fact.evidence
        .filter((evidence) => evidence.strength !== "retrieval-only")
        .map(createEvidenceId),
    ),
  );
}

function projectEvidenceIds(project: RetrievalResult) {
  const selectedFacts = [
    ...project.facts.filter((fact) => fact.predicate === "projectShortDescription"),
    ...project.facts.filter((fact) => fact.predicate === "category"),
    ...project.facts.filter((fact) => fact.predicate === "chronologyRank"),
  ];

  return primaryOrSupportingEvidenceIds(selectedFacts.length > 0 ? selectedFacts : project.facts);
}

function joinList(items: readonly string[], language: "fr" | "en") {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  return `${items.slice(0, -1).join(", ")} ${
    language === "en" ? "and" : "et"
  } ${items.at(-1)}`;
}

function projectById(input: GeneratePortfolioAnswerInput, projectId: string) {
  return input.retrieval.results.find((result) => result.entity.id === projectId);
}

export function buildProjectListFastPathAnswer(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (
    input.retrieval.intent !== "projects_by_domain" ||
    input.retrieval.notDocumented
  ) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(input.question, input.locale);
  const projectIds =
    input.retrieval.skillCategory === "ml-deep-learning"
      ? ML_PROJECT_IDS
      : input.retrieval.skillCategory === "nlp-llm-rag"
        ? NLP_PROJECT_IDS
        : undefined;

  if (!projectIds) {
    return undefined;
  }

  const projects = projectIds
    .map((projectId) => projectById(input, projectId))
    .filter((project): project is RetrievalResult => Boolean(project));
  const evidenceIds = projects.flatMap(projectEvidenceIds);

  if (projects.length === 0 || evidenceIds.length === 0) {
    return undefined;
  }

  const labels = projects.map((project) => projectLabel(project, language));

  if (input.retrieval.skillCategory === "ml-deep-learning") {
    return {
      answer:
        language === "en"
          ? `Yes. Soufiane has worked on Machine Learning projects such as ${joinList(labels, language)}.`
          : `Oui. Soufiane a notamment travaillé sur des projets de Machine Learning comme ${joinList(labels, language)}.`,
      usedEvidenceIds: evidenceIds,
      uncertainty: "none",
      language,
    };
  }

  return {
    answer:
      language === "en"
        ? `Yes. Soufiane has worked on NLP and text-processing projects such as ${joinList(labels, language)}.`
        : `Oui. Soufiane a déjà travaillé sur des projets NLP ou de traitement de texte comme ${joinList(labels, language)}.`,
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}

export function buildLatestProjectFastPathAnswer(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (
    input.retrieval.intent !== "latest_project_lookup" ||
    input.retrieval.notDocumented ||
    input.retrieval.status !== "verified"
  ) {
    return undefined;
  }

  const project = input.retrieval.results.find(
    (result) => result.entity.type === "project",
  );

  if (!project) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(input.question, input.locale);
  const label = projectLabel(project, language);
  const description =
    project.facts.find(
      (fact) =>
        fact.predicate === "projectShortDescription" &&
        fact.evidence.some((evidence) =>
          evidence.field?.startsWith(`content.${language}.`),
        ),
    ) ??
    project.facts.find((fact) => fact.predicate === "projectShortDescription");
  const evidenceIds = projectEvidenceIds(project);

  if (!description || evidenceIds.length === 0) {
    return undefined;
  }

  return {
    answer:
      language === "en"
        ? `The latest project documented in the portfolio chronology is “${label}”: ${String(description.value)}`
        : `Le dernier projet documenté dans la chronologie du portfolio est « ${label} » : ${String(description.value)}`,
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}
