import type { Schema } from "@google/genai";
import { Type } from "@google/genai";
import {
  MAX_GENERATED_ANSWER_LENGTH,
} from "@/features/portfolio-ai/generation/generation.config";
import {
  GenerationInvalidOutputError,
} from "@/features/portfolio-ai/generation/generation.errors";
import type {
  AnswerUncertainty,
  PortfolioAnswer,
} from "@/features/portfolio-ai/generation/generation.types";

const UNCERTAINTY_VALUES = new Set<AnswerUncertainty>([
  "none",
  "ambiguous",
  "not-documented",
]);

const PORTFOLIO_ANSWER_REQUIRED_FIELDS = [
  "answer",
  "usedEvidenceIds",
  "uncertainty",
  "language",
] as const;

const PORTFOLIO_ANSWER_UNCERTAINTY_VALUES = [
  "none",
  "ambiguous",
  "not-documented",
] as const;

const PORTFOLIO_ANSWER_LANGUAGE_VALUES = ["fr", "en"] as const;

export const portfolioAnswerResponseSchema: Schema = {
  type: Type.OBJECT,
  required: [...PORTFOLIO_ANSWER_REQUIRED_FIELDS],
  propertyOrdering: [...PORTFOLIO_ANSWER_REQUIRED_FIELDS],
  properties: {
    answer: {
      type: Type.STRING,
      minLength: "1",
      maxLength: String(MAX_GENERATED_ANSWER_LENGTH),
      description: "Concise grounded answer to the user's question.",
    },
    usedEvidenceIds: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Only evidence IDs from the supplied PORTFOLIO DATA.",
    },
    uncertainty: {
      type: Type.STRING,
      format: "enum",
      enum: [...PORTFOLIO_ANSWER_UNCERTAINTY_VALUES],
    },
    language: {
      type: Type.STRING,
      format: "enum",
      enum: [...PORTFOLIO_ANSWER_LANGUAGE_VALUES],
    },
  },
};

export const portfolioAnswerJSONSchema = {
  type: "object",
  additionalProperties: false,
  required: [...PORTFOLIO_ANSWER_REQUIRED_FIELDS],
  properties: {
    answer: {
      type: "string",
      minLength: 1,
      maxLength: MAX_GENERATED_ANSWER_LENGTH,
      description: "Concise grounded answer to the user's question.",
    },
    usedEvidenceIds: {
      type: "array",
      items: {
        type: "string",
      },
      description: "Only evidence IDs from the supplied PORTFOLIO DATA.",
    },
    uncertainty: {
      type: "string",
      enum: [...PORTFOLIO_ANSWER_UNCERTAINTY_VALUES],
    },
    language: {
      type: "string",
      enum: [...PORTFOLIO_ANSWER_LANGUAGE_VALUES],
    },
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePortfolioAnswer(output: unknown): PortfolioAnswer {
  const parsedOutput =
    typeof output === "string" ? JSON.parse(output) : output;

  if (!isRecord(parsedOutput)) {
    throw new GenerationInvalidOutputError("Structured answer must be an object.");
  }

  const answer = parsedOutput.answer;
  const usedEvidenceIds = parsedOutput.usedEvidenceIds;
  const uncertainty = parsedOutput.uncertainty;
  const language = parsedOutput.language;

  if (typeof answer !== "string" || !answer.trim()) {
    throw new GenerationInvalidOutputError("Structured answer is empty.");
  }

  if (answer.length > MAX_GENERATED_ANSWER_LENGTH) {
    throw new GenerationInvalidOutputError("Structured answer is too long.");
  }

  if (
    !Array.isArray(usedEvidenceIds) ||
    !usedEvidenceIds.every((id) => typeof id === "string")
  ) {
    throw new GenerationInvalidOutputError(
      "usedEvidenceIds must be an array of strings.",
    );
  }

  if (
    typeof uncertainty !== "string" ||
    !UNCERTAINTY_VALUES.has(uncertainty as AnswerUncertainty)
  ) {
    throw new GenerationInvalidOutputError("Invalid answer uncertainty.");
  }

  if (language !== "fr" && language !== "en") {
    throw new GenerationInvalidOutputError("Invalid answer language.");
  }

  return {
    answer: answer.trim(),
    usedEvidenceIds,
    uncertainty: uncertainty as AnswerUncertainty,
    language,
  };
}
