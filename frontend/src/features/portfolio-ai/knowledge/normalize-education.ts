import { educationContentByLocale } from "@/content/education";
import {
  canonicalEducationOverrides,
  overrideEvidence,
} from "@/features/portfolio-ai/knowledge/knowledge.overrides";
import { sourceRef } from "@/features/portfolio-ai/knowledge/knowledge.sources";
import type {
  KnowledgeEntity,
  KnowledgeFact,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

function educationFactId(educationId: string, predicate: string) {
  return `fact:${educationId}:${predicate}`;
}

export function normalizeEducation() {
  const entities: KnowledgeEntity[] = [];
  const facts: KnowledgeFact[] = [];

  canonicalEducationOverrides.forEach((override) => {
    const frItem = educationContentByLocale.fr.items[override.sourceIndex];
    const enItem = educationContentByLocale.en.items[override.sourceIndex];
    const entity: KnowledgeEntity = {
      id: override.id,
      type: "education",
      canonicalName: override.programme,
      aliases: [
        override.programme,
        frItem?.title ?? "",
        enItem?.title ?? "",
        override.institution,
        ...(override.id === "education-isima-siad-2026"
          ? ["Master SIAD", "Master 2 SIAD", "M2 SIAD", "ISIMA", "UCA"]
          : []),
      ],
      localeContent: {
        fr: {
          title: frItem?.title ?? override.programme,
          summary: `${override.institution} - ${override.location}`,
        },
        en: {
          title: enItem?.title,
          summary: `${enItem?.institution ?? override.institution} - ${
            enItem?.location ?? override.location
          }`,
        },
      },
      sourceRefs: [
        sourceRef("education", `item-${override.sourceIndex}`),
        sourceRef("verification-override", "education-canonical-status"),
      ],
      metadata: {
        period: override.period,
        status: override.status,
      },
    };

    entities.push(entity);

    const evidence = [
      {
        sourceType: "education" as const,
        sourceId: `item-${override.sourceIndex}`,
        strength: "primary" as const,
      },
      overrideEvidence("education-canonical-status"),
    ];

    facts.push(
      {
        id: educationFactId(override.id, "period"),
        subjectId: override.id,
        predicate: "period",
        value: override.period,
        status: override.verification,
        evidence,
      },
      {
        id: educationFactId(override.id, "programme"),
        subjectId: override.id,
        predicate: "programme",
        value: override.programme,
        status: override.verification,
        evidence,
      },
      {
        id: educationFactId(override.id, "institution"),
        subjectId: override.id,
        predicate: "institution",
        value: override.institution,
        status: override.verification,
        evidence,
      },
      {
        id: educationFactId(override.id, "location"),
        subjectId: override.id,
        predicate: "location",
        value: override.location,
        status: override.verification,
        evidence,
      },
      {
        id: educationFactId(override.id, "educationStatus"),
        subjectId: override.id,
        predicate: "educationStatus",
        value: override.status,
        status: override.verification,
        evidence,
      },
    );
  });

  return { entities, facts };
}
