import "server-only";

import { GenerationConfigurationError } from "@/features/portfolio-ai/generation/generation.errors";

export const DEFAULT_PORTFOLIO_AI_MODEL = "gemini-3.6-flash";
export const PORTFOLIO_AI_PROVIDER_TIMEOUT_MS = 25_000;
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

export type PortfolioAIGenerationEnvironmentValidation = {
  valid: boolean;
  errors: string[];
  credentialDetected: boolean;
  googleCredentialDetected: boolean;
  publicCredentialDetected: boolean;
  model: string;
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

export function validatePortfolioAIGenerationEnvironment(
  env: Partial<Record<string, string | undefined>> = process.env,
): PortfolioAIGenerationEnvironmentValidation {
  const errors: string[] = [];
  const model = resolveModel(env);
  const publicCredentialDetected =
    hasValue(env.NEXT_PUBLIC_GEMINI_API_KEY) ||
    hasValue(env.NEXT_PUBLIC_GOOGLE_API_KEY);

  if (publicCredentialDetected) {
    errors.push("Gemini credentials must not be exposed with NEXT_PUBLIC_*.");
  }

  if (!model) {
    errors.push("PORTFOLIO_AI_MODEL cannot be empty.");
  }

  return {
    valid: errors.length === 0,
    errors,
    credentialDetected: hasValue(env.GEMINI_API_KEY),
    googleCredentialDetected: hasValue(env.GOOGLE_API_KEY),
    publicCredentialDetected,
    model: model || DEFAULT_PORTFOLIO_AI_MODEL,
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
}

export function getPortfolioAIGenerationConfig(
  env: Partial<Record<string, string | undefined>> = process.env,
): PortfolioAIGenerationConfig {
  assertPortfolioAIGenerationEnvironment(env);

  return {
    provider: "gemini",
    apiKey: env.GEMINI_API_KEY,
    model: resolveModel(env),
    timeoutMs: PORTFOLIO_AI_PROVIDER_TIMEOUT_MS,
    maxOutputTokens: DEFAULT_GENERATION_MAX_OUTPUT_TOKENS,
    maxRetries: DEFAULT_GENERATION_MAX_RETRIES,
  };
}
