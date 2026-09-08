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
    const startedAt = Date.now();
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      this.config.timeoutMs,
    );

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
      throw normalizeGenerationError(error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

let defaultProvider: GeminiPortfolioAIProvider | undefined;

export function getDefaultPortfolioAIProvider() {
  defaultProvider ??= new GeminiPortfolioAIProvider();

  return defaultProvider;
}
