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
  logPortfolioAIDebug,
} from "@/features/portfolio-ai/generation/debug";
import {
  GenerationGroundingError,
  GenerationInvalidOutputError,
  GenerationProviderError,
  isRetryableGenerationError,
  normalizeGenerationError,
} from "@/features/portfolio-ai/generation/generation.errors";
import {
  buildGenerationUserPrompt,
  PORTFOLIO_AI_SYSTEM_PROMPT,
} from "@/features/portfolio-ai/generation/generation.prompt";
import {
  getDefaultPortfolioAIProvider,
  type PortfolioAIProviderWithValidationFallback,
} from "@/features/portfolio-ai/generation/resilient-provider";
import {
  detectPortfolioAIResponseLanguage,
  isPortfolioAIGreeting,
} from "@/features/portfolio-ai/generation/response-language";
import {
  buildEducationFastPathAnswer,
} from "@/features/portfolio-ai/generation/education-fast-path";
import {
  buildProjectAttributeFastPathAnswer,
} from "@/features/portfolio-ai/generation/project-attribute-fast-path";
import {
  buildProfileFastPathAnswer,
} from "@/features/portfolio-ai/generation/profile-fast-path";
import {
  buildProjectTechnologyFastPathAnswer,
  buildVerifiedTechnologyFastPathAnswer,
} from "@/features/portfolio-ai/generation/verified-technology-fast-path";
import type {
  GeneratePortfolioAnswerInput,
  GeneratePortfolioAnswerOptions,
  PortfolioAIProvider,
  PortfolioAnswer,
  PortfolioAnswerResult,
  ProviderGenerationResult,
} from "@/features/portfolio-ai/generation/generation.types";
import { validateGroundedAnswer } from "@/features/portfolio-ai/generation/validate-grounding";

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function localNotDocumentedAnswer(input: GeneratePortfolioAnswerInput) {
  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

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

function localGreetingAnswer(input: GeneratePortfolioAnswerInput) {
  const language = detectPortfolioAIResponseLanguage(
    input.question,
    input.locale,
  );

  return {
    answer:
      language === "en"
        ? "Hello. Ask me about Soufiane's projects, skills, education, or experience."
        : "Bonjour. Posez-moi une question sur les projets, compétences, formations ou expériences de Soufiane.",
    usedEvidenceIds: [],
    uncertainty: "none" as const,
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

function hasValidationFallback(
  provider: PortfolioAIProvider,
): provider is PortfolioAIProviderWithValidationFallback {
  return "generateFallbackAfterInvalidOutput" in provider;
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
  validationMs: number;
}> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      const providerResult = await provider.generate(groundedInput);
      const validationStartedAt = Date.now();
      const answer = validateGroundedAnswer(
        providerResult.output,
        input,
        allowedEvidenceIds,
      );
      const validationMs = Date.now() - validationStartedAt;

      logPortfolioAIDebug("generation.validation", {
        requestId: groundedInput.requestId,
        intent: input.retrieval.intent,
        provider: providerResult.provider,
        elapsedMs: validationMs,
        validation: "PASS",
      });

      return {
        providerResult,
        answer,
        retryCount: attempt,
        validationMs,
      };
    } catch (error) {
      lastError = error;

      if (
        error instanceof GenerationInvalidOutputError ||
        error instanceof GenerationGroundingError
      ) {
        logPortfolioAIDebug("generation.validation", {
          requestId: groundedInput.requestId,
          intent: input.retrieval.intent,
          elapsedMs: 0,
          validation: "FAIL",
          normalizedErrorClass: normalizeGenerationError(error).name,
        });
      }

      if (isAbortError(error)) {
        throw error;
      }

      const normalizedError = normalizeGenerationError(error);

      if (
        input.retrieval.intent === "candidate_fit" &&
        normalizedError instanceof GenerationInvalidOutputError
      ) {
        if (!hasValidationFallback(provider)) {
          throw normalizedError;
        }

        const providerResult =
          await provider.generateFallbackAfterInvalidOutput(groundedInput);
        const validationStartedAt = Date.now();
        const answer = validateGroundedAnswer(
          providerResult.output,
          input,
          allowedEvidenceIds,
        );
        const validationMs = Date.now() - validationStartedAt;

        logPortfolioAIDebug("generation.validation", {
          requestId: groundedInput.requestId,
          intent: input.retrieval.intent,
          provider: providerResult.provider,
          elapsedMs: validationMs,
          validation: "PASS",
        });

        return {
          providerResult,
          answer,
          retryCount: attempt,
          validationMs,
        };
      }

      if (!isRetryableGenerationError(error) || attempt >= maxRetries) {
        throw normalizedError;
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
  const projectTechnologyFastPathAnswer =
    buildProjectTechnologyFastPathAnswer(input);
  const educationFastPathAnswer = buildEducationFastPathAnswer(input);
  const projectAttributeFastPathAnswer =
    buildProjectAttributeFastPathAnswer(input);
  const profileFastPathAnswer = buildProfileFastPathAnswer(input);
  const verifiedTechnologyFastPathAnswer =
    buildVerifiedTechnologyFastPathAnswer(input);
  const fastPathAnswer =
    projectTechnologyFastPathAnswer ??
    educationFastPathAnswer ??
    projectAttributeFastPathAnswer ??
    profileFastPathAnswer ??
    verifiedTechnologyFastPathAnswer;

  if (fastPathAnswer) {
    logPortfolioAIDebug("generation.fast_path", {
      requestId: options.requestId,
      intent: input.retrieval.intent,
      fastPathUsed: "YES",
      retrievedEntityIds: input.retrieval.results.map(
        (result) => result.entity.id,
      ),
      evidenceIds: fastPathAnswer.usedEvidenceIds,
    });

    return {
      answer: fastPathAnswer,
      metadata: {
        provider: "local",
        model: projectTechnologyFastPathAnswer
          ? "deterministic-project-technology"
          : educationFastPathAnswer
            ? "deterministic-education"
          : projectAttributeFastPathAnswer
            ? "deterministic-project-attribute"
            : profileFastPathAnswer
              ? input.retrieval.intent.startsWith("language")
                ? "deterministic-profile-language"
                : input.retrieval.intent === "availability_lookup"
                  ? "deterministic-profile-availability"
                : input.retrieval.intent === "career_target_lookup"
                  ? "deterministic-profile-career-target"
                  : input.retrieval.intent === "certification_lookup"
                    ? "deterministic-profile-certifications"
                    : input.retrieval.intent === "journey_summary"
                      ? "deterministic-profile-journey"
                      : input.retrieval.intent === "profile_lookup"
                        ? "deterministic-profile-summary"
                        : "deterministic-profile-skills"
              : "deterministic-verified-technology",
        latencyMs: 0,
        retrievedEntityCount,
        verifiedEvidenceCount,
        ambiguousEvidenceCount,
        usedEvidenceCount: fastPathAnswer.usedEvidenceIds.length,
        providerCalled: false,
        retryCount: 0,
        fastPathUsed: true,
        validationMs: 0,
      },
    };
  }

  if (isPortfolioAIGreeting(input.question)) {
    return {
      answer: localGreetingAnswer(input),
      metadata: {
        provider: "local",
        model: "deterministic-greeting",
        latencyMs: 0,
        retrievedEntityCount,
        verifiedEvidenceCount,
        ambiguousEvidenceCount,
        usedEvidenceCount: 0,
        providerCalled: false,
        retryCount: 0,
        fastPathUsed: false,
        validationMs: 0,
      },
    };
  }

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
        fastPathUsed: false,
        validationMs: 0,
      },
    };
  }

  const provider = options.provider ?? getDefaultPortfolioAIProvider();
  logPortfolioAIDebug("generation.fast_path", {
    requestId: options.requestId,
    intent: input.retrieval.intent,
    fastPathUsed: "NO",
    retrievedEntityIds: input.retrieval.results.map((result) => result.entity.id),
    evidenceIds: allowedEvidenceIds,
  });
  const userPrompt = buildGenerationUserPrompt(input, groundedContext);
  const { providerResult, answer, retryCount, validationMs } =
    await generateValidatedWithRetry(
      provider,
      {
        requestId: options.requestId,
        question: input.question,
        locale: input.locale,
        model,
        groundedContext,
        allowedEvidenceIds,
        systemPrompt: PORTFOLIO_AI_SYSTEM_PROMPT,
        userPrompt,
        signal: options.signal,
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
      fastPathUsed: false,
      validationMs,
      usage: providerResult.usage,
    },
  };
}
