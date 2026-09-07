import type { PortfolioRetrievalResult } from "@/features/portfolio-ai/retrieval";
import type { LocaleCode } from "@/types/portfolio";

export type AnswerUncertainty = "none" | "ambiguous" | "not-documented";

export type PortfolioAnswer = {
  answer: string;
  usedEvidenceIds: string[];
  uncertainty: AnswerUncertainty;
  language: LocaleCode;
};

export type GeneratePortfolioAnswerInput = {
  question: string;
  locale: LocaleCode;
  retrieval: PortfolioRetrievalResult;
  conversationContext?: ConversationContextMessage[];
};

export type ConversationContextMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GroundedEvidence = {
  id: string;
  sourceType: string;
  sourceId: string;
  field?: string;
  strength: string;
};

export type GroundedFact = {
  id: string;
  predicate: string;
  value: unknown;
  status: string;
  evidenceIds: string[];
};

export type GroundedEntity = {
  id: string;
  type: string;
  name: string;
  score: number;
  status: string;
  facts: GroundedFact[];
  relatedEntityIds: string[];
  whyMatched: string[];
};

export type GroundedContext = {
  intent: string;
  status: string;
  notDocumented: boolean;
  entities: GroundedEntity[];
  evidence: GroundedEvidence[];
  policy: {
    verified: string;
    derived: string;
    ambiguous: string;
    notDocumented: string;
  };
};

export type GroundedGenerationInput = {
  question: string;
  locale: LocaleCode;
  model: string;
  groundedContext: GroundedContext;
  allowedEvidenceIds: string[];
  systemPrompt: string;
  userPrompt: string;
};

export type ProviderUsageMetadata = {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
};

export type ProviderGenerationResult = {
  output: unknown;
  rawText?: string;
  model: string;
  provider: string;
  latencyMs: number;
  usage?: ProviderUsageMetadata;
};

export interface PortfolioAIProvider {
  generate(input: GroundedGenerationInput): Promise<ProviderGenerationResult>;
}

export type GeneratePortfolioAnswerOptions = {
  provider?: PortfolioAIProvider;
  model?: string;
};

export type PortfolioAnswerResult = {
  answer: PortfolioAnswer;
  metadata: {
    provider: string;
    model: string;
    latencyMs: number;
    retrievedEntityCount: number;
    verifiedEvidenceCount: number;
    ambiguousEvidenceCount: number;
    usedEvidenceCount: number;
    providerCalled: boolean;
    retryCount: number;
    usage?: ProviderUsageMetadata;
  };
};
