import "server-only";

export { generateCandidates } from "@/features/portfolio-ai/retrieval/candidate-generator";
export { detectEntities } from "@/features/portfolio-ai/retrieval/detect-entities";
export { detectIntent } from "@/features/portfolio-ai/retrieval/detect-intent";
export {
  explainMatchedEntity,
  explainRetrieval,
} from "@/features/portfolio-ai/retrieval/explain-retrieval";
export { normalizeQuery } from "@/features/portfolio-ai/retrieval/normalize-query";
export { rankCandidates } from "@/features/portfolio-ai/retrieval/rank-candidates";
export { retrievePortfolioKnowledge } from "@/features/portfolio-ai/retrieval/retrieve";
export type {
  DetectedEntity,
  EntityMatchType,
  IntentDetection,
  NormalizedQuery,
  PortfolioRetrievalResult,
  RetrievalCandidate,
  RetrievalIntent,
  RetrievalLocale,
  RetrievalOptions,
  RetrievalResultGroup,
} from "@/features/portfolio-ai/retrieval/retrieval.types";
export {
  DEFAULT_RETRIEVAL_TOP_K,
  MAX_RETRIEVAL_TOP_K,
  RETRIEVAL_MAX_QUERY_LENGTH,
} from "@/features/portfolio-ai/retrieval/retrieval.types";
