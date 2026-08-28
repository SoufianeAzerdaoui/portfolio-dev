import type { LocaleCode } from "@/types/portfolio";

export type EducationItem = {
  period: string;
  title: string;
  institution: string;
  location: string;
  metadataLayout: "stacked" | "inline";
};

export type EducationLabels = {
  title: string;
};

export type EducationContent = {
  items: EducationItem[];
  labels: EducationLabels;
};

export const educationContentByLocale = {
  fr: {
    items: [
      {
        period: "2026 — 2027",
        title: "Master 2 en systèmes d’information et aide à la décision",
        institution: "ISIMA, Université Clermont Auvergne",
        location: "Clermont-Ferrand, France",
        metadataLayout: "stacked",
      },
      {
        period: "2024 — 2026",
        title:
          "Master en systèmes d’information et intelligence artificielle",
        institution: "ESISA",
        location: "Fès, Maroc",
        metadataLayout: "inline",
      },
      {
        period: "2023 — 2024",
        title:
          "Licence professionnelle en infrastructures, traitement et analyse de données massives",
        institution: "École Supérieure de Technologie",
        location: "Fkih Ben Salah, Maroc",
        metadataLayout: "stacked",
      },
      {
        period: "2021 — 2023",
        title:
          "Diplôme de technicien spécialisé en développement informatique, option Full Stack",
        institution: "OFPPT",
        location: "Fès, Maroc",
        metadataLayout: "inline",
      },
    ],
    labels: {
      title: "Formation académique",
    },
  },
  en: {
    items: [
      {
        period: "2026 — 2027",
        title: "Master 2 in Information Systems and Decision Support",
        institution: "ISIMA, Universite Clermont Auvergne",
        location: "Clermont-Ferrand, France",
        metadataLayout: "stacked",
      },
      {
        period: "2024 — 2026",
        title:
          "Master in Information Systems Engineering and Artificial Intelligence",
        institution: "ESISA",
        location: "Fez, Morocco",
        metadataLayout: "inline",
      },
      {
        period: "2023 — 2024",
        title:
          "Professional Bachelor's Degree in Big Data Infrastructure, Processing and Analysis",
        institution: "Higher School of Technology",
        location: "Fkih Ben Salah, Morocco",
        metadataLayout: "stacked",
      },
      {
        period: "2021 — 2023",
        title:
          "Specialized Technician Diploma in Software Development, Full Stack option",
        institution: "OFPPT",
        location: "Fez, Morocco",
        metadataLayout: "inline",
      },
    ],
    labels: {
      title: "Academic education",
    },
  },
} satisfies Record<LocaleCode, EducationContent>;
