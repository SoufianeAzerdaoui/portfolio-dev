import type { SupportedLocale } from "@/types/project";

export const projectsPageContentByLocale = {
  fr: {
    back: "Retour au portfolio",
    kicker: "/ Projets",
    title: "Tous mes projets",
    description:
      "Une sélection de projets en IA, Data, BI et Software Engineering, de l’expérimentation à la mise en production.",
  },
  en: {
    back: "Back to portfolio",
    kicker: "/ Projects",
    title: "All projects",
    description:
      "A selection of AI, Data, BI and Software Engineering projects, from experimentation to production-oriented delivery.",
  },
} satisfies Record<
  SupportedLocale,
  {
    back: string;
    kicker: string;
    title: string;
    description: string;
  }
>;

export const projectsPageContent = projectsPageContentByLocale.fr;
