import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findEntitiesByAlias,
  getEducationByStatus,
  getEntityById,
  getEvidenceForTechnology,
  getExperiencesUsingTechnology,
  getFactsForEntity,
  getKnowledgeBase,
  getRelatedProjectsForExperience,
  validateCurrentKnowledgeBase,
} from "@/features/portfolio-ai/knowledge";

describe("Portfolio AI knowledge base", () => {
  it("validates the generated knowledge base", () => {
    const validation = validateCurrentKnowledgeBase();

    assert.equal(validation.ok, true, JSON.stringify(validation.issues, null, 2));
  });

  it("finds verified Qdrant evidence on Medical RAG", () => {
    const result = getEvidenceForTechnology("Qdrant");

    assert.equal(result.status, "verified");
    assert.ok(
      result.evidence.some(
        (item) =>
          item.entityId === "medical-rag-platform" &&
          item.status === "verified",
      ),
    );
  });

  it("finds documented Apache Kafka projects through the Kafka alias", () => {
    const result = getEvidenceForTechnology("Kafka", { verifiedOnly: true });
    const projectIds = result.evidence.map((item) => item.entityId);

    assert.ok(projectIds.includes("real-time-ecommerce-activity-tracking"));
    assert.ok(projectIds.includes("personalized-recommendation-system"));
  });

  it("returns not-documented for Kubernetes", () => {
    const result = getEvidenceForTechnology("Kubernetes");

    assert.equal(result.status, "not-documented");
    assert.deepEqual(result.evidence, []);
  });

  it("stores Kubernetes as a verified profile skill without project usage evidence", () => {
    const facts = getFactsForEntity("person:soufiane-azerdaoui");
    const kubernetesSkill = facts.find(
      (fact) =>
        fact.predicate === "hasProfileSkill" &&
        typeof fact.value === "object" &&
        fact.value !== null &&
        "entityId" in fact.value &&
        fact.value.entityId === "tech:kubernetes",
    );
    const usageEvidence = getEvidenceForTechnology("Kubernetes");

    assert.equal(kubernetesSkill?.status, "verified");
    assert.equal(usageEvidence.status, "not-documented");
    assert.deepEqual(usageEvidence.evidence, []);
  });

  it("stores canonical technical skills without duplicate common aliases", () => {
    const facts = getFactsForEntity("person:soufiane-azerdaoui").filter(
      (fact) => fact.predicate === "hasProfileSkill",
    );
    const skillValues = facts.map(
      (fact) => fact.value as { name?: string; category?: string },
    );
    const names = new Set(skillValues.map((value) => value.name));
    const categories = new Set(skillValues.map((value) => value.category));

    [
      "Pandas",
      "NumPy",
      "Kubernetes",
      "Qdrant",
      "Software modeling",
      "Data Modeling",
    ].forEach((name) => {
      assert.equal(names.has(name), true);
    });
    [
      "ml-deep-learning",
      "nlp-llm-rag",
      "data-engineering",
      "data-analysis-bi",
      "databases",
      "programming-languages",
      "web-api",
      "cloud-devops",
      "design-agile",
    ].forEach((category) => {
      assert.equal(categories.has(category), true);
    });

    assert.equal(findEntitiesByAlias("sklearn")[0]?.id, "tech:scikit-learn");
    assert.equal(findEntitiesByAlias("PowerBI")[0]?.id, "tech:power-bi");
    assert.equal(findEntitiesByAlias("K8s")[0]?.id, "tech:kubernetes");
    assert.equal(findEntitiesByAlias("React")[0]?.id, "tech:react");
    assert.equal(findEntitiesByAlias("Git")[0]?.id, "tech:git");
    assert.equal(findEntitiesByAlias("Bitbucket")[0]?.id, "tech:bitbucket");
  });

  it("stores canonical certifications as verified profile facts", () => {
    const certifications = getKnowledgeBase().entities.filter(
      (entity) => entity.type === "certification",
    );

    assert.deepEqual(
      certifications.map((entity) => entity.canonicalName).sort(),
      [
        "Data Cleaning and Preprocessing with pandas",
        "Data Engineer in Python",
        "Introduction to Big Data with Spark and Hadoop",
        "Python Data Structures",
      ].sort(),
    );

    certifications.forEach((certification) => {
      const facts = getFactsForEntity(certification.id);

      assert.equal(
        facts.some(
          (fact) =>
            fact.predicate === "certificationTitle" &&
            fact.status === "verified",
        ),
        true,
      );
      assert.equal(
        facts.some(
          (fact) =>
            fact.predicate === "certificationIssuer" &&
            fact.status === "verified",
        ),
        true,
      );
    });
  });

  it("stores recruiter-facing spoken language levels", () => {
    const languageFacts = getFactsForEntity("person:soufiane-azerdaoui").filter(
      (fact) => fact.predicate === "speaksLanguage",
    );
    const levels = new Map(
      languageFacts
        .filter(
          (fact) =>
            typeof fact.value === "object" &&
            fact.value !== null &&
            "languageId" in fact.value,
        )
        .map((fact) => [
          (fact.value as { languageId: string }).languageId,
          fact.value,
        ]),
    );

    assert.equal(
      (levels.get("language:arabic") as { levelType?: string } | undefined)
        ?.levelType,
      "native",
    );
    assert.equal(
      (levels.get("language:french") as { cefrLevel?: string } | undefined)
        ?.cefrLevel,
      "B2",
    );
    assert.equal(
      (levels.get("language:english") as { cefrLevel?: string } | undefined)
        ?.cefrLevel,
      "B1",
    );
    assert.equal(
      (levels.get("language:german") as { cefrLevel?: string } | undefined)
        ?.cefrLevel,
      "B1",
    );
  });

  it("marks FAISS as verified for SyndiSmart", () => {
    const result = getEvidenceForTechnology("FAISS");

    assert.ok(
      result.evidence.some(
        (item) => item.entityId === "syndismart-ai" && item.status === "verified",
      ),
    );
  });

  it("does not treat Chroma as verified", () => {
    const result = getEvidenceForTechnology("Chroma");
    const verified = getEvidenceForTechnology("Chroma", { verifiedOnly: true });

    assert.ok(
      result.evidence.some(
        (item) => item.entityId === "syndismart-ai" && item.status === "ambiguous",
      ),
    );
    assert.equal(verified.status, "not-documented");
    assert.deepEqual(verified.evidence, []);
  });

  it("applies Call Center verified technology overrides", () => {
    ["BERT", "TensorFlow"].forEach((technology) => {
      assert.ok(
        getEvidenceForTechnology(technology).evidence.some(
          (item) =>
            item.entityId === "callcenter-frustration-ai" &&
            item.status === "verified",
        ),
      );
    });
  });

  it("keeps Call Center ambiguous technologies out of verified-only results", () => {
    ["CamemBERT", "PyTorch"].forEach((technology) => {
      const allEvidence = getEvidenceForTechnology(technology);
      const verifiedOnly = getEvidenceForTechnology(technology, {
        verifiedOnly: true,
      });

      assert.ok(
        allEvidence.evidence.some(
          (item) =>
            item.entityId === "callcenter-frustration-ai" &&
            item.status === "ambiguous",
        ),
      );
      assert.equal(verifiedOnly.status, "not-documented");
      assert.deepEqual(verifiedOnly.evidence, []);
    });
  });

  it("keeps technology status per evidence item for FastAPI", () => {
    const result = getEvidenceForTechnology("FastAPI");

    assert.ok(
      result.evidence.some(
        (item) =>
          item.entityId === "callcenter-frustration-ai" &&
          item.status === "ambiguous",
      ),
    );
    assert.ok(
      result.evidence.some(
        (item) =>
          item.entityId === "medical-rag-platform" &&
          item.status === "verified",
      ),
    );
  });

  it("applies verified ATLINE stack to alternance and stage", () => {
    const expectedStack = [
      "Angular",
      "PHP",
      "MySQL",
      "Git/Bitbucket",
      "Jira",
      "Scrum",
    ];

    ["atline-alternance-2025", "atline-stage-2025"].forEach((experienceId) => {
      expectedStack.forEach((technology) => {
        assert.ok(
          getExperiencesUsingTechnology(technology, { verifiedOnly: true }).some(
            (item) => item.entityId === experienceId,
          ),
        );
      });
    });
  });

  it("overrides Business Intelligence internship organization and domain", () => {
    const facts = getFactsForEntity("pfe-business-intelligence-2024");

    assert.equal(
      facts.find((fact) => fact.predicate === "organization")?.value,
      "SEND SPACE",
    );
    assert.equal(
      facts.find((fact) => fact.predicate === "domain")?.value,
      "Business Intelligence",
    );
  });

  it("links Medical RAG to the CHU final-year internship", () => {
    const relatedProjects = getRelatedProjectsForExperience(
      "chu-mohammed-vi-pfe-2026",
    );

    assert.ok(
      relatedProjects.some((project) => project.id === "medical-rag-platform"),
    );
  });

  it("tracks education statuses canonically", () => {
    assert.ok(
      getEducationByStatus("in_progress").some(
        (education) => education.id === "education-isima-siad-2026",
      ),
    );

    const completedIds = getEducationByStatus("completed").map(
      (education) => education.id,
    );

    assert.ok(completedIds.includes("education-esisa-ai-2024"));
    assert.ok(completedIds.includes("education-est-big-data-2023"));
    assert.ok(completedIds.includes("education-ofppt-fullstack-2021"));
  });

  it("stores canonical recruiter availability without inferring other contracts", () => {
    const availability = getFactsForEntity("person:soufiane-azerdaoui").find(
      (fact) => fact.predicate === "hasAvailability",
    );

    assert.equal(availability?.status, "verified");
    assert.deepEqual(availability?.evidence, [
      {
        sourceType: "portfolio",
        sourceId: "availability",
        field: "career-availability",
        strength: "primary",
      },
    ]);
    assert.equal(
      (
        availability?.value as
          | {
              internship?: { availableFrom?: { en?: string } };
              apprenticeship?: { status?: string };
              fullTime?: { status?: string };
            }
          | undefined
      )?.internship?.availableFrom?.en,
      "April 2027",
    );
    assert.equal(
      (
        availability?.value as
          | { apprenticeship?: { status?: string } }
          | undefined
      )?.apprenticeship?.status,
      "not-documented",
    );
    assert.equal(
      (availability?.value as { fullTime?: { status?: string } } | undefined)
        ?.fullTime?.status,
      "not-documented",
    );
  });

  it("stores canonical career target roles without duplicating availability", () => {
    const target = getFactsForEntity("person:soufiane-azerdaoui").find(
      (fact) => fact.predicate === "hasCareerTarget",
    );

    assert.equal(target?.status, "verified");
    assert.deepEqual(target?.evidence, [
      {
        sourceType: "portfolio",
        sourceId: "career-target",
        field: "target-roles",
        strength: "primary",
      },
    ]);
    assert.deepEqual(
      (
        target?.value as
          | { opportunityType?: string; targetRoles?: readonly string[] }
          | undefined
      )?.targetRoles,
      ["Data Engineer", "AI Engineer", "Data & AI Engineer"],
    );
    assert.equal(
      (
        target?.value as
          | { opportunityType?: string; availableFrom?: string }
          | undefined
      )?.opportunityType,
      "internship",
    );
    assert.equal(
      "availableFrom" in
        ((target?.value as Record<string, unknown> | undefined) ?? {}),
      false,
    );
  });

  it("does not create separate FR and EN project entities", () => {
    const medicalEntities = getKnowledgeBase().entities.filter(
      (entity) => entity.id === "medical-rag-platform",
    );

    assert.equal(medicalEntities.length, 1);
    assert.equal(getEntityById("medical-rag-platform")?.type, "project");
  });

  it("keeps searchKeyword-only terms as retrieval aliases, not verified facts", () => {
    assert.ok(
      findEntitiesByAlias("K-means").some(
        (entity) => entity.id === "nutrition-atherosclerosis-analysis",
      ),
    );

    const facts = getKnowledgeBase().facts.filter(
      (fact) =>
        fact.status === "verified" &&
        JSON.stringify(fact.value).toLowerCase().includes("k-means"),
    );

    assert.deepEqual(facts, []);
  });
});
