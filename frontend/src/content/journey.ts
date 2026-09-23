import type { LocaleCode } from "@/types/portfolio";

export type JourneyExperienceType =
  | "apprenticeship"
  | "internship"
  | "final-year-internship";

export const journeyExperienceTypeLabelsByLocale = {
  fr: {
    apprenticeship: "Alternance",
    internship: "Stage",
    "final-year-internship": "Stage PFE",
  },
  en: {
    apprenticeship: "Apprenticeship",
    internship: "Internship",
    "final-year-internship": "Final-Year Internship",
  },
} satisfies Record<LocaleCode, Record<JourneyExperienceType, string>>;

export type JourneyExperience = {
  id: string;
  period: string;
  startDateTime: string;
  endDateTime?: string;
  experienceType?: JourneyExperienceType;
  role: string;
  organization?: string;
  context?: string;
  description: string;
  projectLink?: {
    href: string;
    label: string;
  };
  technologies?: string[];
  displayTechnologies?: string[];
  isCurrent?: boolean;
};

export type JourneySectionLabels = {
  title: string;
  technologies: string;
  currentExperience: string;
  externalProjectSuffix: string;
};

export type JourneyContent = {
  experiences: JourneyExperience[];
  typeLabels: Record<JourneyExperienceType, string>;
  labels: JourneySectionLabels;
};

export const journeyExperiencesByLocale = {
  fr: [
  {
    id: "atline-alternance-2025",
    period: "OCT. 2025 — JUIL. 2026",
    startDateTime: "2025-10",
    endDateTime: "2026-07",
    experienceType: "apprenticeship",
    role: "Développeur Full Stack",
    organization: "ATLINE SERVICES",
    description:
      "Développement et maintenance de la plateforme ms.fr 3.0, avec évolution des fonctionnalités et participation au cycle de développement en environnement Agile.",
    technologies: [
      "Angular",
      "PHP",
      "MySQL",
      "Git/Bitbucket",
      "Jira",
      "Scrum",
    ],
    projectLink: {
      href: "https://v3.marches-securises.fr/",
      label: "Voir ms.fr 3.0",
    },
    isCurrent: false,
  },
  {
    id: "chu-mohammed-vi-pfe-2026",
    period: "FÉVR. 2026 — JUIN 2026",
    startDateTime: "2026-02",
    endDateTime: "2026-06",
    experienceType: "final-year-internship",
    role: "Data & IA Engineer",
    organization: "CHU Mohammed VI",
    context: "PFE — MASTER IS2IA · ESISA",
    description:
      "Conception d’une plateforme RAG multimodale pour l’exploitation de rapports médicaux : extraction, structuration, indexation vectorielle, recherche sémantique et génération de réponses contextualisées.",
    technologies: [],
    displayTechnologies: ["Python", "FastAPI", "Qdrant", "Llama", "Next.js"],
  },
  {
    id: "atline-stage-2025",
    period: "JUIN 2025 — SEPT. 2025",
    startDateTime: "2025-06",
    endDateTime: "2025-09",
    experienceType: "internship",
    role: "Développeur Full Stack",
    organization: "ATLINE SERVICES",
    description:
      "Développement de fonctionnalités Full Stack pour la plateforme ms.fr 3.0 dans un environnement Agile/Scrum.",
    projectLink: {
      href: "https://v3.marches-securises.fr/",
      label: "Voir ms.fr 3.0",
    },
    technologies: [
      "Angular",
      "PHP",
      "MySQL",
      "Git/Bitbucket",
      "Scrum",
      "Jira",
    ],
  },
  {
    id: "pfe-business-intelligence-2024",
    period: "AVR. 2024 — JUIN 2024",
    startDateTime: "2024-04",
    endDateTime: "2024-06",
    experienceType: "final-year-internship",
    role: "Développeur de Business Intelligence",
    organization: "SEND SPACE",
    description:
      "Conception d’une solution décisionnelle pour le suivi et l’analyse des ventes de smartphones, de l’ETL jusqu’aux tableaux de bord Power BI.",
    technologies: [
      "SQL Server",
      "Python",
      "Pandas",
      "NumPy",
      "Power BI",
      "DAX",
      "ETL",
    ],
  },
  {
    id: "epg-stage-2023",
    period: "MARS 2023 — AVR. 2023",
    experienceType: "final-year-internship",
    startDateTime: "2023-03",
    endDateTime: "2023-04",
    role: "Développement Full Stack",
    organization: "EPG",
    context: "Projet de fin d’études — Master IS2IA · ESISA",
    description:
      "Conception et développement d’une interface d’inscription Full Stack pour l’école EPG, destinée à simplifier le processus d’inscription des étudiants, de la saisie des informations jusqu’à leur traitement et leur enregistrement .",
    technologies: ["React", "PHP", "MySQL", "UML"],
  },
  ],
  en: [
    {
      id: "atline-alternance-2025",
      period: "OCT. 2025 — JUL. 2026",
      startDateTime: "2025-10",
      endDateTime: "2026-07",
      experienceType: "apprenticeship",
      role: "Full Stack Developer",
      organization: "ATLINE SERVICES",
      description:
        "Development and maintenance of the ms.fr 3.0 platform, including feature evolution and participation in an Agile development workflow.",
      technologies: [
        "Angular",
        "PHP",
        "MySQL",
        "Git/Bitbucket",
        "Jira",
        "Scrum",
      ],
      projectLink: {
        href: "https://v3.marches-securises.fr/",
        label: "View ms.fr 3.0",
      },
      isCurrent: false,
    },
    {
      id: "chu-mohammed-vi-pfe-2026",
      period: "FEB. 2026 — JUN. 2026",
      startDateTime: "2026-02",
      endDateTime: "2026-06",
      experienceType: "final-year-internship",
      role: "Final-Year Internship — Data & AI",
      organization: "CHU Mohammed VI",
      context: "Final-Year Project — Master IS2IA · ESISA",
      description:
        "Design of a multimodal RAG platform for medical reports, covering extraction, structuring, vector indexing, semantic retrieval and contextual answer generation.",
      technologies: [],
      displayTechnologies: ["Python", "FastAPI", "Qdrant", "Llama", "Next.js"],
    },
    {
      id: "atline-stage-2025",
      period: "JUN. 2025 — SEPT. 2025",
      startDateTime: "2025-06",
      endDateTime: "2025-09",
      experienceType: "internship",
      role: "Full Stack Developer",
      organization: "ATLINE SERVICES",
      description:
        "Development of Full Stack features for the ms.fr 3.0 platform in an Agile/Scrum environment.",
      projectLink: {
        href: "https://v3.marches-securises.fr/",
        label: "View ms.fr 3.0",
      },
      technologies: [
        "Angular",
        "PHP",
        "MySQL",
        "Git/Bitbucket",
        "Scrum",
        "Jira",
      ],
    },
    {
      id: "pfe-business-intelligence-2024",
      period: "APR. 2024 — JUN. 2024",
      startDateTime: "2024-04",
      endDateTime: "2024-06",
      role: "Final-Year Internship — Business Intelligence",
      organization: "SEND SPACE",
      description:
        "Design of a Business Intelligence solution for smartphone sales monitoring and analysis, from ETL processing to Power BI dashboards.",
      technologies: [
        "SQL Server",
        "Python",
        "Pandas",
        "NumPy",
        "Power BI",
        "DAX",
        "ETL",
      ],
    },
    {
      id: "epg-stage-2023",
      period: "MAR. 2023 — APR. 2023",
      startDateTime: "2023-03",
      endDateTime: "2023-04",
      role: "Full Stack Development",
      organization: "EPG",
      description:
        "Development of a Full Stack registration page for EPG.",
      technologies: ["React", "PHP", "MySQL", "UML"],
    },
  ],
} satisfies Record<LocaleCode, JourneyExperience[]>;

export const journeyContentByLocale = {
  fr: {
    experiences: journeyExperiencesByLocale.fr,
    typeLabels: journeyExperienceTypeLabelsByLocale.fr,
    labels: {
      title: "Parcours professionnel",
      technologies: "Compétences utilisées",
      currentExperience: "Expérience en cours",
      externalProjectSuffix: "ouvre un nouvel onglet",
    },
  },
  en: {
    experiences: journeyExperiencesByLocale.en,
    typeLabels: journeyExperienceTypeLabelsByLocale.en,
    labels: {
      title: "Professional journey",
      technologies: "Technologies used",
      currentExperience: "Current experience",
      externalProjectSuffix: "opens in a new tab",
    },
  },
} satisfies Record<LocaleCode, JourneyContent>;

export const journeyExperienceTypeLabels = journeyExperienceTypeLabelsByLocale.fr;
export const journeyExperiences = journeyExperiencesByLocale.fr;
