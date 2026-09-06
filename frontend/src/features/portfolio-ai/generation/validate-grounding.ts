import "server-only";

import { parsePortfolioAnswer } from "@/features/portfolio-ai/generation/answer.schema";
import {
  GenerationGroundingError,
  GenerationInvalidOutputError,
} from "@/features/portfolio-ai/generation/generation.errors";
import type {
  GeneratePortfolioAnswerInput,
  PortfolioAnswer,
} from "@/features/portfolio-ai/generation/generation.types";

function hasVerifiedResult(input: GeneratePortfolioAnswerInput) {
  return input.retrieval.results.some(
    (result) =>
      result.status === "verified" ||
      result.facts.some((fact) => fact.status === "verified"),
  );
}

function hasAmbiguousResult(input: GeneratePortfolioAnswerInput) {
  return input.retrieval.results.some(
    (result) =>
      result.status === "ambiguous" ||
      result.facts.some((fact) => fact.status === "ambiguous"),
  );
}

export function validateGroundedAnswer(
  output: unknown,
  input: GeneratePortfolioAnswerInput,
  allowedEvidenceIds: readonly string[],
): PortfolioAnswer {
  let answer: PortfolioAnswer;

  try {
    answer = parsePortfolioAnswer(output);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new GenerationInvalidOutputError("Structured answer is not valid JSON.");
    }

    throw error;
  }

  const allowedIds = new Set(allowedEvidenceIds);
  const fabricatedIds = answer.usedEvidenceIds.filter((id) => !allowedIds.has(id));

  if (fabricatedIds.length > 0) {
    throw new GenerationGroundingError(
      "Structured answer referenced evidence that was not supplied.",
    );
  }

  if (input.retrieval.notDocumented || input.retrieval.results.length === 0) {
    if (answer.uncertainty !== "not-documented") {
      throw new GenerationGroundingError(
        "Not-documented retrieval must produce not-documented uncertainty.",
      );
    }

    if (answer.usedEvidenceIds.length > 0) {
      throw new GenerationGroundingError(
        "Not-documented retrieval cannot cite evidence.",
      );
    }

    return answer;
  }

  if (!hasVerifiedResult(input) && hasAmbiguousResult(input)) {
    if (answer.uncertainty === "none") {
      throw new GenerationGroundingError(
        "Ambiguous-only retrieval cannot produce uncertainty none.",
      );
    }
  }

  if (answer.uncertainty === "not-documented" && allowedEvidenceIds.length > 0) {
    throw new GenerationGroundingError(
      "Documented retrieval should not be downgraded to not-documented.",
    );
  }

  return answer;
}
