import type { PortfolioContent } from "@/types/portfolio";

export const portfolioContent: PortfolioContent = {
  identity: {
    name: "Soufiane Azerdaoui",
    role: "AI & Data Engineer",
  },
  languages: [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
  ],
  navigation: [
    { href: "#accueil", label: "Accueil" },
    { href: "#", label: "A propos", disabled: true },
    { href: "#", label: "Projets", disabled: true },
    { href: "#", label: "AI Lab", disabled: true },
    { href: "#", label: "Competences", disabled: true },
    { href: "#", label: "Parcours", disabled: true },
    { href: "#", label: "Contact", disabled: true },
  ],
  socialLinks: [
    {
      href: "#",
      label: "GitHub (URL a renseigner)",
      icon: "github",
      disabled: true,
    },
    {
      href: "#",
      label: "LinkedIn (URL a renseigner)",
      icon: "linkedin",
      disabled: true,
    },
    {
      href: "#",
      label: "Email (adresse a renseigner)",
      icon: "mail",
      disabled: true,
    },
  ],
  hero: {
    eyebrow: "AI & Data Engineering Portfolio",
    title: "Je transforme des donnees complexes en decisions intelligentes.",
    description:
      "Etudiant en Master 2 SIAD a l'ISIMA - Universite Clermont Auvergne. Passionne par la Data Science, le Machine Learning et le NLP.",
    availability:
      "Recherche d'un stage PFE de Master 2 en France - a partir de Mars 2026",
  },
  ctas: {
    primary: {
      href: "#",
      label: "Explorer mes projets",
    },
    secondary: {
      href: "#",
      label: "Interroger mon portfolio avec l'IA",
    },
  },
};
