import "server-only";

export {
  portfolioAnswerResponseSchema,
  parsePortfolioAnswer,
} from "@/features/portfolio-ai/generation/answer.schema";
export {
  buildGroundedContext,
  createEvidenceId,
  getAllowedEvidenceIds,
  measureGroundedContextSize,
} from "@/features/portfolio-ai/generation/build-grounded-context";
export {
  DEFAULT_GENERATION_MAX_OUTPUT_TOKENS,
  DEFAULT_GENERATION_MAX_RETRIES,
  DEFAULT_GENERATION_TIMEOUT_MS,
  DEFAULT_PORTFOLIO_AI_MODEL,
  MAX_GENERATED_ANSWER_LENGTH,
  getPortfolioAIGenerationConfig,
} from "@/features/portfolio-ai/generation/generation.config";
export {
  GenerationConfigurationError,
  GenerationGroundingError,
  GenerationInvalidOutputError,
  GenerationProviderError,
  GenerationRateLimitError,
  GenerationTimeoutError,
  normalizeGenerationError,
} from "@/features/portfolio-ai/generation/generation.errors";
export {
  PORTFOLIO_AI_SYSTEM_PROMPT,
  PORTFOLIO_AI_SYSTEM_PROMPT_VERSION,
  buildGenerationUserPrompt,
} from "@/features/portfolio-ai/generation/generation.prompt";
export {
  detectPortfolioAIResponseLanguage,
  isPortfolioAIGreeting,
} from "@/features/portfolio-ai/generation/response-language";
export {
  GeminiPortfolioAIProvider,
  getDefaultPortfolioAIProvider,
} from "@/features/portfolio-ai/generation/gemini-provider";
export { generatePortfolioAnswer } from "@/features/portfolio-ai/generation/generate-answer";
export { validateGroundedAnswer } from "@/features/portfolio-ai/generation/validate-grounding";
export type {
  AnswerUncertainty,
  ConversationContextMessage,
  GeneratePortfolioAnswerInput,
  GeneratePortfolioAnswerOptions,
  GroundedContext,
  GroundedEntity,
  GroundedEvidence,
  GroundedFact,
  GroundedGenerationInput,
  PortfolioAIProvider,
  PortfolioAnswer,
  PortfolioAnswerResult,
  ProviderGenerationResult,
  ProviderUsageMetadata,
} from "@/features/portfolio-ai/generation/generation.types";
