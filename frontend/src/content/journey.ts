export type JourneyExperienceType = "apprenticeship" | "internship";

export const journeyExperienceTypeLabels = {
  apprenticeship: "Alternance",
  internship: "Stage",
} satisfies Record<JourneyExperienceType, string>;

export type JourneyExperience = {
  id: string;
  period: string;
  startDateTime: string;
  endDateTime?: string;
  experienceType?: JourneyExperienceType;
  role: string;
  organization?: string;
  description: string;
  projectLink?: {
    href: string;
    label: string;
  };
  technologies?: string[];
  isCurrent?: boolean;
};

export const journeyExperiences = [
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
] satisfies JourneyExperience[];
