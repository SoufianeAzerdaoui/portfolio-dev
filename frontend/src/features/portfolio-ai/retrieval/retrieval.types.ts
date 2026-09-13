import type {
  KnowledgeEntity,
  KnowledgeEvidence,
  KnowledgeFact,
  KnowledgeRelation,
  KnowledgeVerificationStatus,
} from "@/features/portfolio-ai/knowledge";
import type { LocaleCode } from "@/types/portfolio";

export const RETRIEVAL_MAX_QUERY_LENGTH = 280;
export const DEFAULT_RETRIEVAL_TOP_K = 5;
export const MAX_RETRIEVAL_TOP_K = 20;

export type RetrievalIntent =
  | "technology_evidence"
  | "technology_explanation"
  | "candidate_fit"
  | "technical_skills_overview"
  | "skills_by_category"
  | "skill_lookup"
  | "language_overview"
  | "language_lookup"
  | "projects_by_technology"
  | "projects_by_domain"
  | "project_technology_lookup"
  | "project_technology_explanation"
  | "experience_lookup"
  | "education_lookup"
  | "project_lookup"
  | "skills_overview"
  | "profile_lookup"
  | "comparison"
  | "unknown";

export type RetrievalLocale = LocaleCode;

export type ProjectAttribute =
  | "overview"
  | "objective"
  | "problem"
  | "approach"
  | "architecture"
  | "technologies"
  | "results"
  | "role"
  | "metadata";

export type ProfileSkillCategory =
  | "data-engineering"
  | "ai-nlp-genai"
  | "databases-bi"
  | "programming-languages"
  | "cloud-devops"
  | "web-development"
  | "design-methods";

export type LanguageQueryKind = "overview" | "level" | "speaks" | "native";

export type CandidateFitFocus =
  | "data-ai"
  | "data-engineering"
  | "ai-engineering"
  | "technical-strengths"
  | "comparison";

export type RetrievalOptions = {
  locale?: RetrievalLocale;
  topK?: number;
  includeDebug?: boolean;
};

export type NormalizedQuery = {
  original: string;
  normalized: string;
  tokens: string[];
  locale: RetrievalLocale;
};

export type IntentDetection = {
  intent: RetrievalIntent;
  confidence: number;
  reasons: string[];
  requestedProjectAttribute?: ProjectAttribute;
  skillCategory?: ProfileSkillCategory;
  normalizedSkillId?: string;
  languageId?: string;
  languageQueryKind?: LanguageQueryKind;
  candidateFitFocus?: CandidateFitFocus;
};

export type EntityMatchType =
  | "exact-canonical"
  | "exact-alias"
  | "normalized-canonical"
  | "normalized-alias"
  | "strong-token"
  | "retrieval-only"
  | "derived-category-domain";

export type DetectedEntity = {
  entity: KnowledgeEntity;
  matchType: EntityMatchType;
  matchedAlias: string;
  score: number;
  reasons: string[];
};

export type RetrievalCandidate = {
  entity: KnowledgeEntity;
  score: number;
  facts: KnowledgeFact[];
  relations: KnowledgeRelation[];
  evidence: KnowledgeEvidence[];
  status: KnowledgeVerificationStatus;
  reasons: string[];
  matchedEntities: DetectedEntity[];
};

export type RetrievalResultGroup = {
  entity: KnowledgeEntity;
  score: number;
  status: KnowledgeVerificationStatus;
  facts: KnowledgeFact[];
  relations: KnowledgeRelation[];
  evidence: KnowledgeEvidence[];
  whyMatched: string[];
  matchedEntities: Array<{
    entityId: string;
    canonicalName: string;
    matchType: EntityMatchType;
    matchedAlias: string;
    score: number;
  }>;
};

export type PortfolioRetrievalResult = {
  intent: RetrievalIntent;
  requestedProjectAttribute?: ProjectAttribute;
  skillCategory?: ProfileSkillCategory;
  normalizedSkillId?: string;
  languageId?: string;
  languageQueryKind?: LanguageQueryKind;
  candidateFitFocus?: CandidateFitFocus;
  normalizedQuery: string;
  originalQuery: string;
  matchedEntities: DetectedEntity[];
  results: RetrievalResultGroup[];
  confidence: number;
  status: KnowledgeVerificationStatus;
  notDocumented: boolean;
  errors: string[];
};
