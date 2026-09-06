import "server-only";

export const DEFAULT_PORTFOLIO_AI_MODEL = "gemini-2.5-flash";
export const DEFAULT_GENERATION_TIMEOUT_MS = 12_000;
export const DEFAULT_GENERATION_MAX_OUTPUT_TOKENS = 512;
export const DEFAULT_GENERATION_TEMPERATURE = 0.2;
export const DEFAULT_GENERATION_TOP_P = 0.9;
export const DEFAULT_GENERATION_MAX_RETRIES = 1;
export const MAX_GENERATED_ANSWER_LENGTH = 1_800;

export type PortfolioAIGenerationConfig = {
  provider: "gemini";
  apiKey?: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
  temperature: number;
  topP: number;
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
    temperature: DEFAULT_GENERATION_TEMPERATURE,
    topP: DEFAULT_GENERATION_TOP_P,
    maxRetries: DEFAULT_GENERATION_MAX_RETRIES,
  };
}
