import "server-only";

import { createEvidenceId } from "@/features/portfolio-ai/generation/build-grounded-context";
import {
  detectPortfolioAIResponseLanguage,
} from "@/features/portfolio-ai/generation/response-language";
import type {
  GeneratePortfolioAnswerInput,
  PortfolioAnswer,
} from "@/features/portfolio-ai/generation/generation.types";

function uniqueStrings(items: readonly string[]) {
  return [...new Set(items)];
}

function projectLabel(
  input: GeneratePortfolioAnswerInput,
  project: GeneratePortfolioAnswerInput["retrieval"]["results"][number],
) {
  return (
    project.entity.localeContent?.[input.locale]?.title ??
    project.entity.canonicalName
  );
}

function primaryEvidenceIds(
  facts: readonly GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number][],
) {
  return uniqueStrings(
    facts.flatMap((fact) =>
      fact.evidence
        .filter((evidence) => evidence.strength === "primary")
        .map(createEvidenceId),
    ),
  );
}

function factHasLocale(
  fact: GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number],
  language: "fr" | "en",
) {
  return fact.evidence.some((evidence) =>
    evidence.field?.startsWith(`content.${language}.`),
  );
}

function preferLanguageFacts(
  facts: readonly GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number][],
  language: "fr" | "en",
) {
  const localizedFacts = facts.filter((fact) => factHasLocale(fact, language));

  return localizedFacts.length > 0 ? localizedFacts : facts;
}

function trimSentence(value: string) {
  return value.trim().replace(/[.。]+$/g, "");
}

function lowerFirst(value: string) {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function objectiveFromDescription(
  description: string,
  language: "fr" | "en",
) {
  const text = trimSentence(description);
  const combinedPattern =
    language === "en"
      ? /\bcombining\s+(.+?)\s+to\s+(.+)$/i
      : /\bcombinant\s+(.+?)\s+pour\s+(.+)$/i;
  const combinedMatch = text.match(combinedPattern);

  if (combinedMatch?.[1] && combinedMatch[2]) {
    const means = lowerFirst(trimSentence(combinedMatch[1]));
    const goal = lowerFirst(trimSentence(combinedMatch[2]));

    return language === "en"
      ? `${goal} by combining ${means}`
      : `${goal} en combinant ${means}`;
  }

  const purposePattern = language === "en" ? /\bto\s+(.+)$/i : /\bpour\s+(.+)$/i;
  const purposeMatch = text.match(purposePattern);

  return purposeMatch?.[1] ? lowerFirst(trimSentence(purposeMatch[1])) : undefined;
}

function objectiveAnswerFromFacts(
  label: string,
  objectiveFacts: readonly GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number][],
  language: "fr" | "en",
) {
  const objectives = objectiveFacts.map((fact) => String(fact.value).trim());

  if (language === "en") {
    return `The documented goals of “${label}” are: ${objectives.join(" ")}`;
  }

  return `Les objectifs documentés du projet « ${label} » sont : ${objectives.join(" ")}`;
}

function objectiveAnswerFromDescription(
  label: string,
  description: string,
  language: "fr" | "en",
) {
  const objective = objectiveFromDescription(description, language);

  if (!objective) {
    return language === "en"
      ? `The objective of “${label}” is documented as: ${description}`
      : `L’objectif du projet « ${label} » est documenté ainsi : ${description}`;
  }

  return language === "en"
    ? `The objective of “${label}” is to ${objective}.`
    : `L’objectif du projet « ${label} » est de ${objective}.`;
}

export function buildProjectAttributeFastPathAnswer(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (
    input.retrieval.intent !== "project_lookup" ||
    input.retrieval.requestedProjectAttribute !== "objective" ||
    input.retrieval.notDocumented ||
    input.retrieval.status !== "verified"
  ) {
    return undefined;
  }

  const projectResults = input.retrieval.results.filter(
    (result) => result.entity.type === "project",
  );

  if (projectResults.length !== 1) {
    return undefined;
  }

  const project = projectResults[0];
  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const allObjectiveFacts = project.facts.filter(
    (fact) => fact.predicate === "projectObjective" && fact.status === "verified",
  );
  const objectiveFacts = preferLanguageFacts(allObjectiveFacts, language);
  const descriptionFacts = project.facts.filter(
    (fact) =>
      fact.predicate === "projectShortDescription" && fact.status === "verified",
  );
  const descriptionFact = preferLanguageFacts(descriptionFacts, language)[0];
  const selectedFacts =
    objectiveFacts.length > 0
      ? objectiveFacts
      : descriptionFact
        ? [descriptionFact]
        : [];
  const evidenceIds = primaryEvidenceIds(selectedFacts);

  if (selectedFacts.length === 0 || evidenceIds.length === 0) {
    return undefined;
  }

  const label = projectLabel(input, project);

  return {
    answer:
      objectiveFacts.length > 0
        ? objectiveAnswerFromFacts(label, objectiveFacts, language)
        : objectiveAnswerFromDescription(
            label,
            String(descriptionFact?.value ?? ""),
            language,
          ),
    usedEvidenceIds: evidenceIds,
    uncertainty: "none",
    language,
  };
}
