import type { PortfolioRetrievalResult } from "@/features/portfolio-ai/retrieval";
import type { ProjectAttribute } from "@/features/portfolio-ai/retrieval";
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

export type GroundedTechnologyExplanationFocus = {
  type: "project_technology_explanation" | "technology_explanation";
  project?: {
    id: string;
    name: string;
  };
  technology?: {
    id: string;
    name: string;
  };
  explanationKind: "role" | "purpose" | "selection_rationale";
  documentedRoleFactIds: string[];
  selectionRationaleStatus: "documented" | "not-documented";
};

export type GroundedProjectAttributeFocus = {
  type: "project_attribute";
  attribute: ProjectAttribute;
  project?: {
    id: string;
    name: string;
  };
  factIds: string[];
};

export type GroundedContext = {
  intent: string;
  requestedProjectAttribute?: ProjectAttribute;
  status: string;
  notDocumented: boolean;
  focus?: GroundedTechnologyExplanationFocus;
  projectAttributeFocus?: GroundedProjectAttributeFocus;
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
  requestId?: string;
  question: string;
  locale: LocaleCode;
  model: string;
  groundedContext: GroundedContext;
  allowedEvidenceIds: string[];
  systemPrompt: string;
  userPrompt: string;
  signal?: AbortSignal;
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
  signal?: AbortSignal;
  requestId?: string;
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
    fastPathUsed?: boolean;
    validationMs?: number;
    usage?: ProviderUsageMetadata;
  };
};
