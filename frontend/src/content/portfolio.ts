import {
  PORTFOLIO_SECTION_IDS,
  type LocaleCode,
  type PortfolioContent,
  type SectionId,
} from "@/types/portfolio";

const navigationLabelsByLocale: Record<LocaleCode, Record<SectionId, string>> = {
  fr: {
    home: "Accueil",
    about: "À propos",
    education: "Formation",
    journey: "Parcours",
    projects: "Projets",
    "ai-lab": "AI Lab",
  },
  en: {
    home: "Home",
    about: "About",
    education: "Education",
    journey: "Journey",
    projects: "Projects",
    "ai-lab": "AI Lab",
  },
};

function buildNavigation(locale: LocaleCode) {
  return PORTFOLIO_SECTION_IDS.map((sectionId) => ({
    id: sectionId,
    href: `#${sectionId}` as const,
    label: navigationLabelsByLocale[locale][sectionId],
  }));
}

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
    navigation: buildNavigation("fr"),
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
          { text: " à " },
          {
            text: "l’ISIMA – Université Clermont Auvergne",
            tone: "strong",
          },
          {
            text: ", avec un parcours orienté Data Engineering et Intelligence Artificielle.",
          },
        ],
        [
          { text: "Je conçois des solutions " },
          { text: "Data & IA", tone: "strong" },
          {
            text: " allant du traitement et de l’exploitation des données jusqu’au développement de systèmes de ",
          },
          { text: "Machine Learning", tone: "accent" },
          { text: ", " },
          { text: "Deep Learning", tone: "accent" },
          { text: ", " },
          { text: "NLP", tone: "accent" },
          {
            text: " et ",
          },
          { text: "RAG", tone: "accent" },
          {
            text: ".",
          },
        ],
        [
          { text: "Je m’intéresse particulièrement à la conception de " },
          { text: "pipelines de données", tone: "strong" },
          { text: ", aux modèles d’apprentissage automatique et aux systèmes d’IA capables de transformer des données complexes en informations exploitables" },
          { text: "." },
        ],
        [
          {
            text: "J’aime partir d’un besoin métier, comprendre les données disponibles, expérimenter différentes approches et construire une solution fiable, concrète et exploitable par l’utilisateur.",
          },
        ],
      ],
      stats: [
        { value: "1+", label: "An d’expérience" },
        { value: "10+", label: "Projets Data/IA" },
        { value: "M2", label: "SIAD · ISIMA" },
      ],
      highlights: ["Data Science", "Machine Learning", "Deep Learning", "NLP"],
      image: {
        src: "/assets/profile_pic.png",
        alt: "Portrait de Soufiane Azerdaoui",
      },
      profileLabel: "AI / DATA PROFILE",
      profileMeta: "M2 SIAD · ISIMA",
      signature: "Soufiane Azerdaoui",
      cta: {
        href: "#journey",
        label: "Mon parcours",
      },
    },
    sections: [
      {
        id: "education",
        title: "Formation",
        description:
          "Un parcours académique structuré en data, intelligence artificielle et aide à la décision.",
      },
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
        "Étudiant en Master 2 SIAD à l'ISIMA - Université Clermont Auvergne.",
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
    aiConsole: {
      ariaLabel: "Console Portfolio AI",
      mark: "PORTFOLIO_AI",
      close: "Fermer Portfolio AI",
      languageLabel: "FR",
      title: "INTERROGER LE PORTFOLIO",
      intro: "Interrogez mon portfolio.",
      subtitle: "Parcours, projets, compétences — posez votre question.",
      suggestions: [
        "Quels sont ses projets les plus pertinents en IA ?",
        "Quelle est son expérience avec le RAG ?",
        "Résume son parcours en 30 secondes.",
      ],
      userLabel: "VOUS /",
      assistantLabel: "PORTFOLIO_AI /",
      sourcesTitle: "SOURCES",
      inputPlaceholder: "Posez une question...",
      send: "Envoyer",
      minimize: "Réduire Portfolio AI",
      expand: "Agrandir Portfolio AI",
      restore: "Restaurer Portfolio AI",
      minimizedReady: "Conversation prête",
      minimizedActive: "Conversation en cours",
      answerAvailable: "Réponse disponible.",
      sourceProjectAction: "VOIR LE PROJET",
      retry: "Réessayer",
      processing: "Analyse du portfolio...",
      sourceTypeLabels: {
        project: "Projet",
        experience: "Expérience",
        education: "Formation",
        profile: "Profil",
        skill: "Compétence",
        default: "Source",
      },
      errorMessages: {
        INVALID_REQUEST: "La question envoyée n'est pas valide.",
        RATE_LIMITED:
          "Trop de requêtes pour le moment. Réessayez dans quelques instants.",
        AI_TEMPORARILY_UNAVAILABLE:
          "Le service IA est momentanément indisponible. Réessayez un peu plus tard.",
        AI_TIMEOUT:
          "La réponse prend plus de temps que prévu. Vous pouvez réessayer.",
        AI_UNAVAILABLE: "Portfolio AI est momentanément indisponible.",
        AI_RESPONSE_INVALID:
          "Je n'ai pas pu produire une réponse suffisamment fiable. Essayez de reformuler votre question.",
        AI_PROVIDER_ERROR:
          "Le service IA est momentanément indisponible. Réessayez un peu plus tard.",
        NETWORK_ERROR: "Impossible de contacter Portfolio AI pour le moment.",
        STREAM_PROTOCOL_ERROR:
          "Impossible de lire la réponse Portfolio AI pour le moment.",
      },
      retryAfterSuffix: "secondes",
      remainingCharacters: "caractères restants",
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
    navigation: buildNavigation("en"),
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
          { text: "I’m " },
          { text: "Soufiane Azerdaoui", tone: "strong" },
          { text: ", currently pursuing a " },
          {
            text: "Master 2 in Information Systems and Decision Support",
            tone: "strong",
          },
          { text: " at " },
          {
            text: "ISIMA – Université Clermont Auvergne",
            tone: "strong",
          },
          {
            text: ".",
          },
        ],
        [
          { text: "I design " },
          { text: "Data & AI", tone: "strong" },
          {
            text: " solutions that turn ",
          },
          { text: "complex data", tone: "accent" },
          {
            text: " into actionable insights and ",
          },
          { text: "decision-support tools", tone: "accent" },
          {
            text: ".",
          },
        ],
        [
          { text: "I’m particularly interested in " },
          { text: "Data Science", tone: "strong" },
          { text: ", " },
          { text: "Machine Learning", tone: "strong" },
          { text: ", " },
          { text: "Deep Learning", tone: "strong" },
          { text: " and " },
          { text: "NLP", tone: "strong" },
          { text: "." },
        ],
        [
          {
            text: "I enjoy starting from a real business need, understanding the available data, exploring different approaches and building a practical solution that users can actually rely on.",
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
      profileLabel: "AI / DATA PROFILE",
      profileMeta: "M2 SIAD · ISIMA",
      signature: "Soufiane Azerdaoui",
      cta: {
        href: "#journey",
        label: "My journey",
      },
    },
    sections: [
      {
        id: "education",
        title: "Education",
        description:
          "A focused academic path in data, artificial intelligence and decision support systems.",
      },
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
        "Master 2 SIAD student at ISIMA - Universite Clermont Auvergne. I design Data & AI solutions built to solve concrete problems.",
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
    aiConsole: {
      ariaLabel: "Portfolio AI console",
      mark: "PORTFOLIO_AI",
      close: "Close Portfolio AI",
      languageLabel: "EN",
      title: "ASK THE PORTFOLIO",
      intro: "Ask my portfolio.",
      subtitle: "Experience, projects, skills — ask your question.",
      suggestions: [
        "Which AI projects are most relevant?",
        "What is his experience with RAG?",
        "Summarize his profile in 30 seconds.",
      ],
      userLabel: "YOU /",
      assistantLabel: "PORTFOLIO_AI /",
      sourcesTitle: "SOURCES",
      inputPlaceholder: "Ask a question...",
      send: "Send",
      minimize: "Minimize Portfolio AI",
      expand: "Expand Portfolio AI",
      restore: "Restore Portfolio AI",
      minimizedReady: "Conversation ready",
      minimizedActive: "Conversation in progress",
      answerAvailable: "Answer available.",
      sourceProjectAction: "VIEW PROJECT",
      retry: "Retry",
      processing: "Analyzing the portfolio...",
      sourceTypeLabels: {
        project: "Project",
        experience: "Experience",
        education: "Education",
        profile: "Profile",
        skill: "Skill",
        default: "Source",
      },
      errorMessages: {
        INVALID_REQUEST: "The submitted question is not valid.",
        RATE_LIMITED: "Too many requests right now. Try again shortly.",
        AI_TEMPORARILY_UNAVAILABLE:
          "The AI service is temporarily unavailable. Try again later.",
        AI_TIMEOUT: "The response is taking longer than expected. You can retry.",
        AI_UNAVAILABLE: "Portfolio AI is temporarily unavailable.",
        AI_RESPONSE_INVALID:
          "I could not produce a reliable enough answer. Try rephrasing your question.",
        AI_PROVIDER_ERROR:
          "The AI service is temporarily unavailable. Try again later.",
        NETWORK_ERROR: "Unable to reach Portfolio AI right now.",
        STREAM_PROTOCOL_ERROR:
          "Unable to read the Portfolio AI response right now.",
      },
      retryAfterSuffix: "seconds",
      remainingCharacters: "characters remaining",
    },
  },
} satisfies Record<LocaleCode, PortfolioContent>;

export const portfolioContent = portfolioContentByLocale.fr;
