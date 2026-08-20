import type { SupportedLocale } from "@/types/project";

export const projectsPageContentByLocale = {
  fr: {
    back: "Retour au portfolio",
    kicker: "/ Projets",
    title: "Tous mes projets",
    description:
      "Une collection de projets Data & IA conçus pour résoudre des problématiques réelles et créer de la valeur grâce à la donnée et à l'intelligence artificielle.",
  },
  en: {
    back: "Back to portfolio",
    kicker: "/ Projects",
    title: "All projects",
    description:
      "A collection of Data & AI projects designed to solve real problems and create value through data and artificial intelligence.",
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
