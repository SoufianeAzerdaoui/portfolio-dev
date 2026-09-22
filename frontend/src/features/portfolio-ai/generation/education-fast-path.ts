import "server-only";

import { createEvidenceId } from "@/features/portfolio-ai/generation/build-grounded-context";
import {
  detectPortfolioAIResponseLanguage,
} from "@/features/portfolio-ai/generation/response-language";
import type {
  GeneratePortfolioAnswerInput,
  PortfolioAnswer,
} from "@/features/portfolio-ai/generation/generation.types";

type RetrievalFact =
  GeneratePortfolioAnswerInput["retrieval"]["results"][number]["facts"][number];

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

function factValue(
  facts: readonly RetrievalFact[],
  predicate: string,
) {
  const value = facts.find((fact) => fact.predicate === predicate)?.value;

  return typeof value === "string" ? value : undefined;
}

export function buildEducationFastPathAnswer(
  input: GeneratePortfolioAnswerInput,
): PortfolioAnswer | undefined {
  if (
    input.retrieval.intent !== "education_lookup" ||
    input.retrieval.notDocumented ||
    input.retrieval.status !== "verified"
  ) {
    return undefined;
  }

  const currentEducation = input.retrieval.results.find(
    (result) =>
      result.entity.id === "education-isima-siad-2026" &&
      result.entity.type === "education",
  );

  if (!currentEducation) {
    return undefined;
  }

  const facts = currentEducation.facts.filter((fact) =>
    ["programme", "institution", "location", "educationStatus"].includes(
      fact.predicate,
    ),
  );
  const status = factValue(facts, "educationStatus");

  if (status !== "in_progress") {
    return undefined;
  }

  const programme = factValue(facts, "programme");
  const institution = factValue(facts, "institution");
  const location = factValue(facts, "location");
  const evidenceIds = primaryEvidenceIds(facts);

  if (!programme || !institution || !location || evidenceIds.length === 0) {
    return undefined;
  }

  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

  return {
    answer:
      language === "en"
        ? `Soufiane is currently pursuing a Master 2 SIAD in Information Systems and Decision Support at ${institution}, in ${location}.`
        : `Soufiane poursuit actuellement un Master 2 SIAD en systèmes d'information et aide à la décision à l'${institution}, à ${location}.`,
    usedEvidenceIds: evidenceIds.slice(0, 4),
    uncertainty: "none",
    language,
  };
}
