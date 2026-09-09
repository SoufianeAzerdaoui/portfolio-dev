import "server-only";

import { createEvidenceId } from "@/features/portfolio-ai/generation/build-grounded-context";
import {
  detectPortfolioAIResponseLanguage,
} from "@/features/portfolio-ai/generation/response-language";
import type {
  GeneratePortfolioAnswerInput,
  PortfolioAnswer,
} from "@/features/portfolio-ai/generation/generation.types";

type VerifiedTechnologyUsage = {
  entityId: string;
  entityType: string;
  label: string;
  evidenceIds: string[];
};

function technologyMatch(input: GeneratePortfolioAnswerInput) {
  return input.retrieval.matchedEntities.find(
    (match) => match.entity.type === "technology",
  )?.entity;
}

function preferredPrimaryEvidenceIds(
  fact: GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number],
) {
  const primaryEvidence = fact.evidence.filter(
    (evidence) => evidence.strength === "primary",
  );
  const directTechnologyEvidence = primaryEvidence.filter(
    (evidence) => evidence.field === "technologies",
  );
  const selectedEvidence =
    directTechnologyEvidence.length > 0
      ? directTechnologyEvidence
      : primaryEvidence;

  return [...new Set(selectedEvidence.map(createEvidenceId))];
}

function verifiedTechnologyUsages(
  input: GeneratePortfolioAnswerInput,
): VerifiedTechnologyUsage[] {
  const technology = technologyMatch(input);

  if (!technology) {
    return [];
  }

  return input.retrieval.results
    .filter((result) => result.status === "verified")
    .flatMap((result) =>
      result.facts
        .filter(
          (fact) =>
            fact.predicate === "usesTechnology" &&
            fact.status === "verified" &&
            fact.value === technology.id,
        )
        .map((fact) => ({
          entityId: result.entity.id,
          entityType: result.entity.type,
          label:
            result.entity.localeContent?.[input.locale]?.title ??
            result.entity.canonicalName,
          evidenceIds: preferredPrimaryEvidenceIds(fact),
        })),
    )
    .filter((usage) => usage.evidenceIds.length > 0);
}

function joinLabels(labels: readonly string[], language: "fr" | "en") {
  const quotedLabels = labels.map((label) =>
    language === "en" ? `“${label}”` : `« ${label} »`,
  );

  if (quotedLabels.length <= 1) {
    return quotedLabels[0] ?? "";
  }

  return `${quotedLabels.slice(0, -1).join(", ")} ${
    language === "en" ? "and" : "et"
  } ${quotedLabels.at(-1)}`;
}

function entityNoun(
  usages: readonly VerifiedTechnologyUsage[],
  language: "fr" | "en",
) {
  const types = new Set(usages.map((usage) => usage.entityType));
  const plural = usages.length > 1;

  if (types.size === 1 && types.has("project")) {
    if (language === "en") {
      return plural ? "the projects" : "the project";
    }

    return plural ? "les projets" : "le projet";
  }

  if (types.size === 1 && types.has("experience")) {
    if (language === "en") {
      return plural ? "the experiences" : "the experience";
    }

    return plural ? "les expériences" : "l’expérience";
  }

  return language === "en" ? "the portfolio items" : "les éléments du portfolio";
}

function answerFor(
  technologyName: string,
  usages: readonly VerifiedTechnologyUsage[],
  language: "fr" | "en",
) {
  const labels = joinLabels(
    usages.map((usage) => usage.label),
    language,
  );
  const noun = entityNoun(usages, language);

  if (language === "en") {
    return `Yes. Soufiane has used ${technologyName}, notably in ${noun} ${labels}.`;
  }

  return `Oui. Soufiane a utilisé ${technologyName}, notamment dans ${noun} ${labels}.`;
}

export function buildVerifiedTechnologyFastPathAnswer(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (
    input.retrieval.intent !== "technology_evidence" ||
    input.retrieval.notDocumented ||
    input.retrieval.status !== "verified"
  ) {
    return undefined;
  }

  const technology = technologyMatch(input);
  const usages = verifiedTechnologyUsages(input);

  if (!technology || usages.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

  return {
    answer: answerFor(technology.canonicalName, usages, language),
    usedEvidenceIds: usages.flatMap((usage) => usage.evidenceIds),
    uncertainty: "none",
    language,
  };
}
