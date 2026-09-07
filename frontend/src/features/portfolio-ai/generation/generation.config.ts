import "server-only";

export const DEFAULT_PORTFOLIO_AI_MODEL = "gemini-2.5-flash";
export const DEFAULT_GENERATION_TIMEOUT_MS = 12_000;
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

export function getPortfolioAIGenerationConfig(
  env: Partial<Record<string, string | undefined>> = process.env,
): PortfolioAIGenerationConfig {
  return {
    provider: "gemini",
    apiKey: env.GEMINI_API_KEY,
    model: env.PORTFOLIO_AI_MODEL ?? DEFAULT_PORTFOLIO_AI_MODEL,
    timeoutMs: DEFAULT_GENERATION_TIMEOUT_MS,
    maxOutputTokens: DEFAULT_GENERATION_MAX_OUTPUT_TOKENS,
    maxRetries: DEFAULT_GENERATION_MAX_RETRIES,
  };
}
