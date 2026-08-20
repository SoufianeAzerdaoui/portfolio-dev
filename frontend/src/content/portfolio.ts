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
    { id: "home", href: "#home", label: "Accueil" },
    { id: "about", href: "#about", label: "À propos" },
    { id: "journey", href: "#journey", label: "Parcours" },
    { id: "projects", href: "#projects", label: "Projets" },
    { id: "ai-lab", href: "#ai-lab", label: "AI Lab" },
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
  about: {
    id: "about",
    eyebrow: "Profil",
    title: "À propos",
    paragraphs: [
      [
        { text: "Je suis " },
        { text: "Soufiane Azerdaoui", tone: "strong" },
        { text: ", étudiant en " },
        { text: "Master 2 SIAD", tone: "strong" },
        {
          text: " à l'ISIMA – Université Clermont Auvergne.",
        },
      ],
      [
        {
          text: "Je conçois des systèmes intelligents qui transforment les ",
        },
        { text: "données complexes", tone: "accent" },
        {
          text: " en décisions utiles et impactantes.",
        },
      ],
      [
        { text: "Mon intérêt principal porte sur la " },
        { text: "Data Science", tone: "strong" },
        { text: ", le " },
        { text: "Machine Learning", tone: "strong" },
        { text: ", le " },
        { text: "Deep Learning", tone: "strong" },
        { text: " et le " },
        { text: "NLP", tone: "strong" },
        {
          text: ". J'aime relever des défis techniques et construire des solutions robustes, scalables et centrées sur l’utilisateur.",
        },
      ],
    ],
    stats: [
      { value: "2+", label: "Ans d'expérience" },
      { value: "10+", label: "Projets Data/IA" },
      { value: "M2", label: "SIAD • ISIMA" },
    ],
    highlights: ["Data Science", "Machine Learning", "Deep Learning", "NLP"],
    image: {
      src: "/assets/profile_pic.png",
      alt: "Portrait de Soufiane Azerdaoui",
    },
    signature: "Soufiane Azerdaoui",
    cta: {
      href: "#journey",
      label: "Mon parcours",
    },
  },
  sections: [
    {
      id: "projects",
      title: "Projets",
      description:
        "Une sélection courte de projets Data, IA et engineering. La page complète permet d'explorer toute la collection publiée.",
    },
    {
      id: "ai-lab",
      title: "AI Lab",
      description:
        "Section structurelle prête pour les expérimentations, prototypes et démonstrations liées à l'IA.",
    },
    {
      id: "skills",
      title: "Compétences",
      description:
        "Section structurelle prête pour organiser les compétences techniques, outils et méthodes.",
    },
    {
      id: "journey",
      title: "Parcours",
      description:
        "Section structurelle prête pour détailler les expériences, formations et étapes clés.",
    },
    {
      id: "contact",
      title: "Contact",
      description:
        "Section structurelle prête pour les informations de contact et les prochains échanges.",
    },
  ],
  hero: {
    eyebrow: "AI & Data Engineering Portfolio",
    title: "",
    description:
      "Etudiant en Master 2 SIAD a l'ISIMA - Universite Clermont Auvergne. Passionne par la Data Science, le Machine Learning et le NLP.",
    availability:
      "Recherche d'un stage PFE de Master 2 en France - a partir de Mars 2026",
  },
  ctas: {
    primary: {
      href: "#projects",
      label: "Explorer mes projets",
    },
    secondary: {
      href: "#ai-lab",
      label: "Interroger mon portfolio avec l'IA",
    },
  },
};
