import "server-only";

import {
  getFreeLLMAPIGenerationConfig,
  PORTFOLIO_AI_PRIMARY_TIMEOUT_MS,
} from "@/features/portfolio-ai/generation/generation.config";
import {
  logPortfolioAIDebug,
} from "@/features/portfolio-ai/generation/debug";
import {
  GenerationProviderError,
  GenerationRateLimitError,
  GenerationTimeoutError,
  markGenerationErrorAsNonRetryable,
  normalizeGenerationError,
} from "@/features/portfolio-ai/generation/generation.errors";
import { FreeLLMAPIPortfolioAIProvider } from "@/features/portfolio-ai/generation/freellmapi-provider";
import {
  GeminiPortfolioAIProvider,
  getDefaultGeminiPortfolioAIProvider,
} from "@/features/portfolio-ai/generation/gemini-provider";
import type {
  GroundedGenerationInput,
  PortfolioAIProvider,
  ProviderGenerationResult,
} from "@/features/portfolio-ai/generation/generation.types";

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

function abortedError(signal: AbortSignal) {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }

  const error = new Error("Portfolio AI generation was aborted.");
  error.name = "AbortError";

  return error;
}

function primaryTimeoutError() {
  return new GenerationTimeoutError("Portfolio AI primary provider timed out.");
}

function elapsedSince(startedAt: number) {
  return Date.now() - startedAt;
}

function normalizedErrorClass(error: unknown) {
  return normalizeGenerationError(error).name;
}

export function isFallbackEligibleGenerationError(error: unknown) {
  if (isAbortError(error)) {
    return false;
  }

  const normalized = normalizeGenerationError(error);

  return (
    normalized instanceof GenerationRateLimitError ||
    normalized instanceof GenerationTimeoutError ||
    normalized instanceof GenerationProviderError
  );
}

export class ResilientPortfolioAIProvider implements PortfolioAIProvider {
  private readonly primaryTimeoutMs: number;

  constructor(
    private readonly primary: PortfolioAIProvider,
    private readonly secondary?: PortfolioAIProvider,
    options: { primaryTimeoutMs?: number } = {},
  ) {
    this.primaryTimeoutMs =
      options.primaryTimeoutMs ?? PORTFOLIO_AI_PRIMARY_TIMEOUT_MS;
  }

  async generate(
    input: GroundedGenerationInput,
  ): Promise<ProviderGenerationResult> {
    if (input.signal?.aborted) {
      throw abortedError(input.signal);
    }

    const secondary = this.secondary;

    if (!secondary) {
      const startedAt = Date.now();

      try {
        const result = await this.primary.generate(input);

        logPortfolioAIDebug("generation.primary", {
          requestId: input.requestId,
          intent: input.groundedContext.intent,
          provider: result.provider,
          elapsedMs: elapsedSince(startedAt),
          fallbackTriggered: "NO",
        });

        return result;
      } catch (error) {
        logPortfolioAIDebug("generation.primary", {
          requestId: input.requestId,
          intent: input.groundedContext.intent,
          provider: "gemini",
          elapsedMs: elapsedSince(startedAt),
          normalizedErrorClass: normalizedErrorClass(error),
          fallbackTriggered: "NO",
        });

        throw error;
      }
    }

    const primaryAbortController = new AbortController();
    const primaryStartedAt = Date.now();
    let primaryTimedOut = false;
    let primaryTimeout: ReturnType<typeof setTimeout> | undefined;
    const primaryTimeoutPromise = new Promise<never>((_resolve, reject) => {
      primaryTimeout = setTimeout(() => {
        primaryTimedOut = true;
        const error = primaryTimeoutError();

        primaryAbortController.abort(error);
        reject(error);
      }, this.primaryTimeoutMs);
    });
    let rejectForClientAbort: ((error: Error) => void) | undefined;
    const clientAbortPromise = new Promise<never>((_resolve, reject) => {
      rejectForClientAbort = reject;
    });
    const cancelPrimaryForClientAbort = () => {
      if (input.signal) {
        const error = abortedError(input.signal);

        primaryAbortController.abort(error);
        rejectForClientAbort?.(error);
      }
    };

    input.signal?.addEventListener("abort", cancelPrimaryForClientAbort, {
      once: true,
    });

    try {
      const primaryRequest = this.primary.generate({
        ...input,
        signal: primaryAbortController.signal,
      });
      const result = await Promise.race([
        primaryRequest,
        primaryTimeoutPromise,
        clientAbortPromise,
      ]);

      logPortfolioAIDebug("generation.primary", {
        requestId: input.requestId,
        intent: input.groundedContext.intent,
        provider: result.provider,
        elapsedMs: elapsedSince(primaryStartedAt),
        fallbackTriggered: "NO",
      });

      return result;
    } catch (error) {
      if (input.signal?.aborted) {
        throw abortedError(input.signal);
      }

      const normalizedPrimaryError =
        primaryTimedOut && isAbortError(error) ? primaryTimeoutError() : error;
      const fallbackEligible = isFallbackEligibleGenerationError(
        normalizedPrimaryError,
      );

      if (!fallbackEligible) {
        if (isAbortError(error)) {
          throw error;
        }

        logPortfolioAIDebug("generation.primary", {
          requestId: input.requestId,
          intent: input.groundedContext.intent,
          provider: "gemini",
          elapsedMs: elapsedSince(primaryStartedAt),
          normalizedErrorClass: normalizedErrorClass(normalizedPrimaryError),
          fallbackEligibleError: fallbackEligible,
          fallbackTriggered: "NO",
        });

        throw normalizeGenerationError(normalizedPrimaryError);
      }

      logPortfolioAIDebug("generation.primary", {
        requestId: input.requestId,
        intent: input.groundedContext.intent,
        provider: "gemini",
        elapsedMs: elapsedSince(primaryStartedAt),
        normalizedErrorClass: normalizedErrorClass(normalizedPrimaryError),
        fallbackEligibleError: fallbackEligible,
        fallbackTriggered: "YES",
      });
    } finally {
      input.signal?.removeEventListener("abort", cancelPrimaryForClientAbort);
      if (primaryTimeout) {
        clearTimeout(primaryTimeout);
      }
    }

    if (input.signal?.aborted) {
      throw abortedError(input.signal);
    }

    const fallbackStartedAt = Date.now();

    try {
      const result = await secondary.generate(input);

      logPortfolioAIDebug("generation.fallback", {
        requestId: input.requestId,
        intent: input.groundedContext.intent,
        provider: result.provider,
        elapsedMs: elapsedSince(fallbackStartedAt),
      });

      return result;
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      logPortfolioAIDebug("generation.fallback", {
        requestId: input.requestId,
        intent: input.groundedContext.intent,
        provider: "freellmapi",
        elapsedMs: elapsedSince(fallbackStartedAt),
        normalizedErrorClass: normalizedErrorClass(error),
      });

      throw markGenerationErrorAsNonRetryable(normalizeGenerationError(error));
    }
  }
}

let defaultProvider: PortfolioAIProvider | undefined;

export function getDefaultPortfolioAIProvider() {
  if (defaultProvider) {
    return defaultProvider;
  }

  const primary = getDefaultGeminiPortfolioAIProvider();
  const freeLLMAPIConfig = getFreeLLMAPIGenerationConfig();

  if (!freeLLMAPIConfig.enabled) {
    defaultProvider = primary;
    return defaultProvider;
  }

  defaultProvider = new ResilientPortfolioAIProvider(
    primary,
    new FreeLLMAPIPortfolioAIProvider(freeLLMAPIConfig),
  );

  return defaultProvider;
}

export function createDefaultResilientPortfolioAIProvider() {
  return new ResilientPortfolioAIProvider(
    new GeminiPortfolioAIProvider(),
    new FreeLLMAPIPortfolioAIProvider(),
  );
}
