import "server-only";

import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { portfolioAnswerResponseSchema } from "@/features/portfolio-ai/generation/answer.schema";
import {
  assertPortfolioAIGeminiConfig,
  getPortfolioAIGenerationConfig,
  type PortfolioAIGenerationConfig,
} from "@/features/portfolio-ai/generation/generation.config";
import {
  GenerationProviderError,
  GenerationTimeoutError,
  normalizeGenerationError,
} from "@/features/portfolio-ai/generation/generation.errors";
import type {
  GroundedGenerationInput,
  PortfolioAIProvider,
  ProviderGenerationResult,
  ProviderUsageMetadata,
} from "@/features/portfolio-ai/generation/generation.types";

type GeminiUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

function normalizeUsage(
  usage: GeminiUsageMetadata | undefined,
): ProviderUsageMetadata | undefined {
  if (!usage) {
    return undefined;
  }

  return {
    promptTokenCount: usage.promptTokenCount,
    candidatesTokenCount: usage.candidatesTokenCount,
    totalTokenCount: usage.totalTokenCount,
  };
}

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

export class GeminiPortfolioAIProvider implements PortfolioAIProvider {
  private readonly config: PortfolioAIGenerationConfig;
  private client?: GoogleGenAI;

  constructor(config: PortfolioAIGenerationConfig = getPortfolioAIGenerationConfig()) {
    this.config = config;
  }

  private getClient() {
    assertPortfolioAIGeminiConfig(this.config);

    this.client ??= new GoogleGenAI({
      apiKey: this.config.apiKey,
      httpOptions: {
        timeout: this.config.timeoutMs,
      },
    });

    return this.client;
  }

  async generate(
    input: GroundedGenerationInput,
  ): Promise<ProviderGenerationResult> {
    if (input.signal?.aborted) {
      throw abortedError(input.signal);
    }

    const startedAt = Date.now();
    const abortController = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      abortController.abort();
    }, this.config.timeoutMs);
    const cancelForClientAbort = () => abortController.abort(input.signal?.reason);

    input.signal?.addEventListener("abort", cancelForClientAbort, { once: true });

    try {
      const response = await this.getClient().models.generateContent({
        model: input.model,
        contents: input.userPrompt,
        config: {
          systemInstruction: input.systemPrompt,
          responseMimeType: "application/json",
          responseSchema: portfolioAnswerResponseSchema,
          maxOutputTokens: this.config.maxOutputTokens,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          httpOptions: {
            timeout: this.config.timeoutMs,
          },
          abortSignal: abortController.signal,
        },
      });
      const text = response.text;

      if (!text) {
        throw new GenerationProviderError("Gemini returned an empty response.");
      }

      return {
        output: text,
        rawText: text,
        model: input.model,
        provider: "gemini",
        latencyMs: Date.now() - startedAt,
        usage: normalizeUsage(response.usageMetadata),
      };
    } catch (error) {
      if (timedOut) {
        throw new GenerationTimeoutError();
      }

      if (input.signal?.aborted && isAbortError(error)) {
        throw abortedError(input.signal);
      }

      throw normalizeGenerationError(error);
    } finally {
      input.signal?.removeEventListener("abort", cancelForClientAbort);
      clearTimeout(timeout);
    }
  }
}

let defaultGeminiProvider: GeminiPortfolioAIProvider | undefined;

export function getDefaultGeminiPortfolioAIProvider() {
  defaultGeminiProvider ??= new GeminiPortfolioAIProvider();

  return defaultGeminiProvider;
}
