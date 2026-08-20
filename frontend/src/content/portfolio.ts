import type { LocaleCode, PortfolioContent } from "@/types/portfolio";

export const portfolioContentByLocale = {
  fr: {
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
        href: "https://github.com/SoufianeAzerdaoui",
        label: "GitHub de Soufiane Azerdaoui",
        icon: "github",
        external: true,
      },
      {
        href: "https://ma.linkedin.com/in/soufiane-azerdaoui",
        label: "LinkedIn de Soufiane Azerdaoui",
        icon: "linkedin",
        external: true,
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
            text: " à l'ISIMA - Université Clermont Auvergne.",
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
            text: ". J'aime relever des défis techniques et construire des solutions robustes, scalables et centrées sur l'utilisateur.",
          },
        ],
      ],
      stats: [
        { value: "1+", label: "An d'expérience" },
        { value: "10+", label: "Projets Data/IA" },
        { value: "M2", label: "SIAD - ISIMA" },
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
        id: "journey",
        title: "Parcours",
        description:
          "Expériences professionnelles, stages et projets structurants.",
      },
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
          "Un espace préparé pour les expérimentations, prototypes et démonstrations liées à l'IA.",
      },
    ],
    hero: {
      eyebrow: "AI & Data Engineering Portfolio",
      title: "",
      description:
        "Étudiant en Master 2 SIAD à l'ISIMA - Université Clermont Auvergne. Passionné par la Data Science, le Machine Learning et le NLP.",
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
  },
  en: {
    identity: {
      name: "Soufiane Azerdaoui",
      role: "AI & Data Engineer",
    },
    languages: [
      { code: "fr", label: "FR" },
      { code: "en", label: "EN" },
    ],
    navigation: [
      { id: "home", href: "#home", label: "Home" },
      { id: "about", href: "#about", label: "About" },
      { id: "journey", href: "#journey", label: "Journey" },
      { id: "projects", href: "#projects", label: "Projects" },
      { id: "ai-lab", href: "#ai-lab", label: "AI Lab" },
    ],
    socialLinks: [
      {
        href: "https://github.com/SoufianeAzerdaoui",
        label: "Soufiane Azerdaoui on GitHub",
        icon: "github",
        external: true,
      },
      {
        href: "https://ma.linkedin.com/in/soufiane-azerdaoui",
        label: "Soufiane Azerdaoui on LinkedIn",
        icon: "linkedin",
        external: true,
      },
    ],
    about: {
      id: "about",
      eyebrow: "Profile",
      title: "About",
      paragraphs: [
        [
          { text: "I am " },
          { text: "Soufiane Azerdaoui", tone: "strong" },
          { text: ", a " },
          { text: "Master 2 SIAD", tone: "strong" },
          {
            text: " student at ISIMA - Universite Clermont Auvergne.",
          },
        ],
        [
          {
            text: "I design intelligent systems that turn ",
          },
          { text: "complex data", tone: "accent" },
          {
            text: " into useful and impactful decisions.",
          },
        ],
        [
          { text: "My main focus is " },
          { text: "Data Science", tone: "strong" },
          { text: ", " },
          { text: "Machine Learning", tone: "strong" },
          { text: ", " },
          { text: "Deep Learning", tone: "strong" },
          { text: " and " },
          { text: "NLP", tone: "strong" },
          {
            text: ". I enjoy solving technical challenges and building robust, scalable and user-centered solutions.",
          },
        ],
      ],
      stats: [
        { value: "1+", label: "Year of experience" },
        { value: "10+", label: "Data/AI projects" },
        { value: "M2", label: "SIAD - ISIMA" },
      ],
      highlights: ["Data Science", "Machine Learning", "Deep Learning", "NLP"],
      image: {
        src: "/assets/profile_pic.png",
        alt: "Portrait of Soufiane Azerdaoui",
      },
      signature: "Soufiane Azerdaoui",
      cta: {
        href: "#journey",
        label: "My journey",
      },
    },
    sections: [
      {
        id: "journey",
        title: "Journey",
        description:
          "Professional experience, internships and key project milestones.",
      },
      {
        id: "projects",
        title: "Projects",
        description:
          "A curated selection of Data, AI and engineering projects. The full page lets you explore the published collection.",
      },
      {
        id: "ai-lab",
        title: "AI Lab",
        description:
          "A space prepared for AI experiments, prototypes and demonstrations.",
      },
    ],
    hero: {
      eyebrow: "AI & Data Engineering Portfolio",
      title: "",
      description:
        "Master 2 SIAD student at ISIMA - Universite Clermont Auvergne. Passionate about Data Science, Machine Learning and NLP.",
    },
    ctas: {
      primary: {
        href: "#projects",
        label: "Explore my projects",
      },
      secondary: {
        href: "#ai-lab",
        label: "Ask my portfolio with AI",
      },
    },
  },
} satisfies Record<LocaleCode, PortfolioContent>;

export const portfolioContent = portfolioContentByLocale.fr;
