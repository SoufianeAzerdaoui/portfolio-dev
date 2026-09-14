import "server-only";

import { getEntityById } from "@/features/portfolio-ai/knowledge";
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

type ProjectTechnologyStack = {
  projectLabel: string;
  technologyNames: string[];
  evidenceIds: string[];
};

function technologyMatch(input: GeneratePortfolioAnswerInput) {
  return input.retrieval.matchedEntities.find(
    (match) => match.entity.type === "technology",
  )?.entity;
}

function uniqueStrings(items: readonly string[]) {
  return [...new Set(items)];
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

  return uniqueStrings(selectedEvidence.map(createEvidenceId));
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

function joinTechnologyNames(names: readonly string[]) {
  return names.join(", ");
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

function projectLabel(
  entity: GeneratePortfolioAnswerInput["retrieval"]["results"][number]["entity"],
  language: "fr" | "en",
) {
  return entity.localeContent?.[language]?.title ?? entity.canonicalName;
}

function projectTechnologyStack(
  input: GeneratePortfolioAnswerInput,
  language: "fr" | "en",
): ProjectTechnologyStack | undefined {
  const projectResults = input.retrieval.results.filter(
    (result) => result.entity.type === "project",
  );

  if (projectResults.length !== 1) {
    return undefined;
  }

  const project = projectResults[0];
  const verifiedTechnologyFacts = project.facts.filter(
    (fact) => fact.predicate === "usesTechnology" && fact.status === "verified",
  );
  const technologyNames = verifiedTechnologyFacts
    .map((fact) =>
      typeof fact.value === "string"
        ? getEntityById(fact.value)?.canonicalName
        : undefined,
    )
    .filter((name): name is string => Boolean(name));
  const evidenceIds = uniqueStrings(
    verifiedTechnologyFacts.flatMap(preferredPrimaryEvidenceIds),
  );

  if (technologyNames.length === 0 || evidenceIds.length === 0) {
    return undefined;
  }

  return {
    projectLabel: projectLabel(project.entity, language),
    technologyNames: uniqueStrings(technologyNames),
    evidenceIds,
  };
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

function projectTechnologyAnswerFor(
  stack: ProjectTechnologyStack,
  language: "fr" | "en",
) {
  const technologies = joinTechnologyNames(stack.technologyNames);

  if (language === "en") {
    return `For the “${stack.projectLabel}” project, Soufiane used: ${technologies}.`;
  }

  return `Pour le projet « ${stack.projectLabel} », Soufiane a utilisé : ${technologies}.`;
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

export function buildProjectTechnologyFastPathAnswer(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (
    input.retrieval.intent !== "project_technology_lookup" ||
    input.retrieval.notDocumented ||
    input.retrieval.status !== "verified"
  ) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );
  const stack = projectTechnologyStack(input, language);

  if (!stack) {
    return undefined;
  }

  return {
    answer: projectTechnologyAnswerFor(stack, language),
    usedEvidenceIds: stack.evidenceIds,
    uncertainty: "none",
    language,
  };
}
