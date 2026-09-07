import "server-only";

import { RETRIEVAL_MAX_QUERY_LENGTH } from "@/features/portfolio-ai/retrieval";
import {
  buildGroundedContext,
  getAllowedEvidenceIds,
} from "@/features/portfolio-ai/generation/build-grounded-context";
import {
  getPortfolioAIGenerationConfig,
} from "@/features/portfolio-ai/generation/generation.config";
import {
  GenerationInvalidOutputError,
  GenerationProviderError,
  isRetryableGenerationError,
  normalizeGenerationError,
} from "@/features/portfolio-ai/generation/generation.errors";
import {
  buildGenerationUserPrompt,
  PORTFOLIO_AI_SYSTEM_PROMPT,
} from "@/features/portfolio-ai/generation/generation.prompt";
import { getDefaultPortfolioAIProvider } from "@/features/portfolio-ai/generation/gemini-provider";
import type {
  GeneratePortfolioAnswerInput,
  GeneratePortfolioAnswerOptions,
  PortfolioAIProvider,
  PortfolioAnswer,
  PortfolioAnswerResult,
  ProviderGenerationResult,
} from "@/features/portfolio-ai/generation/generation.types";
import { validateGroundedAnswer } from "@/features/portfolio-ai/generation/validate-grounding";

function detectResponseLanguage(question: string, fallback: "fr" | "en") {
  const normalized = question.toLowerCase();

  if (/\b(has|what|which|tell|compare|used|projects?)\b/.test(normalized)) {
    return "en";
  }

  if (
    /\b(a-t-il|quel|quelle|quels|quelles|utilise|utilisé|parle|compare)\b/.test(
      normalized,
    )
  ) {
    return "fr";
  }

  return fallback;
}

function localNotDocumentedAnswer(input: GeneratePortfolioAnswerInput) {
  const language = detectResponseLanguage(input.question, input.locale);

  return {
    answer:
      language === "en"
        ? "I couldn't find this information documented in Soufiane's portfolio."
        : "Je ne trouve pas cette information documentée dans le portfolio de Soufiane.",
    usedEvidenceIds: [],
    uncertainty: "not-documented" as const,
    language,
  };
}

function countEvidenceByStatus(
  input: GeneratePortfolioAnswerInput,
  status: "verified" | "ambiguous",
) {
  return input.retrieval.results.reduce((count, result) => {
    const factEvidenceCount = result.facts
      .filter((fact) => fact.status === status)
      .reduce((total, fact) => total + fact.evidence.length, 0);

    return count + factEvidenceCount;
  }, 0);
}

async function generateValidatedWithRetry(
  provider: PortfolioAIProvider,
  groundedInput: Parameters<PortfolioAIProvider["generate"]>[0],
  input: GeneratePortfolioAnswerInput,
  allowedEvidenceIds: readonly string[],
  maxRetries: number,
): Promise<{
  providerResult: ProviderGenerationResult;
  answer: PortfolioAnswer;
  retryCount: number;
}> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      const providerResult = await provider.generate(groundedInput);
      const answer = validateGroundedAnswer(
        providerResult.output,
        input,
        allowedEvidenceIds,
      );

      return { providerResult, answer, retryCount: attempt };
    } catch (error) {
      lastError = error;

      if (!isRetryableGenerationError(error) || attempt >= maxRetries) {
        throw normalizeGenerationError(error);
      }
    }

    attempt += 1;
  }

  throw normalizeGenerationError(lastError ?? new GenerationProviderError());
}

export async function generatePortfolioAnswer(
  input: GeneratePortfolioAnswerInput,
  options: GeneratePortfolioAnswerOptions = {},
): Promise<PortfolioAnswerResult> {
  if (!input.question.trim()) {
    throw new GenerationInvalidOutputError("Question cannot be empty.");
  }

  if (input.question.length > RETRIEVAL_MAX_QUERY_LENGTH) {
    throw new GenerationInvalidOutputError(
      `Question cannot exceed ${RETRIEVAL_MAX_QUERY_LENGTH} characters.`,
    );
  }

  const config = getPortfolioAIGenerationConfig();
  const model = options.model ?? config.model;
  const groundedContext = buildGroundedContext(input);
  const allowedEvidenceIds = getAllowedEvidenceIds(groundedContext);
  const retrievedEntityCount = input.retrieval.results.length;
  const verifiedEvidenceCount = countEvidenceByStatus(input, "verified");
  const ambiguousEvidenceCount = countEvidenceByStatus(input, "ambiguous");

  if (input.retrieval.notDocumented && input.retrieval.results.length === 0) {
    return {
      answer: localNotDocumentedAnswer(input),
      metadata: {
        provider: "local",
        model: "deterministic-not-documented",
        latencyMs: 0,
        retrievedEntityCount,
        verifiedEvidenceCount,
        ambiguousEvidenceCount,
        usedEvidenceCount: 0,
        providerCalled: false,
        retryCount: 0,
      },
    };
  }

  const provider = options.provider ?? getDefaultPortfolioAIProvider();
  const userPrompt = buildGenerationUserPrompt(input, groundedContext);
  const { providerResult, answer, retryCount } = await generateValidatedWithRetry(
    provider,
    {
      question: input.question,
      locale: input.locale,
      model,
      groundedContext,
      allowedEvidenceIds,
      systemPrompt: PORTFOLIO_AI_SYSTEM_PROMPT,
      userPrompt,
    },
    input,
    allowedEvidenceIds,
    config.maxRetries,
  );

  return {
    answer,
    metadata: {
      provider: providerResult.provider,
      model: providerResult.model,
      latencyMs: providerResult.latencyMs,
      retrievedEntityCount,
      verifiedEvidenceCount,
      ambiguousEvidenceCount,
      usedEvidenceCount: answer.usedEvidenceIds.length,
      providerCalled: true,
      retryCount,
      usage: providerResult.usage,
    },
  };
}
