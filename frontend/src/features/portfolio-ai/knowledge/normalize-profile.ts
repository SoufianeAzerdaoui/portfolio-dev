import { portfolioContentByLocale } from "@/content/portfolio";
import {
  PERSON_ID,
  sourceRef,
} from "@/features/portfolio-ai/knowledge/knowledge.sources";
import type {
  KnowledgeEntity,
  KnowledgeFact,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

export function normalizeProfile() {
  const fr = portfolioContentByLocale.fr;
  const en = portfolioContentByLocale.en;

  const entity: KnowledgeEntity = {
    id: PERSON_ID,
    type: "person",
    canonicalName: fr.identity.name,
    aliases: [fr.identity.name, en.identity.name, "Soufiane", "Azerdaoui"],
    localeContent: {
      fr: {
        title: fr.identity.role,
        summary: fr.about.paragraphs
          .map((paragraph) => paragraph.map((part) => part.text).join(""))
          .join("\n"),
      },
      en: {
        title: en.identity.role,
        summary: en.about.paragraphs
          .map((paragraph) => paragraph.map((part) => part.text).join(""))
          .join("\n"),
      },
    },
    sourceRefs: [
      sourceRef("portfolio", "identity"),
      sourceRef("portfolio", "about"),
    ],
    metadata: {
      displayStats: fr.about.stats.map((stat) => ({
        ...stat,
        status: "derived",
        usage: "display-only",
      })),
    },
  };

  const facts: KnowledgeFact[] = [
    {
      id: "fact:person:soufiane-azerdaoui:role",
      subjectId: PERSON_ID,
      predicate: "hasRole",
      value: fr.identity.role,
      status: "verified",
      evidence: [
        {
          sourceType: "portfolio",
          sourceId: "identity",
          field: "role",
          strength: "primary",
        },
      ],
    },
    {
      id: "fact:person:soufiane-azerdaoui:main-interests",
      subjectId: PERSON_ID,
      predicate: "hasInterest",
      value: fr.about.highlights,
      status: "derived",
      evidence: [
        {
          sourceType: "portfolio",
          sourceId: "about",
          field: "highlights",
          strength: "supporting",
        },
      ],
    },
  ];

  return { entities: [entity], facts };
}
