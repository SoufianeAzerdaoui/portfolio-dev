import assert from "node:assert/strict";

import {
  normalizeQuery,
  retrievePortfolioKnowledge,
} from "@/features/portfolio-ai/retrieval";
import type { PortfolioRetrievalResult } from "@/features/portfolio-ai/retrieval";

function entityIds(result: PortfolioRetrievalResult) {
  return result.results.map((group) => group.entity.id);
}

function groupFor(result: PortfolioRetrievalResult, entityId: string) {
  return result.results.find((group) => group.entity.id === entityId);
}

function factValues(result: PortfolioRetrievalResult, entityId: string) {
  return (
    groupFor(result, entityId)?.facts.map((fact) => String(fact.value)) ?? []
  );
}

function assertEntityStatus(
  result: PortfolioRetrievalResult,
  entityId: string,
  status: string,
) {
  const group = groupFor(result, entityId);

  assert.ok(group, `Expected ${entityId} in retrieval results.`);
  assert.equal(group.status, status);
}

const qdrantFr = retrievePortfolioKnowledge("A-t-il utilisé Qdrant ?", {
  locale: "fr",
});
assert.equal(qdrantFr.intent, "technology_evidence");
assertEntityStatus(qdrantFr, "medical-rag-platform", "verified");

const qdrantEn = retrievePortfolioKnowledge("Has he used Qdrant?", {
  locale: "en",
});
assert.equal(qdrantEn.intent, "technology_evidence");
assertEntityStatus(qdrantEn, "medical-rag-platform", "verified");

const kafka = retrievePortfolioKnowledge("Quels projets utilisent Kafka ?", {
  locale: "fr",
});
assert.equal(kafka.intent, "projects_by_technology");
assert.ok(entityIds(kafka).includes("real-time-ecommerce-activity-tracking"));
assert.ok(entityIds(kafka).includes("personalized-recommendation-system"));

const kubernetes = retrievePortfolioKnowledge(
  "A-t-il travaillé avec Kubernetes ?",
  { locale: "fr" },
);
assert.equal(kubernetes.status, "not-documented");
assert.equal(kubernetes.notDocumented, true);
assert.equal(kubernetes.results.length, 0);

const faiss = retrievePortfolioKnowledge("A-t-il utilisé FAISS ?", {
  locale: "fr",
});
assertEntityStatus(faiss, "syndismart-ai", "verified");

const chroma = retrievePortfolioKnowledge("A-t-il utilisé Chroma ?", {
  locale: "fr",
});
assertEntityStatus(chroma, "syndismart-ai", "ambiguous");
assert.ok(
  groupFor(chroma, "syndismart-ai")?.facts.every(
    (fact) => fact.status !== "verified",
  ),
);

const fastApi = retrievePortfolioKnowledge("A-t-il utilisé FastAPI ?", {
  locale: "fr",
  topK: 10,
});
assertEntityStatus(fastApi, "medical-rag-platform", "verified");
assertEntityStatus(fastApi, "personalized-recommendation-system", "verified");
assertEntityStatus(fastApi, "callcenter-frustration-ai", "ambiguous");

const ragProjects = retrievePortfolioKnowledge("Quels sont ses projets RAG ?", {
  locale: "fr",
});
assert.equal(ragProjects.intent, "projects_by_domain");
assert.ok(entityIds(ragProjects).includes("medical-rag-platform"));
assert.ok(entityIds(ragProjects).includes("syndismart-ai"));

const atline = retrievePortfolioKnowledge(
  "Quelle stack utilisait-il chez ATLINE ?",
  { locale: "fr", topK: 10 },
);
assert.equal(atline.intent, "experience_lookup");
["atline-alternance-2025", "atline-stage-2025"].forEach((experienceId) => {
  const values = factValues(atline, experienceId);

  ["tech:angular", "tech:php", "tech:mysql", "tech:git-bitbucket", "tech:jira", "tech:scrum"].forEach(
    (technologyId) => assert.ok(values.includes(technologyId), technologyId),
  );
});

const sendSpace = retrievePortfolioKnowledge(
  "Où a-t-il fait son stage Business Intelligence ?",
  { locale: "fr" },
);
assert.equal(sendSpace.intent, "experience_lookup");
assert.ok(factValues(sendSpace, "pfe-business-intelligence-2024").includes("SEND SPACE"));

const chu = retrievePortfolioKnowledge("Que faisait-il au CHU Mohammed VI ?", {
  locale: "fr",
  topK: 10,
});
assert.equal(chu.intent, "experience_lookup");
assert.ok(entityIds(chu).includes("chu-mohammed-vi-pfe-2026"));
assert.ok(entityIds(chu).includes("medical-rag-platform"));

const siad = retrievePortfolioKnowledge("A-t-il terminé son Master SIAD ?", {
  locale: "fr",
});
assert.equal(siad.intent, "education_lookup");
assert.ok(factValues(siad, "education-isima-siad-2026").includes("in_progress"));

const esisa = retrievePortfolioKnowledge("A-t-il obtenu son Master ESISA ?", {
  locale: "fr",
});
assert.equal(esisa.intent, "education_lookup");
assert.ok(factValues(esisa, "education-esisa-ai-2024").includes("completed"));

const currentMaster = retrievePortfolioKnowledge("Quel Master suit-il actuellement ?", {
  locale: "fr",
});
assert.equal(currentMaster.intent, "education_lookup");
assert.ok(
  entityIds(currentMaster).includes("education-isima-siad-2026"),
);

const currentAcademicProgram = retrievePortfolioKnowledge(
  "What is his current academic program?",
  { locale: "en" },
);
assert.equal(currentAcademicProgram.intent, "education_lookup");
assert.ok(
  entityIds(currentAcademicProgram).includes("education-isima-siad-2026"),
);

const dataEngineering = retrievePortfolioKnowledge(
  "Quels projets montrent ses compétences Data Engineering ?",
  { locale: "fr" },
);
assert.equal(dataEngineering.intent, "projects_by_domain");
assert.ok(entityIds(dataEngineering).includes("personalized-recommendation-system"));
assert.ok(entityIds(dataEngineering).includes("real-time-ecommerce-activity-tracking"));

const comparison = retrievePortfolioKnowledge("Compare Medical RAG et SyndiSmart", {
  locale: "fr",
});
assert.equal(comparison.intent, "comparison");
assert.ok(entityIds(comparison).includes("medical-rag-platform"));
assert.ok(entityIds(comparison).includes("syndismart-ai"));

const trading = retrievePortfolioKnowledge("Quel est son projet de trading ?", {
  locale: "fr",
});
assert.equal(trading.intent, "project_lookup");
assert.equal(trading.results[0]?.entity.id, "algorithmic-trading-ml");

const camembert = retrievePortfolioKnowledge("Est-ce qu'il connaît CamemBERT ?", {
  locale: "fr",
});
assertEntityStatus(camembert, "callcenter-frustration-ai", "ambiguous");

const nlp = retrievePortfolioKnowledge("Tell me about his NLP projects", {
  locale: "en",
  topK: 10,
});
assert.equal(nlp.intent, "projects_by_domain");
assert.ok(entityIds(nlp).includes("medical-rag-platform"));
assert.ok(entityIds(nlp).includes("syndismart-ai"));
assert.ok(entityIds(nlp).includes("callcenter-frustration-ai"));

const typo = retrievePortfolioKnowledge("Qdrantt", { locale: "fr" });
assert.equal(typo.notDocumented, true);
assert.equal(typo.results.length, 0);

const generic = retrievePortfolioKnowledge("AI", { locale: "fr" });
assert.ok(generic.results.length <= 3);

const firstRun = retrievePortfolioKnowledge("A-t-il utilisé FastAPI ?", {
  locale: "fr",
  topK: 10,
});
const secondRun = retrievePortfolioKnowledge("A-t-il utilisé FastAPI ?", {
  locale: "fr",
  topK: 10,
});
assert.deepEqual(
  firstRun.results.map((group) => [group.entity.id, group.score]),
  secondRun.results.map((group) => [group.entity.id, group.score]),
);

assert.equal(normalizeQuery("", "fr").errors.length > 0, true);
assert.equal(normalizeQuery("x".repeat(281), "fr").errors.length > 0, true);
assert.equal(
  retrievePortfolioKnowledge("Qdrant", { locale: "fr", topK: 0 }).errors.length > 0,
  true,
);
