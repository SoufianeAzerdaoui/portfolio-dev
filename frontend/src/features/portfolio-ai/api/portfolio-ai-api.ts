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
} from "@/features/portfolio-ai/generation";
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

export function projectPublicSources(
  retrieval: PortfolioRetrievalResult,
  usedEvidenceIds: readonly string[],
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

    const publicEntityKey = `${matchingGroup.entity.type}:${matchingGroup.entity.id}`;

    if (emittedPublicEntityKeys.has(publicEntityKey)) {
      continue;
    }

    sources.push({
      id: evidenceId,
      entityId: matchingGroup.entity.id,
      type: matchingGroup.entity.type,
      label:
        matchingGroup.entity.localeContent?.fr?.title ??
        matchingGroup.entity.canonicalName,
    });
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
    requiresProviderGeneration:
      !(retrieval.notDocumented && retrieval.results.length === 0),
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
    ),
  };
}

export async function handlePortfolioAIRequest(
  rawPayload: unknown,
  options: PortfolioAIServiceOptions = {},
): Promise<PortfolioAIHTTPResult> {
  const requestId = options.requestId ?? createPortfolioAIRequestId();

  try {
    const prepared = preparePortfolioAIRequest(rawPayload);
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

    return {
      status: 200,
      body,
    };
  } catch (error) {
    return mapPortfolioAIErrorToHTTPResult(error, requestId);
  }
}
