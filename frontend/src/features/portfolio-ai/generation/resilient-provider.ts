import "server-only";

import {
  getFreeLLMAPIGenerationConfig,
  PORTFOLIO_AI_PRIMARY_TIMEOUT_MS,
} from "@/features/portfolio-ai/generation/generation.config";
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
      return this.primary.generate(input);
    }

    const primaryAbortController = new AbortController();
    let primaryTimedOut = false;
    const primaryTimeout = setTimeout(() => {
      primaryTimedOut = true;
      primaryAbortController.abort();
    }, this.primaryTimeoutMs);
    const cancelPrimaryForClientAbort = () => primaryAbortController.abort();

    input.signal?.addEventListener("abort", cancelPrimaryForClientAbort, {
      once: true,
    });

    try {
      return await this.primary.generate({
        ...input,
        signal: primaryAbortController.signal,
      });
    } catch (error) {
      if (input.signal?.aborted) {
        throw abortedError(input.signal);
      }

      const normalizedPrimaryError =
        primaryTimedOut && isAbortError(error)
          ? new GenerationTimeoutError("Portfolio AI primary provider timed out.")
          : error;

      if (!isFallbackEligibleGenerationError(normalizedPrimaryError)) {
        if (isAbortError(error)) {
          throw error;
        }

        throw normalizeGenerationError(normalizedPrimaryError);
      }
    } finally {
      input.signal?.removeEventListener("abort", cancelPrimaryForClientAbort);
      clearTimeout(primaryTimeout);
    }

    if (input.signal?.aborted) {
      throw abortedError(input.signal);
    }

    try {
      return await secondary.generate(input);
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

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
