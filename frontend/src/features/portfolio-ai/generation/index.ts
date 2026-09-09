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
  DEFAULT_FREELLMAPI_BASE_URL,
  DEFAULT_FREELLMAPI_MODEL,
  DEFAULT_GENERATION_MAX_OUTPUT_TOKENS,
  DEFAULT_GENERATION_MAX_RETRIES,
  DEFAULT_PORTFOLIO_AI_MODEL,
  MAX_GENERATED_ANSWER_LENGTH,
  PORTFOLIO_AI_PRIMARY_TIMEOUT_MS,
  PORTFOLIO_AI_PROVIDER_TIMEOUT_MS,
  assertFreeLLMAPIConfig,
  assertPortfolioAIGeminiConfig,
  assertPortfolioAIGenerationEnvironment,
  getFreeLLMAPIGenerationConfig,
  getPortfolioAIGenerationConfig,
  validatePortfolioAIGenerationEnvironment,
} from "@/features/portfolio-ai/generation/generation.config";
export {
  GenerationConfigurationError,
  GenerationGroundingError,
  GenerationInvalidOutputError,
  GenerationProviderError,
  GenerationRateLimitError,
  GenerationTimeoutError,
  markGenerationErrorAsNonRetryable,
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
  getDefaultGeminiPortfolioAIProvider,
} from "@/features/portfolio-ai/generation/gemini-provider";
export {
  FreeLLMAPIPortfolioAIProvider,
} from "@/features/portfolio-ai/generation/freellmapi-provider";
export {
  ResilientPortfolioAIProvider,
  createDefaultResilientPortfolioAIProvider,
  getDefaultPortfolioAIProvider,
  isFallbackEligibleGenerationError,
} from "@/features/portfolio-ai/generation/resilient-provider";
export { generatePortfolioAnswer } from "@/features/portfolio-ai/generation/generate-answer";
export { validateGroundedAnswer } from "@/features/portfolio-ai/generation/validate-grounding";
export {
  buildVerifiedTechnologyFastPathAnswer,
} from "@/features/portfolio-ai/generation/verified-technology-fast-path";
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
