import "server-only";

import {
  buildConversationContext,
  PORTFOLIO_AI_MAX_HISTORY_MESSAGES,
  PORTFOLIO_AI_MAX_HISTORY_MESSAGE_LENGTH,
  PORTFOLIO_AI_MAX_HISTORY_TOTAL_LENGTH,
} from "@/features/portfolio-ai/api/conversation-context";
import {
  portfolioAIRateLimiter,
  type PortfolioAIRateLimiter,
} from "@/features/portfolio-ai/api/rate-limit";
import {
  createEvidenceId,
  detectPortfolioAIResponseLanguage,
  generatePortfolioAnswer,
  logPortfolioAIDebug,
} from "@/features/portfolio-ai/generation";
import { PERSON_ID } from "@/features/portfolio-ai/knowledge/knowledge.sources";
import {
  GenerationConfigurationError,
  GenerationGroundingError,
  GenerationInvalidOutputError,
  GenerationProviderError,
  GenerationRateLimitError,
  GenerationTimeoutError,
} from "@/features/portfolio-ai/generation/generation.errors";
import type {
  ConversationContextMessage,
  GeneratePortfolioAnswerOptions,
  PortfolioAIProvider,
} from "@/features/portfolio-ai/generation";
import { retrievePortfolioKnowledge } from "@/features/portfolio-ai/retrieval";
import type {
  PortfolioRetrievalResult,
  RetrievalLocale,
  RetrievalResultGroup,
} from "@/features/portfolio-ai/retrieval";
import type { LocaleCode } from "@/types/portfolio";

export const PORTFOLIO_AI_MAX_MESSAGE_LENGTH = 2_000;
export {
  PORTFOLIO_AI_MAX_HISTORY_MESSAGES,
  PORTFOLIO_AI_MAX_HISTORY_MESSAGE_LENGTH,
  PORTFOLIO_AI_MAX_HISTORY_TOTAL_LENGTH,
} from "@/features/portfolio-ai/api/conversation-context";

export type PortfolioAIRequestPayload = {
  message: string;
  locale?: LocaleCode;
  history?: ConversationContextMessage[];
};

export type PublicPortfolioAISource = {
  id: string;
  entityId: string;
  type: string;
  label: string;
};

export type PublicPortfolioAIResponse = {
  requestId: string;
  answer: string;
  language: LocaleCode;
  uncertainty: string;
  sources: PublicPortfolioAISource[];
};

export type PublicPortfolioAIErrorResponse = {
  requestId: string;
  error: {
    code:
      | "INVALID_REQUEST"
      | "AI_TEMPORARILY_UNAVAILABLE"
      | "AI_TIMEOUT"
      | "AI_UNAVAILABLE"
      | "AI_RESPONSE_INVALID"
      | "AI_PROVIDER_ERROR"
      | "RATE_LIMITED";
    message: string;
    retryable: boolean;
    retryAfterSeconds?: number;
  };
};

export type PortfolioAIHTTPResult =
  | {
      status: 200;
      body: PublicPortfolioAIResponse;
    }
  | {
      status: 400 | 429 | 500 | 502 | 503 | 504;
      body: PublicPortfolioAIErrorResponse;
    };

export type PortfolioAIServiceOptions = {
  provider?: PortfolioAIProvider;
  requestId?: string;
  clientKey?: string;
  rateLimiter?: PortfolioAIRateLimiter | false;
  signal?: AbortSignal;
};

class PortfolioAIRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortfolioAIRequestValidationError";
  }
}

class PortfolioAIRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Too many AI requests.");
    this.name = "PortfolioAIRateLimitError";
  }
}

export function createPortfolioAIRequestId() {
  return `pai_${crypto.randomUUID()}`;
}

export function validatePortfolioAIRequestPayload(
  rawPayload: unknown,
): PortfolioAIRequestPayload {
  if (typeof rawPayload !== "object" || rawPayload === null) {
    throw new PortfolioAIRequestValidationError(
      "Request body must be a JSON object.",
    );
  }

  const payload = rawPayload as Record<string, unknown>;
  const message = payload.message;

  if (typeof message !== "string") {
    throw new PortfolioAIRequestValidationError("message must be a string.");
  }

  const trimmedMessage = message.trim();

  if (!trimmedMessage) {
    throw new PortfolioAIRequestValidationError("message cannot be empty.");
  }

  if (trimmedMessage.length > PORTFOLIO_AI_MAX_MESSAGE_LENGTH) {
    throw new PortfolioAIRequestValidationError(
      `message cannot exceed ${PORTFOLIO_AI_MAX_MESSAGE_LENGTH} characters.`,
    );
  }

  if (
    payload.locale !== undefined &&
    payload.locale !== "fr" &&
    payload.locale !== "en"
  ) {
    throw new PortfolioAIRequestValidationError("locale must be fr or en.");
  }

  let history: ConversationContextMessage[] | undefined;

  if (payload.history !== undefined) {
    if (!Array.isArray(payload.history)) {
      throw new PortfolioAIRequestValidationError("history must be an array.");
    }

    if (payload.history.length > PORTFOLIO_AI_MAX_HISTORY_MESSAGES) {
      throw new PortfolioAIRequestValidationError(
        `history cannot exceed ${PORTFOLIO_AI_MAX_HISTORY_MESSAGES} messages.`,
      );
    }

    let totalHistoryLength = 0;

    history = payload.history.map((item) => {
      if (typeof item !== "object" || item === null) {
        throw new PortfolioAIRequestValidationError(
          "history items must be objects.",
        );
      }

      const historyItem = item as Record<string, unknown>;

      if (historyItem.role !== "user" && historyItem.role !== "assistant") {
        throw new PortfolioAIRequestValidationError(
          "history role must be user or assistant.",
        );
      }

      if (typeof historyItem.content !== "string") {
        throw new PortfolioAIRequestValidationError(
          "history content must be a string.",
        );
      }

      const content = historyItem.content.trim();

      if (!content) {
        throw new PortfolioAIRequestValidationError(
          "history content cannot be empty.",
        );
      }

      if (content.length > PORTFOLIO_AI_MAX_HISTORY_MESSAGE_LENGTH) {
        throw new PortfolioAIRequestValidationError(
          `history content cannot exceed ${PORTFOLIO_AI_MAX_HISTORY_MESSAGE_LENGTH} characters.`,
        );
      }

      totalHistoryLength += content.length;

      if (totalHistoryLength > PORTFOLIO_AI_MAX_HISTORY_TOTAL_LENGTH) {
        throw new PortfolioAIRequestValidationError(
          `history content cannot exceed ${PORTFOLIO_AI_MAX_HISTORY_TOTAL_LENGTH} total characters.`,
        );
      }

      return {
        role: historyItem.role,
        content,
      };
    });
  }

  return {
    message: trimmedMessage,
    locale: payload.locale as LocaleCode | undefined,
    history,
  };
}

function collectGroupEvidenceIds(group: RetrievalResultGroup) {
  const evidence = [
    ...group.evidence,
    ...group.facts.flatMap((fact) => fact.evidence),
    ...group.relations.flatMap((relation) => relation.evidence),
  ];

  return new Set(evidence.map(createEvidenceId));
}

function findGroupEvidence(
  group: RetrievalResultGroup,
  evidenceId: string,
) {
  const evidence = [
    ...group.evidence,
    ...group.facts.flatMap((fact) => fact.evidence),
    ...group.relations.flatMap((relation) => relation.evidence),
  ];

  return evidence.find((item) => createEvidenceId(item) === evidenceId);
}

function publicSourceForEvidenceId(
  group: RetrievalResultGroup,
  evidenceId: string,
  locale: LocaleCode,
): { key: string; source: PublicPortfolioAISource } {
  const evidence = findGroupEvidence(group, evidenceId);

  if (group.entity.type === "certification") {
    return {
      key: `certification:${group.entity.id}`,
      source: {
        id: evidenceId,
        entityId: group.entity.id,
        type: "certification",
        label: group.entity.canonicalName,
      },
    };
  }

  if (
    group.entity.id === PERSON_ID &&
    evidence?.sourceType === "portfolio" &&
    (evidence.sourceId === "technical-skills" ||
      evidence.sourceId === "languages" ||
      evidence.sourceId === "availability" ||
      evidence.sourceId === "career-target" ||
      evidence.sourceId === "certifications")
  ) {
    const label =
      evidence.sourceId === "languages"
        ? locale === "en"
          ? "Languages"
          : "Langues"
        : evidence.sourceId === "availability"
          ? locale === "en"
            ? "Availability"
            : "Disponibilités"
          : evidence.sourceId === "career-target"
            ? locale === "en"
              ? "Career target"
              : "Objectif professionnel"
            : evidence.sourceId === "certifications"
              ? locale === "en"
                ? "Certifications"
                : "Certifications"
              : locale === "en"
                ? "Technical profile"
                : "Profil technique";
    const key = `profile:${evidence.sourceId}`;

    return {
      key,
      source: {
        id: evidenceId,
        entityId: group.entity.id,
        type: "profile",
        label,
      },
    };
  }

  return {
    key: `${group.entity.type}:${group.entity.id}`,
    source: {
      id: evidenceId,
      entityId: group.entity.id,
      type: group.entity.type,
      label:
        group.entity.localeContent?.[locale]?.title ??
        group.entity.canonicalName,
    },
  };
}

export function projectPublicSources(
  retrieval: PortfolioRetrievalResult,
  usedEvidenceIds: readonly string[],
  locale: LocaleCode = "fr",
): PublicPortfolioAISource[] {
  const sources: PublicPortfolioAISource[] = [];
  const emittedPublicEntityKeys = new Set<string>();

  for (const evidenceId of usedEvidenceIds) {
    const matchingGroup = retrieval.results.find((group) =>
      collectGroupEvidenceIds(group).has(evidenceId),
    );

    if (!matchingGroup) {
      continue;
    }

    const { key: publicEntityKey, source } = publicSourceForEvidenceId(
      matchingGroup,
      evidenceId,
      locale,
    );

    if (emittedPublicEntityKeys.has(publicEntityKey)) {
      continue;
    }

    sources.push(source);
    emittedPublicEntityKeys.add(publicEntityKey);
  }

  return sources;
}

function publicError(
  requestId: string,
  status: PortfolioAIHTTPResult["status"],
  code: PublicPortfolioAIErrorResponse["error"]["code"],
  message: string,
  retryable: boolean,
  retryAfterSeconds?: number,
): PortfolioAIHTTPResult {
  return {
    status: status === 200 ? 500 : status,
    body: {
      requestId,
      error: {
        code,
        message,
        retryable,
        ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
      },
    },
  };
}

export function mapPortfolioAIErrorToHTTPResult(
  error: unknown,
  requestId: string,
): PortfolioAIHTTPResult {
  if (error instanceof PortfolioAIRequestValidationError) {
    return publicError(requestId, 400, "INVALID_REQUEST", error.message, false);
  }

  if (error instanceof PortfolioAIRateLimitError) {
    return publicError(
      requestId,
      429,
      "RATE_LIMITED",
      "Too many AI requests. Please try again shortly.",
      true,
      error.retryAfterSeconds,
    );
  }

  if (error instanceof GenerationRateLimitError) {
    return publicError(
      requestId,
      503,
      "AI_TEMPORARILY_UNAVAILABLE",
      "Portfolio AI is temporarily unavailable. Please try again shortly.",
      true,
    );
  }

  if (error instanceof GenerationTimeoutError) {
    return publicError(
      requestId,
      504,
      "AI_TIMEOUT",
      "Portfolio AI took too long to respond. Please try again.",
      true,
    );
  }

  if (error instanceof GenerationConfigurationError) {
    return publicError(
      requestId,
      500,
      "AI_UNAVAILABLE",
      "Portfolio AI is currently unavailable.",
      false,
    );
  }

  if (
    error instanceof GenerationInvalidOutputError ||
    error instanceof GenerationGroundingError
  ) {
    return publicError(
      requestId,
      502,
      "AI_RESPONSE_INVALID",
      "Portfolio AI could not produce a reliable answer.",
      true,
    );
  }

  if (error instanceof GenerationProviderError) {
    return publicError(
      requestId,
      502,
      "AI_PROVIDER_ERROR",
      "Portfolio AI is temporarily unavailable.",
      true,
    );
  }

  return publicError(
    requestId,
    502,
    "AI_PROVIDER_ERROR",
    "Portfolio AI is temporarily unavailable.",
    true,
  );
}

export type PreparedPortfolioAIRequest = {
  payload: PortfolioAIRequestPayload;
  locale: RetrievalLocale;
  retrieval: PortfolioRetrievalResult;
  conversationContext: ReturnType<typeof buildConversationContext>;
  requiresProviderGeneration: boolean;
};

function hasCurrentEducationFastPath(retrieval: PortfolioRetrievalResult) {
  return (
    retrieval.intent === "education_lookup" &&
    retrieval.status === "verified" &&
    retrieval.results.some(
      (result) =>
        result.entity.id === "education-isima-siad-2026" &&
        result.facts.some(
          (fact) =>
            fact.predicate === "educationStatus" &&
            fact.value === "in_progress" &&
            fact.status === "verified",
        ),
    )
  );
}

function hasDeterministicFastPath(retrieval: PortfolioRetrievalResult) {
  if (retrieval.notDocumented && retrieval.results.length === 0) {
    return true;
  }

  if (hasCurrentEducationFastPath(retrieval)) {
    return true;
  }

  return (
    retrieval.status === "verified" &&
    [
      "availability_lookup",
      "career_target_lookup",
      "certification_lookup",
      "journey_summary",
      "language_lookup",
      "language_overview",
      "profile_lookup",
      "project_technology_lookup",
      "technical_skills_overview",
      "skills_by_category",
      "skill_lookup",
      "technology_evidence",
    ].includes(retrieval.intent)
  );
}

export function preparePortfolioAIRequest(
  rawPayload: unknown,
): PreparedPortfolioAIRequest {
  const payload = validatePortfolioAIRequestPayload(rawPayload);
  const uiLocale =
    payload.locale ?? detectPortfolioAIResponseLanguage(payload.message, "fr");
  const locale = detectPortfolioAIResponseLanguage(
    payload.message,
    uiLocale,
  );
  const conversationContext = buildConversationContext(
    payload.message,
    locale,
    payload.history,
  );
  const retrieval = retrievePortfolioKnowledge(conversationContext.retrievalQuery, {
    locale,
    topK: 5,
  });

  return {
    payload,
    locale,
    retrieval,
    conversationContext,
    requiresProviderGeneration: !hasDeterministicFastPath(retrieval),
  };
}

export function acquirePortfolioAIGenerationAccessForTransport(
  prepared: PreparedPortfolioAIRequest,
  options: PortfolioAIServiceOptions,
) {
  if (
    !prepared.requiresProviderGeneration ||
    !options.clientKey ||
    options.rateLimiter === false
  ) {
    return () => {};
  }

  const limiter = options.rateLimiter ?? portfolioAIRateLimiter;
  const slot = limiter.acquireGenerationSlot(options.clientKey);

  if (!slot.allowed) {
    throw new PortfolioAIRateLimitError(slot.retryAfterSeconds);
  }

  const quota = limiter.checkProviderLimit(options.clientKey);

  if (!quota.allowed) {
    limiter.releaseGenerationSlot(options.clientKey);
    throw new PortfolioAIRateLimitError(quota.retryAfterSeconds);
  }

  let released = false;

  return () => {
    if (!released) {
      released = true;
      limiter.releaseGenerationSlot(options.clientKey as string);
    }
  };
}

export async function generatePublicPortfolioAIResponse(
  prepared: PreparedPortfolioAIRequest,
  requestId: string,
  options: PortfolioAIServiceOptions = {},
): Promise<PublicPortfolioAIResponse> {
  const generationOptions: GeneratePortfolioAnswerOptions = {};

  if (options.provider) {
    generationOptions.provider = options.provider;
  }

  if (options.signal) {
    generationOptions.signal = options.signal;
  }

  generationOptions.requestId = requestId;

  const result = await generatePortfolioAnswer(
    {
      question: prepared.payload.message,
      locale: prepared.locale,
      retrieval: prepared.retrieval,
      conversationContext:
        prepared.conversationContext.messages.length > 0
          ? prepared.conversationContext.messages
          : undefined,
    },
    generationOptions,
  );

  return {
    requestId,
    answer: result.answer.answer,
    language: result.answer.language,
    uncertainty: result.answer.uncertainty,
    sources: projectPublicSources(
      prepared.retrieval,
      result.answer.usedEvidenceIds,
      result.answer.language,
    ),
  };
}

export async function handlePortfolioAIRequest(
  rawPayload: unknown,
  options: PortfolioAIServiceOptions = {},
): Promise<PortfolioAIHTTPResult> {
  const requestId = options.requestId ?? createPortfolioAIRequestId();
  const requestStartedAt = Date.now();
  let debugStatus: number | undefined;
  let debugErrorClass: string | undefined;

  try {
    const retrievalStartedAt = Date.now();
    const prepared = preparePortfolioAIRequest(rawPayload);
    logPortfolioAIDebug("api.retrieval", {
      requestId,
      intent: prepared.retrieval.intent,
      requestedProjectAttribute: prepared.retrieval.requestedProjectAttribute,
      elapsedMs: Date.now() - retrievalStartedAt,
      retrievedEntityIds: prepared.retrieval.results.map(
        (result) => result.entity.id,
      ),
      evidenceIds: prepared.retrieval.results.flatMap((result) =>
        [...collectGroupEvidenceIds(result)],
      ),
    });
    const release = acquirePortfolioAIGenerationAccessForTransport(
      prepared,
      options,
    );
    let body: PublicPortfolioAIResponse;

    try {
      body = await generatePublicPortfolioAIResponse(
        prepared,
        requestId,
        options,
      );
    } finally {
      release();
    }

    debugStatus = 200;

    return {
      status: 200,
      body,
    };
  } catch (error) {
    const result = mapPortfolioAIErrorToHTTPResult(error, requestId);

    debugStatus = result.status;
    debugErrorClass = error instanceof Error ? error.name : "UnknownError";

    return result;
  } finally {
    logPortfolioAIDebug("api.request", {
      requestId,
      elapsedMs: Date.now() - requestStartedAt,
      status: debugStatus,
      normalizedErrorClass: debugErrorClass,
    });
  }
}
