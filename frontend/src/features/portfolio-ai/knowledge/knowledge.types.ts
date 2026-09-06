import type { Project } from "@/features/projects/domain/project.types";
import type { LocaleCode } from "@/types/portfolio";

export type KnowledgeVerificationStatus =
  | "verified"
  | "derived"
  | "ambiguous"
  | "not-documented";

export type KnowledgeEntityType =
  | "person"
  | "education"
  | "experience"
  | "project"
  | "technology"
  | "skill"
  | "domain"
  | "organization";

export type KnowledgeSourceType =
  | "portfolio"
  | "journey"
  | "education"
  | "project"
  | "verification-override";

export type KnowledgeEvidenceStrength =
  | "primary"
  | "supporting"
  | "retrieval-only";

export type KnowledgeLocaleContent = Partial<
  Record<
    LocaleCode,
    {
      title?: string;
      description?: string;
      summary?: string;
    }
  >
>;

export type KnowledgeSourceRef = {
  id: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  field?: string;
};

export type KnowledgeEvidence = {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  field?: string;
  strength: KnowledgeEvidenceStrength;
};

export type KnowledgeEntity = {
  id: string;
  type: KnowledgeEntityType;
  canonicalName: string;
  aliases: string[];
  localeContent?: KnowledgeLocaleContent;
  sourceRefs: KnowledgeSourceRef[];
  metadata?: Record<string, unknown>;
};

export type KnowledgeFact = {
  id: string;
  subjectId: string;
  predicate: string;
  value: unknown;
  status: KnowledgeVerificationStatus;
  evidence: KnowledgeEvidence[];
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type KnowledgeRelationType =
  | "person-education"
  | "person-experience"
  | "person-project"
  | "experience-organization"
  | "experience-technology"
  | "project-technology"
  | "project-domain"
  | "project-category"
  | "technology-evidence"
  | "experience-project";

export type KnowledgeRelation = {
  id: string;
  type: KnowledgeRelationType;
  fromEntityId: string;
  toEntityId: string;
  predicate: string;
  status: KnowledgeVerificationStatus;
  evidence: KnowledgeEvidence[];
  metadata?: Record<string, unknown>;
};

export type EducationStatus = "in_progress" | "completed";

export type NormalizedSourceBundle = {
  projects: readonly Project[];
};

export type TechnologyEvidenceItem = {
  entityId: string;
  entityType: Extract<KnowledgeEntityType, "project" | "experience">;
  canonicalName: string;
  status: KnowledgeVerificationStatus;
  evidence: KnowledgeEvidence[];
  factId: string;
};

export type TechnologyEvidenceResult = {
  technologyId: string;
  canonicalName: string;
  status: KnowledgeVerificationStatus;
  evidence: TechnologyEvidenceItem[];
};

export type KnowledgeBase = {
  entities: KnowledgeEntity[];
  facts: KnowledgeFact[];
  relations: KnowledgeRelation[];
  aliases: Record<string, string[]>;
  sourceRefs: KnowledgeSourceRef[];
  skillsIndex: Record<string, TechnologyEvidenceItem[]>;
};

export type KnowledgeValidationIssue = {
  code: string;
  message: string;
};

export type KnowledgeValidationResult = {
  ok: boolean;
  issues: KnowledgeValidationIssue[];
};
