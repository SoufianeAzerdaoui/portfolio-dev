import type {
  EducationStatus,
  KnowledgeEvidence,
  KnowledgeVerificationStatus,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

export type CanonicalEducationOverride = {
  id: string;
  sourceIndex: number;
  period: string;
  programme: string;
  institution: string;
  location: string;
  status: EducationStatus;
  verification: Extract<KnowledgeVerificationStatus, "verified">;
};

export const canonicalEducationOverrides = [
  {
    id: "education-isima-siad-2026",
    sourceIndex: 0,
    period: "2026-2027",
    programme: "Master 2 en systèmes d’information et aide à la décision",
    institution: "ISIMA, Université Clermont Auvergne",
    location: "Clermont-Ferrand, France",
    status: "in_progress",
    verification: "verified",
  },
  {
    id: "education-esisa-ai-2024",
    sourceIndex: 1,
    period: "2024-2026",
    programme: "Master en systèmes d’information et intelligence artificielle",
    institution: "ESISA",
    location: "Fès, Maroc",
    status: "completed",
    verification: "verified",
  },
  {
    id: "education-est-big-data-2023",
    sourceIndex: 2,
    period: "2023-2024",
    programme:
      "Licence professionnelle en infrastructures, traitement et analyse de données massives",
    institution: "École Supérieure de Technologie",
    location: "Fkih Ben Salah, Maroc",
    status: "completed",
    verification: "verified",
  },
  {
    id: "education-ofppt-fullstack-2021",
    sourceIndex: 3,
    period: "2021-2023",
    programme:
      "Diplôme de technicien spécialisé en développement informatique, option Full Stack",
    institution: "OFPPT",
    location: "Fès, Maroc",
    status: "completed",
    verification: "verified",
  },
] as const satisfies readonly CanonicalEducationOverride[];

export const atlineVerifiedTechnologyNames = [
  "Angular",
  "PHP",
  "MySQL",
  "Git/Bitbucket",
  "Jira",
  "Scrum",
] as const;

export const atlineExperienceIds = [
  "atline-stage-2025",
  "atline-alternance-2025",
] as const;

export const businessIntelligenceExperienceOverride = {
  experienceId: "pfe-business-intelligence-2024",
  organization: "SEND SPACE",
  domain: "Business Intelligence",
  technologies: [
    "SQL Server",
    "Python",
    "Pandas",
    "NumPy",
    "Power BI",
    "DAX",
    "ETL",
  ],
  status: "verified",
} as const;

export const experienceProjectOverrides = [
  {
    experienceId: "chu-mohammed-vi-pfe-2026",
    projectId: "medical-rag-platform",
    status: "verified",
    sourceId: "medical-rag-confirmations",
  },
] as const;

export const projectTechnologyStatusOverrides: Record<
  string,
  Record<string, KnowledgeVerificationStatus>
> = {
  "medical-rag-platform": {
    Python: "verified",
    FastAPI: "verified",
    Qdrant: "verified",
    "Llama 3.2": "verified",
    "Next.js": "verified",
    SQLite: "verified",
    Ollama: "verified",
    "GitHub Actions": "verified",
    DigitalOcean: "verified",
    "BAAI/bge-m3": "verified",
    "intfloat/multilingual-e5-base": "verified",
    "Hybrid Retrieval": "verified",
    "multimodal RAG": "verified",
  },
  "syndismart-ai": {
    FAISS: "verified",
    Chroma: "ambiguous",
  },
  "callcenter-frustration-ai": {
    BERT: "verified",
    T5: "verified",
    BART: "verified",
    TensorFlow: "verified",
    Streamlit: "verified",
    CamemBERT: "ambiguous",
    PyTorch: "ambiguous",
    FastAPI: "ambiguous",
  },
};

export const callCenterUserConfirmedPurpose = [
  {
    technology: "T5",
    purpose: "analyse de sentiment",
  },
  {
    technology: "BART",
    purpose: "analyse de sentiment",
  },
] as const;

export const medicalRagVerifiedCapabilities = [
  "extraction de rapports PDF multimodaux",
  "extraction texte",
  "extraction de tableaux",
  "extraction d'images",
  "extraction de graphiques",
  "structuration résultats/unités/valeurs de référence",
  "embeddings BAAI/bge-m3",
  "fallback intfloat/multilingual-e5-base",
  "indexation Qdrant",
  "Hybrid Retrieval",
  "Llama 3.2",
  "réponses contextualisées",
  "réponses associées à leurs sources",
  "travail en binôme",
  "durée 4 mois",
] as const;

export function overrideEvidence(sourceId: string): KnowledgeEvidence {
  return {
    sourceType: "verification-override",
    sourceId,
    strength: "primary",
  };
}
