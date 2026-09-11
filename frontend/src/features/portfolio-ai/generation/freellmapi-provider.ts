import "server-only";

import { parsePortfolioAnswer } from "@/features/portfolio-ai/generation/answer.schema";
import {
  assertFreeLLMAPIConfig,
  getFreeLLMAPIGenerationConfig,
  type FreeLLMAPIGenerationConfig,
} from "@/features/portfolio-ai/generation/generation.config";
import {
  GenerationConfigurationError,
  GenerationInvalidOutputError,
  GenerationProviderError,
  GenerationRateLimitError,
  GenerationTimeoutError,
} from "@/features/portfolio-ai/generation/generation.errors";
import type {
  GroundedGenerationInput,
  PortfolioAIProvider,
  ProviderGenerationResult,
  ProviderUsageMetadata,
} from "@/features/portfolio-ai/generation/generation.types";

type FreeLLMAPIFetch = typeof fetch;

type FreeLLMAPIUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type FreeLLMAPIChatCompletion = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  usage?: FreeLLMAPIUsage;
};

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

function normalizeUsage(
  usage: FreeLLMAPIUsage | undefined,
): ProviderUsageMetadata | undefined {
  if (!usage) {
    return undefined;
  }

  return {
    promptTokenCount: usage.prompt_tokens,
    candidatesTokenCount: usage.completion_tokens,
    totalTokenCount: usage.total_tokens,
  };
}

function normalizeHTTPError(status: number) {
  if (status === 429) {
    return new GenerationRateLimitError();
  }

  if (status === 401 || status === 403) {
    return new GenerationConfigurationError(
      "FreeLLMAPI authentication is not configured correctly.",
    );
  }

  if (status >= 500) {
    return new GenerationProviderError("FreeLLMAPI upstream request failed.");
  }

  return new GenerationProviderError("FreeLLMAPI request failed.");
}

function parseJSONResponse(value: unknown): FreeLLMAPIChatCompletion {
  if (typeof value !== "object" || value === null) {
    throw new GenerationInvalidOutputError(
      "FreeLLMAPI response must be an object.",
    );
  }

  return value as FreeLLMAPIChatCompletion;
}

function readAssistantContent(response: FreeLLMAPIChatCompletion) {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new GenerationInvalidOutputError(
      "FreeLLMAPI response did not include assistant JSON content.",
    );
  }

  return content;
}

function parseStructuredAnswer(content: string) {
  try {
    return parsePortfolioAnswer(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new GenerationInvalidOutputError(
        "FreeLLMAPI assistant content is not valid JSON.",
      );
    }

    throw error;
  }
}

export class FreeLLMAPIPortfolioAIProvider implements PortfolioAIProvider {
  private readonly config: FreeLLMAPIGenerationConfig;
  private readonly fetcher: FreeLLMAPIFetch;

  constructor(
    config: FreeLLMAPIGenerationConfig = getFreeLLMAPIGenerationConfig(),
    fetcher: FreeLLMAPIFetch = fetch,
  ) {
    this.config = config;
    this.fetcher = fetcher;
  }

  async generate(
    input: GroundedGenerationInput,
  ): Promise<ProviderGenerationResult> {
    if (input.signal?.aborted) {
      throw abortedError(input.signal);
    }

    assertFreeLLMAPIConfig(this.config);

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
      const response = await this.fetcher(
        `${this.config.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: "system",
                content: input.systemPrompt,
              },
              {
                role: "user",
                content: input.userPrompt,
              },
            ],
            stream: false,
          }),
          signal: abortController.signal,
        },
      );

      if (!response.ok) {
        throw normalizeHTTPError(response.status);
      }

      let parsedResponse: unknown;

      try {
        parsedResponse = await response.json();
      } catch {
        throw new GenerationInvalidOutputError(
          "FreeLLMAPI response body is not valid JSON.",
        );
      }

      const payload = parseJSONResponse(parsedResponse);
      const content = readAssistantContent(payload);
      const parsedAnswer = parseStructuredAnswer(content);

      return {
        output: parsedAnswer,
        provider: "freellmapi",
        model: this.config.model,
        latencyMs: Date.now() - startedAt,
        usage: normalizeUsage(payload.usage),
      };
    } catch (error) {
      if (timedOut) {
        throw new GenerationTimeoutError();
      }

      if (input.signal?.aborted && isAbortError(error)) {
        throw abortedError(input.signal);
      }

      if (
        error instanceof GenerationConfigurationError ||
        error instanceof GenerationInvalidOutputError ||
        error instanceof GenerationProviderError ||
        error instanceof GenerationRateLimitError ||
        error instanceof GenerationTimeoutError
      ) {
        throw error;
      }

      throw new GenerationProviderError();
    } finally {
      input.signal?.removeEventListener("abort", cancelForClientAbort);
      clearTimeout(timeout);
    }
  }
}
