import "server-only";

import { GenerationConfigurationError } from "@/features/portfolio-ai/generation/generation.errors";

export const DEFAULT_PORTFOLIO_AI_MODEL = "gemini-3.6-flash";
export const DEFAULT_FREELLMAPI_BASE_URL = "http://127.0.0.1:3001/v1";
export const DEFAULT_FREELLMAPI_MODEL = "auto:fast";
export const PORTFOLIO_AI_PRIMARY_TIMEOUT_MS = 6_000;
export const PORTFOLIO_AI_PROVIDER_TIMEOUT_MS = 25_000;
export const PORTFOLIO_AI_FALLBACK_TIMEOUT_MS = 10_000;
export const DEFAULT_GENERATION_MAX_OUTPUT_TOKENS = 512;
export const DEFAULT_GENERATION_MAX_RETRIES = 1;
export const MAX_GENERATED_ANSWER_LENGTH = 1_800;

export type PortfolioAIGenerationConfig = {
  provider: "gemini";
  apiKey?: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  maxRetries: number;
};

export type FreeLLMAPIGenerationConfig = {
  enabled: boolean;
  apiKey?: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
};

export type PortfolioAIGenerationEnvironmentValidation = {
  valid: boolean;
  errors: string[];
  credentialDetected: boolean;
  googleCredentialDetected: boolean;
  publicCredentialDetected: boolean;
  model: string;
  freeLLMAPIEnabled: boolean;
  freeLLMAPICredentialDetected: boolean;
  freeLLMAPIPublicCredentialDetected: boolean;
  freeLLMAPIModel: string;
  providerTimeoutMs: number;
  freeLLMAPITimeoutMs: number;
};

function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveModel(env: Partial<Record<string, string | undefined>>) {
  if (env.PORTFOLIO_AI_MODEL === undefined) {
    return DEFAULT_PORTFOLIO_AI_MODEL;
  }

  return env.PORTFOLIO_AI_MODEL.trim();
}

function isEnabled(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

function resolveFreeLLMAPIBaseUrl(
  env: Partial<Record<string, string | undefined>>,
) {
  return env.FREELLMAPI_BASE_URL?.trim() || DEFAULT_FREELLMAPI_BASE_URL;
}

function resolveFreeLLMAPIModel(
  env: Partial<Record<string, string | undefined>>,
) {
  if (env.FREELLMAPI_MODEL === undefined) {
    return DEFAULT_FREELLMAPI_MODEL;
  }

  return env.FREELLMAPI_MODEL.trim();
}

function resolveFallbackTimeoutMs(
  env: Partial<Record<string, string | undefined>>,
) {
  if (env.PORTFOLIO_AI_FALLBACK_TIMEOUT_MS === undefined) {
    return PORTFOLIO_AI_FALLBACK_TIMEOUT_MS;
  }

  const value = Number(env.PORTFOLIO_AI_FALLBACK_TIMEOUT_MS);

  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function resolveProviderTimeoutMs(
  env: Partial<Record<string, string | undefined>>,
) {
  if (env.PORTFOLIO_AI_PROVIDER_TIMEOUT_MS === undefined) {
    return PORTFOLIO_AI_PROVIDER_TIMEOUT_MS;
  }

  const value = Number(env.PORTFOLIO_AI_PROVIDER_TIMEOUT_MS);

  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function isValidHTTPUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validatePortfolioAIGenerationEnvironment(
  env: Partial<Record<string, string | undefined>> = process.env,
): PortfolioAIGenerationEnvironmentValidation {
  const errors: string[] = [];
  const model = resolveModel(env);
  const freeLLMAPIEnabled = isEnabled(env.FREELLMAPI_ENABLED);
  const freeLLMAPIBaseUrl = resolveFreeLLMAPIBaseUrl(env);
  const freeLLMAPIModel = resolveFreeLLMAPIModel(env);
  const providerTimeoutMs = resolveProviderTimeoutMs(env);
  const fallbackTimeoutMs = resolveFallbackTimeoutMs(env);
  const publicCredentialDetected =
    hasValue(env.NEXT_PUBLIC_GEMINI_API_KEY) ||
    hasValue(env.NEXT_PUBLIC_GOOGLE_API_KEY);
  const freeLLMAPIPublicCredentialDetected = hasValue(
    env.NEXT_PUBLIC_FREELLMAPI_API_KEY,
  );

  if (publicCredentialDetected) {
    errors.push("Gemini credentials must not be exposed with NEXT_PUBLIC_*.");
  }

  if (freeLLMAPIPublicCredentialDetected) {
    errors.push("FreeLLMAPI credentials must not be exposed with NEXT_PUBLIC_*.");
  }

  if (!model) {
    errors.push("PORTFOLIO_AI_MODEL cannot be empty.");
  }

  if (providerTimeoutMs === undefined) {
    errors.push("PORTFOLIO_AI_PROVIDER_TIMEOUT_MS must be a positive integer.");
  }

  if (freeLLMAPIEnabled) {
    if (!hasValue(env.FREELLMAPI_API_KEY)) {
      errors.push("FREELLMAPI_API_KEY is required when FREELLMAPI_ENABLED=true.");
    }

    if (!freeLLMAPIModel) {
      errors.push("FREELLMAPI_MODEL cannot be empty when FreeLLMAPI is enabled.");
    }

    if (!isValidHTTPUrl(freeLLMAPIBaseUrl)) {
      errors.push("FREELLMAPI_BASE_URL must be a valid HTTP(S) URL.");
    }

    if (fallbackTimeoutMs === undefined) {
      errors.push(
        "PORTFOLIO_AI_FALLBACK_TIMEOUT_MS must be a positive integer.",
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    credentialDetected: hasValue(env.GEMINI_API_KEY),
    googleCredentialDetected: hasValue(env.GOOGLE_API_KEY),
    publicCredentialDetected,
    model: model || DEFAULT_PORTFOLIO_AI_MODEL,
    freeLLMAPIEnabled,
    freeLLMAPICredentialDetected: hasValue(env.FREELLMAPI_API_KEY),
    freeLLMAPIPublicCredentialDetected,
    freeLLMAPIModel: freeLLMAPIModel || DEFAULT_FREELLMAPI_MODEL,
    providerTimeoutMs: providerTimeoutMs ?? PORTFOLIO_AI_PROVIDER_TIMEOUT_MS,
    freeLLMAPITimeoutMs: fallbackTimeoutMs ?? PORTFOLIO_AI_FALLBACK_TIMEOUT_MS,
  };
}

export function assertPortfolioAIGenerationEnvironment(
  env: Partial<Record<string, string | undefined>> = process.env,
) {
  const validation = validatePortfolioAIGenerationEnvironment(env);

  if (!validation.valid) {
    throw new GenerationConfigurationError(
      `Portfolio AI generation environment is invalid: ${validation.errors.join(" ")}`,
    );
  }
}

export function assertPortfolioAIGeminiConfig(
  config: PortfolioAIGenerationConfig,
) {
  if (!config.apiKey?.trim()) {
    throw new GenerationConfigurationError("GEMINI_API_KEY is required.");
  }

  if (!config.model.trim()) {
    throw new GenerationConfigurationError("PORTFOLIO_AI_MODEL is required.");
  }

  if (!Number.isInteger(config.timeoutMs) || config.timeoutMs <= 0) {
    throw new GenerationConfigurationError(
      "PORTFOLIO_AI_PROVIDER_TIMEOUT_MS is invalid.",
    );
  }
}

export function assertFreeLLMAPIConfig(config: FreeLLMAPIGenerationConfig) {
  if (!config.enabled) {
    throw new GenerationConfigurationError("FreeLLMAPI fallback is disabled.");
  }

  if (!config.apiKey?.trim()) {
    throw new GenerationConfigurationError("FREELLMAPI_API_KEY is required.");
  }

  if (!config.model.trim()) {
    throw new GenerationConfigurationError("FREELLMAPI_MODEL is required.");
  }

  if (!isValidHTTPUrl(config.baseUrl)) {
    throw new GenerationConfigurationError("FREELLMAPI_BASE_URL is invalid.");
  }

  if (!Number.isInteger(config.timeoutMs) || config.timeoutMs <= 0) {
    throw new GenerationConfigurationError(
      "PORTFOLIO_AI_FALLBACK_TIMEOUT_MS is invalid.",
    );
  }
}

export function getPortfolioAIGenerationConfig(
  env: Partial<Record<string, string | undefined>> = process.env,
): PortfolioAIGenerationConfig {
  assertPortfolioAIGenerationEnvironment(env);

  return {
    provider: "gemini",
    apiKey: env.GEMINI_API_KEY,
    model: resolveModel(env),
    timeoutMs: resolveProviderTimeoutMs(env) ?? PORTFOLIO_AI_PROVIDER_TIMEOUT_MS,
    maxOutputTokens: DEFAULT_GENERATION_MAX_OUTPUT_TOKENS,
    maxRetries: DEFAULT_GENERATION_MAX_RETRIES,
  };
}

export function getFreeLLMAPIGenerationConfig(
  env: Partial<Record<string, string | undefined>> = process.env,
): FreeLLMAPIGenerationConfig {
  assertPortfolioAIGenerationEnvironment(env);

  return {
    enabled: isEnabled(env.FREELLMAPI_ENABLED),
    apiKey: env.FREELLMAPI_API_KEY,
    baseUrl: resolveFreeLLMAPIBaseUrl(env).replace(/\/+$/g, ""),
    model: resolveFreeLLMAPIModel(env),
    timeoutMs: resolveFallbackTimeoutMs(env) ?? PORTFOLIO_AI_FALLBACK_TIMEOUT_MS,
  };
}
