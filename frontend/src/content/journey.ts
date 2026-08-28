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
    period: "OCT. 2025 — JUILL. 2026",
    startDateTime: "2025-10",
    endDateTime: "2026-07",
    experienceType: "apprenticeship",
    role: "Développeur Full Stack",
    organization: "ATLINE SERVICES",
    description:
      "Participation au développement de la plateforme ms.fr 3.0.",
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
    role: "Stage PFE — Data & IA",
    organization: "CHU Mohammed VI",
    context: "PFE — Master 2 IS2IA · ESISA",
    description:
      "Conception d’une plateforme RAG pour l’exploitation de rapports médicaux : segmentation, indexation vectorielle, recherche sémantique et génération de réponses contextualisées.",
    technologies: [],
  },
  {
    id: "atline-stage-2025",
    period: "JUIN — SEPT. 2025",
    startDateTime: "2025-06",
    endDateTime: "2025-09",
    experienceType: "internship",
    role: "Développeur Full Stack",
    organization: "ATLINE SERVICES",
    description:
      "Développement Full Stack sur la plateforme ms.fr 3.0.",
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
    period: "AVRIL — JUIN 2024",
    startDateTime: "2024-04",
    endDateTime: "2024-06",
    role: "Stage de fin d’études",
    organization: "Business Intelligence",
    description:
      "Mise en place d’une solution décisionnelle pour le suivi et l’évaluation des processus de vente de smartphones.",
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
    period: "MARS — AVRIL 2023",
    startDateTime: "2023-03",
    endDateTime: "2023-04",
    role: "Développement Full Stack",
    organization: "EPG",
    description:
      "Développement de la page d’inscription de l’école EPG en Full Stack.",
    technologies: ["React", "PHP", "MySQL", "UML"],
  },
  ],
  en: [
    {
      id: "atline-alternance-2025",
      period: "OCT. 2025 - JUL. 2026",
      startDateTime: "2025-10",
      endDateTime: "2026-07",
      experienceType: "apprenticeship",
      role: "Full Stack Developer",
      organization: "ATLINE SERVICES",
      description:
        "Contributing to the development of the ms.fr 3.0 platform.",
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
      context: "Final-Year Project — Master 2 IS2IA · ESISA",
      description:
        "Design and development of a RAG platform for medical report processing, including segmentation, vector indexing, semantic search and contextualized answer generation.",
      technologies: [],
    },
    {
      id: "atline-stage-2025",
      period: "JUN. - SEPT. 2025",
      startDateTime: "2025-06",
      endDateTime: "2025-09",
      experienceType: "internship",
      role: "Full Stack Developer",
      organization: "ATLINE SERVICES",
      description:
        "Full Stack development on the ms.fr 3.0 platform.",
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
      period: "APR. - JUN. 2024",
      startDateTime: "2024-04",
      endDateTime: "2024-06",
      role: "Final-year internship",
      organization: "Business Intelligence",
      description:
        "Built a decision-support solution to monitor and evaluate smartphone sales processes.",
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
      period: "MAR. - APR. 2023",
      startDateTime: "2023-03",
      endDateTime: "2023-04",
      role: "Full Stack Development",
      organization: "EPG",
      description:
        "Developed the EPG school registration page as a Full Stack project.",
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
