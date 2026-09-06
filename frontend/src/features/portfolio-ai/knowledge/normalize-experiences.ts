import { journeyExperiencesByLocale } from "@/content/journey";
import {
  atlineExperienceIds,
  atlineVerifiedTechnologyNames,
  businessIntelligenceExperienceOverride,
  overrideEvidence,
} from "@/features/portfolio-ai/knowledge/knowledge.overrides";
import { sourceRef } from "@/features/portfolio-ai/knowledge/knowledge.sources";
import {
  canonicalizeTechnology,
  createTechnologyEntity,
} from "@/features/portfolio-ai/knowledge/build-skills-index";
import type {
  KnowledgeEntity,
  KnowledgeFact,
  KnowledgeRelation,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

function experienceFactId(experienceId: string, predicate: string, value: string) {
  return `fact:${experienceId}:${predicate}:${value}`;
}

function organizationId(name: string) {
  return `org:${name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function getExperienceTechnologyNames(experienceId: string, sourceNames: string[]) {
  if (atlineExperienceIds.includes(experienceId as (typeof atlineExperienceIds)[number])) {
    return [...atlineVerifiedTechnologyNames];
  }

  if (experienceId === businessIntelligenceExperienceOverride.experienceId) {
    return [...businessIntelligenceExperienceOverride.technologies];
  }

  return sourceNames;
}

export function normalizeExperiences() {
  const entities: KnowledgeEntity[] = [];
  const facts: KnowledgeFact[] = [];
  const relations: KnowledgeRelation[] = [];

  journeyExperiencesByLocale.fr.forEach((frExperience) => {
    const enExperience = journeyExperiencesByLocale.en.find(
      (experience) => experience.id === frExperience.id,
    );

    const organization =
      frExperience.id === businessIntelligenceExperienceOverride.experienceId
        ? businessIntelligenceExperienceOverride.organization
        : frExperience.organization;
    const domain =
      frExperience.id === businessIntelligenceExperienceOverride.experienceId
        ? businessIntelligenceExperienceOverride.domain
        : undefined;
    const baseEvidence = {
      sourceType: "journey" as const,
      sourceId: frExperience.id,
      strength: "primary" as const,
    };
    const entity: KnowledgeEntity = {
      id: frExperience.id,
      type: "experience",
      canonicalName: `${frExperience.role} - ${
        organization ?? frExperience.organization ?? "organisation non documentée"
      }`,
      aliases: [
        frExperience.id,
        frExperience.role,
        enExperience?.role ?? "",
        organization ?? "",
        frExperience.organization ?? "",
      ],
      localeContent: {
        fr: {
          title: frExperience.role,
          description: frExperience.description,
        },
        en: {
          title: enExperience?.role,
          description: enExperience?.description,
        },
      },
      sourceRefs: [
        sourceRef("journey", frExperience.id),
        ...(frExperience.id === businessIntelligenceExperienceOverride.experienceId
          ? [sourceRef("verification-override", "business-intelligence-2024")]
          : []),
        ...(atlineExperienceIds.includes(
          frExperience.id as (typeof atlineExperienceIds)[number],
        )
          ? [sourceRef("verification-override", "atline-stack-2025")]
          : []),
      ],
      metadata: {
        period: frExperience.period,
        startDateTime: frExperience.startDateTime,
        endDateTime: frExperience.endDateTime,
        experienceType: frExperience.experienceType,
      },
    };

    entities.push(entity);

    facts.push(
      {
        id: experienceFactId(frExperience.id, "period", "value"),
        subjectId: frExperience.id,
        predicate: "period",
        value: frExperience.period,
        status: "verified",
        evidence: [baseEvidence],
      },
      {
        id: experienceFactId(frExperience.id, "role", "value"),
        subjectId: frExperience.id,
        predicate: "role",
        value: frExperience.role,
        status: "verified",
        evidence: [baseEvidence],
      },
    );

    if (organization) {
      const orgId = organizationId(organization);
      const orgEvidence =
        frExperience.id === businessIntelligenceExperienceOverride.experienceId
          ? [baseEvidence, overrideEvidence("business-intelligence-2024")]
          : [baseEvidence];

      entities.push({
        id: orgId,
        type: "organization",
        canonicalName: organization,
        aliases: [organization, frExperience.organization ?? ""],
        sourceRefs: [
          sourceRef("journey", frExperience.id),
          ...(frExperience.id === businessIntelligenceExperienceOverride.experienceId
            ? [sourceRef("verification-override", "business-intelligence-2024")]
            : []),
        ],
      });

      facts.push({
        id: experienceFactId(frExperience.id, "organization", orgId),
        subjectId: frExperience.id,
        predicate: "organization",
        value: organization,
        status: "verified",
        evidence: orgEvidence,
      });

      relations.push({
        id: `relation:${frExperience.id}:organization:${orgId}`,
        type: "experience-organization",
        fromEntityId: frExperience.id,
        toEntityId: orgId,
        predicate: "performedAt",
        status: "verified",
        evidence: orgEvidence,
      });
    }

    if (domain) {
      const domainId = `domain:${domain
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`;

      entities.push({
        id: domainId,
        type: "domain",
        canonicalName: domain,
        aliases: [domain, "BI"],
        sourceRefs: [sourceRef("verification-override", "business-intelligence-2024")],
      });

      facts.push({
        id: experienceFactId(frExperience.id, "domain", domainId),
        subjectId: frExperience.id,
        predicate: "domain",
        value: domain,
        status: "verified",
        evidence: [overrideEvidence("business-intelligence-2024")],
      });
    }

    getExperienceTechnologyNames(
      frExperience.id,
      frExperience.technologies ?? [],
    ).forEach((technologyName) => {
      const technology = canonicalizeTechnology(technologyName);
      const factId = experienceFactId(
        frExperience.id,
        "usesTechnology",
        technology.id.replace("tech:", ""),
      );
      const evidence =
        atlineExperienceIds.includes(
          frExperience.id as (typeof atlineExperienceIds)[number],
        )
          ? [overrideEvidence("atline-stack-2025")]
          : frExperience.id === businessIntelligenceExperienceOverride.experienceId
            ? [baseEvidence, overrideEvidence("business-intelligence-2024")]
            : [baseEvidence];

      entities.push(createTechnologyEntity(technologyName));
      facts.push({
        id: factId,
        subjectId: frExperience.id,
        predicate: "usesTechnology",
        value: technology.id,
        status: "verified",
        evidence,
      });
      relations.push({
        id: `relation:${frExperience.id}:technology:${technology.id}`,
        type: "experience-technology",
        fromEntityId: frExperience.id,
        toEntityId: technology.id,
        predicate: "usesTechnology",
        status: "verified",
        evidence,
        metadata: {
          factId,
        },
      });
    });
  });

  return { entities, facts, relations };
}
