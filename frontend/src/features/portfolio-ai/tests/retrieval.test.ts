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

function factPredicates(result: PortfolioRetrievalResult, entityId: string) {
  return groupFor(result, entityId)?.facts.map((fact) => fact.predicate) ?? [];
}

function factEvidenceFields(result: PortfolioRetrievalResult, entityId: string) {
  return [
    ...new Set(
      groupFor(result, entityId)?.facts.flatMap((fact) =>
        fact.evidence.map((evidence) => evidence.field ?? ""),
      ) ?? [],
    ),
  ];
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

function assertIncludesEntities(
  result: PortfolioRetrievalResult,
  expectedEntityIds: readonly string[],
) {
  const ids = entityIds(result);

  expectedEntityIds.forEach((entityId) => {
    assert.ok(ids.includes(entityId), `Expected ${entityId} in results.`);
  });
}

function assertExactEntities(
  result: PortfolioRetrievalResult,
  expectedEntityIds: readonly string[],
) {
  assert.deepEqual(entityIds(result), expectedEntityIds);
}

function assertNotDocumented(result: PortfolioRetrievalResult) {
  assert.equal(result.status, "not-documented");
  assert.equal(result.notDocumented, true);
  assert.equal(result.results.length, 0);
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

const qdrantUsedQuestion = retrievePortfolioKnowledge("Qdrant est-il utilisé ?", {
  locale: "fr",
});
assert.equal(qdrantUsedQuestion.intent, "technology_evidence");
assertExactEntities(qdrantUsedQuestion, ["medical-rag-platform"]);

const qdrantRole = retrievePortfolioKnowledge("Quel rôle joue Qdrant ?", {
  locale: "fr",
  topK: 10,
});
assert.equal(qdrantRole.intent, "technology_explanation");
assertExactEntities(qdrantRole, ["medical-rag-platform"]);
assert.ok(
  qdrantRole.matchedEntities.some((match) => match.entity.id === "tech:qdrant"),
);
assert.ok(
  factValues(qdrantRole, "medical-rag-platform").includes("tech:qdrant"),
);
assert.ok(
  factValues(qdrantRole, "medical-rag-platform").includes("indexation Qdrant"),
);

const qdrantUsedFor = retrievePortfolioKnowledge("What is Qdrant used for?", {
  locale: "en",
  topK: 10,
});
assert.equal(qdrantUsedFor.intent, "technology_explanation");
assertExactEntities(qdrantUsedFor, ["medical-rag-platform"]);

const qdrantPurposeMedicalRag = retrievePortfolioKnowledge(
  "À quoi sert Qdrant dans le projet RAG médical ?",
  { locale: "fr", topK: 10 },
);
assert.equal(qdrantPurposeMedicalRag.intent, "project_technology_explanation");
assertExactEntities(qdrantPurposeMedicalRag, ["medical-rag-platform"]);

const qdrantSelectionRationale = retrievePortfolioKnowledge(
  "Pourquoi Qdrant plutôt que Pinecone ?",
  { locale: "fr", topK: 10 },
);
assert.equal(qdrantSelectionRationale.intent, "technology_explanation");
assertExactEntities(qdrantSelectionRationale, ["medical-rag-platform"]);

const kafkaRole = retrievePortfolioKnowledge("Quel rôle joue Kafka ?", {
  locale: "fr",
  topK: 10,
});
assert.equal(kafkaRole.intent, "technology_explanation");
assertIncludesEntities(kafkaRole, [
  "real-time-ecommerce-activity-tracking",
  "personalized-recommendation-system",
]);
assert.equal(entityIds(kafkaRole).length, 2);

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
assertNotDocumented(kubernetes);

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
assertIncludesEntities(ragProjects, ["medical-rag-platform", "syndismart-ai"]);

const recommendationObjective = retrievePortfolioKnowledge(
  "Quel est l’objectif du Personalized Recommendation System ?",
  { locale: "fr", topK: 10 },
);
assert.equal(recommendationObjective.intent, "project_lookup");
assert.equal(recommendationObjective.requestedProjectAttribute, "objective");
assertExactEntities(recommendationObjective, [
  "personalized-recommendation-system",
]);
assert.ok(
  factEvidenceFields(
    recommendationObjective,
    "personalized-recommendation-system",
  ).includes("content.fr.shortDescription"),
);
assert.ok(
  factValues(
    recommendationObjective,
    "personalized-recommendation-system",
  ).some((value) => value.includes("recommandations en temps réel")),
);

const recommendationObjectiveEn = retrievePortfolioKnowledge(
  "What is the goal of the Personalized Recommendation System?",
  { locale: "en", topK: 10 },
);
assert.equal(recommendationObjectiveEn.intent, "project_lookup");
assert.equal(recommendationObjectiveEn.requestedProjectAttribute, "objective");
assertExactEntities(recommendationObjectiveEn, [
  "personalized-recommendation-system",
]);
assert.ok(
  factEvidenceFields(
    recommendationObjectiveEn,
    "personalized-recommendation-system",
  ).includes("content.en.shortDescription"),
);

const ecommerceFunctioning = retrievePortfolioKnowledge(
  "Comment fonctionne le Real-time E-commerce Activity Tracking ?",
  { locale: "fr", topK: 10 },
);
assert.equal(ecommerceFunctioning.intent, "project_lookup");
assert.equal(ecommerceFunctioning.requestedProjectAttribute, "approach");
assertExactEntities(ecommerceFunctioning, [
  "real-time-ecommerce-activity-tracking",
]);
assert.equal(
  entityIds(ecommerceFunctioning).includes("personalized-recommendation-system"),
  false,
);
assert.ok(
  factPredicates(
    ecommerceFunctioning,
    "real-time-ecommerce-activity-tracking",
  ).includes("projectApproach"),
);
assert.ok(
  factPredicates(
    ecommerceFunctioning,
    "real-time-ecommerce-activity-tracking",
  ).includes("projectArchitecture"),
);
assert.ok(
  factValues(
    ecommerceFunctioning,
    "real-time-ecommerce-activity-tracking",
  ).includes("Apache Spark"),
);

const ecommerceFunctioningEn = retrievePortfolioKnowledge(
  "How does Real-time E-commerce Activity Tracking work?",
  { locale: "en", topK: 10 },
);
assert.equal(ecommerceFunctioningEn.intent, "project_lookup");
assert.equal(ecommerceFunctioningEn.requestedProjectAttribute, "approach");
assertExactEntities(ecommerceFunctioningEn, [
  "real-time-ecommerce-activity-tracking",
]);

const ecommerceArchitecture = retrievePortfolioKnowledge(
  "Quelle est l’architecture du Real-time E-commerce Activity Tracking ?",
  { locale: "fr", topK: 10 },
);
assert.equal(ecommerceArchitecture.intent, "project_lookup");
assert.equal(ecommerceArchitecture.requestedProjectAttribute, "architecture");
assertExactEntities(ecommerceArchitecture, [
  "real-time-ecommerce-activity-tracking",
]);
assert.ok(
  factPredicates(
    ecommerceArchitecture,
    "real-time-ecommerce-activity-tracking",
  ).includes("projectArchitectureStep"),
);

const syndismartProblem = retrievePortfolioKnowledge(
  "Quel problème résout SyndiSmart AI ?",
  { locale: "fr", topK: 10 },
);
assert.equal(syndismartProblem.intent, "project_lookup");
assert.equal(syndismartProblem.requestedProjectAttribute, "problem");
assertExactEntities(syndismartProblem, ["syndismart-ai"]);
assert.ok(
  factEvidenceFields(syndismartProblem, "syndismart-ai").includes(
    "content.fr.caseStudy.problem",
  ),
);

const callCenterObjectives = retrievePortfolioKnowledge(
  "Quels sont les objectifs du Call Center AI ?",
  { locale: "fr", topK: 10 },
);
assert.equal(callCenterObjectives.intent, "project_lookup");
assert.equal(callCenterObjectives.requestedProjectAttribute, "objective");
assertExactEntities(callCenterObjectives, ["callcenter-frustration-ai"]);
assert.ok(
  factEvidenceFields(callCenterObjectives, "callcenter-frustration-ai").includes(
    "content.fr.caseStudy.objectives",
  ),
);

const ambiguousAiFunctioning = retrievePortfolioKnowledge(
  "Comment fonctionne son projet AI ?",
  { locale: "fr", topK: 10 },
);
assert.notEqual(ambiguousAiFunctioning.intent, "project_lookup");
assert.equal(ambiguousAiFunctioning.results.length > 1, true);

const medicalRagTechnologiesEn = retrievePortfolioKnowledge(
  "What technologies did he use for his medical RAG project?",
  { locale: "en", topK: 10 },
);
assert.equal(medicalRagTechnologiesEn.intent, "project_technology_lookup");
assert.equal(medicalRagTechnologiesEn.status, "verified");
assertExactEntities(medicalRagTechnologiesEn, ["medical-rag-platform"]);
assert.ok(
  factValues(medicalRagTechnologiesEn, "medical-rag-platform").includes(
    "tech:qdrant",
  ),
);

const medicalRagTechnologiesFr = retrievePortfolioKnowledge(
  "Quelles technologies a-t-il utilisées pour son projet RAG médical ?",
  { locale: "fr", topK: 10 },
);
assert.equal(medicalRagTechnologiesFr.intent, "project_technology_lookup");
assertExactEntities(medicalRagTechnologiesFr, ["medical-rag-platform"]);

const syndismartStack = retrievePortfolioKnowledge(
  "Quelle stack utilise SyndiSmart AI ?",
  { locale: "fr", topK: 10 },
);
assert.equal(syndismartStack.intent, "project_technology_lookup");
assertExactEntities(syndismartStack, ["syndismart-ai"]);
assert.ok(factValues(syndismartStack, "syndismart-ai").includes("tech:faiss"));
assert.equal(
  factValues(syndismartStack, "syndismart-ai").includes("tech:chroma"),
  true,
);

const recommendationStack = retrievePortfolioKnowledge(
  "What technologies were used in the Personalized Recommendation System?",
  { locale: "en", topK: 10 },
);
assert.equal(recommendationStack.intent, "project_technology_lookup");
assertExactEntities(recommendationStack, [
  "personalized-recommendation-system",
]);
assert.ok(
  factValues(recommendationStack, "personalized-recommendation-system").includes(
    "tech:apache-kafka",
  ),
);

const ambiguousAiProjectStack = retrievePortfolioKnowledge(
  "What technologies did he use in his AI project?",
  { locale: "en", topK: 10 },
);
assert.notEqual(ambiguousAiProjectStack.intent, "project_technology_lookup");
assert.equal(ambiguousAiProjectStack.results.length > 1, true);

const relevantAiProjects = retrievePortfolioKnowledge(
  "Quels sont ses projets les plus pertinents en IA ?",
  { locale: "fr" },
);
assert.equal(relevantAiProjects.intent, "projects_by_domain");
assert.equal(relevantAiProjects.status, "verified");
assert.equal(relevantAiProjects.notDocumented, false);
assertIncludesEntities(relevantAiProjects, [
  "medical-rag-platform",
  "syndismart-ai",
  "callcenter-frustration-ai",
  "personalized-recommendation-system",
  "algorithmic-trading-ml",
]);

const shortAiProjects = retrievePortfolioKnowledge("Quels sont ses projets IA ?", {
  locale: "fr",
});
assert.equal(shortAiProjects.intent, "projects_by_domain");
assert.equal(shortAiProjects.notDocumented, false);
assertIncludesEntities(shortAiProjects, ["medical-rag-platform", "syndismart-ai"]);

const artificialIntelligenceProjects = retrievePortfolioKnowledge(
  "Quels sont ses meilleurs projets en intelligence artificielle ?",
  { locale: "fr" },
);
assert.equal(artificialIntelligenceProjects.intent, "projects_by_domain");
assert.equal(artificialIntelligenceProjects.notDocumented, false);
assertIncludesEntities(artificialIntelligenceProjects, [
  "medical-rag-platform",
  "syndismart-ai",
]);

const englishAiProjects = retrievePortfolioKnowledge(
  "What are his most relevant AI projects?",
  { locale: "en" },
);
assert.equal(englishAiProjects.intent, "projects_by_domain");
assert.equal(englishAiProjects.notDocumented, false);
assertIncludesEntities(englishAiProjects, [
  "medical-rag-platform",
  "syndismart-ai",
]);

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
assertIncludesEntities(dataEngineering, [
  "personalized-recommendation-system",
  "real-time-ecommerce-activity-tracking",
]);

const technicalSkillsOverview = retrievePortfolioKnowledge(
  "Quelles sont ses compétences techniques ?",
  { locale: "fr", topK: 10 },
);
assert.equal(technicalSkillsOverview.intent, "technical_skills_overview");
assert.equal(technicalSkillsOverview.status, "verified");
assertExactEntities(technicalSkillsOverview, ["person:soufiane-azerdaoui"]);
assert.ok(
  factPredicates(
    technicalSkillsOverview,
    "person:soufiane-azerdaoui",
  ).includes("hasProfileSkill"),
);
assert.ok(
  factEvidenceFields(
    technicalSkillsOverview,
    "person:soufiane-azerdaoui",
  ).includes("cloud-devops"),
);

const dataEngineeringSkills = retrievePortfolioKnowledge(
  "Quelles sont ses compétences en Data Engineering ?",
  { locale: "fr", topK: 10 },
);
assert.equal(dataEngineeringSkills.intent, "skills_by_category");
assert.equal(dataEngineeringSkills.skillCategory, "data-engineering");
assertExactEntities(dataEngineeringSkills, ["person:soufiane-azerdaoui"]);
assert.equal(
  groupFor(dataEngineeringSkills, "person:soufiane-azerdaoui")?.facts.every(
    (fact) =>
      fact.predicate === "hasProfileSkill" &&
      typeof fact.value === "object" &&
      fact.value !== null &&
      "category" in fact.value &&
      fact.value.category === "data-engineering",
  ),
  true,
);

const dataFit = retrievePortfolioKnowledge(
  "Quelles compétences peut-il apporter à une équipe Data ?",
  { locale: "fr", topK: 10 },
);
assert.equal(dataFit.intent, "candidate_fit");
assert.equal(dataFit.candidateFitFocus, "data-engineering");
assert.equal(dataFit.skillCategory, "data-engineering");
assertIncludesEntities(dataFit, [
  "person:soufiane-azerdaoui",
  "education-isima-siad-2026",
  "pfe-business-intelligence-2024",
  "personalized-recommendation-system",
  "real-time-ecommerce-activity-tracking",
]);

const candidateFitDataAiFr = retrievePortfolioKnowledge(
  "Pourquoi Soufiane serait-il un bon candidat pour un stage Data & AI ?",
  { locale: "fr", topK: 10 },
);
assert.equal(candidateFitDataAiFr.intent, "candidate_fit");
assert.equal(candidateFitDataAiFr.candidateFitFocus, "data-ai");
assertIncludesEntities(candidateFitDataAiFr, [
  "person:soufiane-azerdaoui",
  "education-isima-siad-2026",
  "chu-mohammed-vi-pfe-2026",
  "pfe-business-intelligence-2024",
  "medical-rag-platform",
  "personalized-recommendation-system",
  "real-time-ecommerce-activity-tracking",
]);

const candidateFitDataAiEn = retrievePortfolioKnowledge(
  "Why is Soufiane a good candidate for a Data & AI internship?",
  { locale: "en", topK: 10 },
);
assert.equal(candidateFitDataAiEn.intent, "candidate_fit");
assert.equal(candidateFitDataAiEn.candidateFitFocus, "data-ai");
assertIncludesEntities(candidateFitDataAiEn, [
  "person:soufiane-azerdaoui",
  "education-isima-siad-2026",
  "chu-mohammed-vi-pfe-2026",
  "pfe-business-intelligence-2024",
  "medical-rag-platform",
  "personalized-recommendation-system",
  "real-time-ecommerce-activity-tracking",
]);

const candidateFitDataEngineer = retrievePortfolioKnowledge(
  "Pourquoi son profil est-il pertinent pour un stage Data Engineer ?",
  { locale: "fr", topK: 10 },
);
assert.equal(candidateFitDataEngineer.intent, "candidate_fit");
assert.equal(candidateFitDataEngineer.candidateFitFocus, "data-engineering");
assertIncludesEntities(candidateFitDataEngineer, [
  "person:soufiane-azerdaoui",
  "education-isima-siad-2026",
  "pfe-business-intelligence-2024",
  "personalized-recommendation-system",
  "real-time-ecommerce-activity-tracking",
]);

const candidateFitAiEngineer = retrievePortfolioKnowledge(
  "Pourquoi son profil est-il pertinent pour un stage AI Engineer ?",
  { locale: "fr", topK: 10 },
);
assert.equal(candidateFitAiEngineer.intent, "candidate_fit");
assert.equal(candidateFitAiEngineer.candidateFitFocus, "ai-engineering");
assertIncludesEntities(candidateFitAiEngineer, [
  "person:soufiane-azerdaoui",
  "education-isima-siad-2026",
  "chu-mohammed-vi-pfe-2026",
  "medical-rag-platform",
  "syndismart-ai",
  "callcenter-frustration-ai",
]);

const candidateTechnicalStrengths = retrievePortfolioKnowledge(
  "Quelles sont ses principales forces techniques ?",
  { locale: "fr", topK: 10 },
);
assert.equal(candidateTechnicalStrengths.intent, "candidate_fit");
assert.equal(candidateTechnicalStrengths.candidateFitFocus, "technical-strengths");
assertIncludesEntities(candidateTechnicalStrengths, [
  "person:soufiane-azerdaoui",
  "education-isima-siad-2026",
  "pfe-business-intelligence-2024",
  "personalized-recommendation-system",
  "real-time-ecommerce-activity-tracking",
]);

const candidateDataVsAi = retrievePortfolioKnowledge(
  "Son profil est-il plutôt Data Engineer ou AI Engineer ?",
  { locale: "fr", topK: 10 },
);
assert.equal(candidateDataVsAi.intent, "candidate_fit");
assert.equal(candidateDataVsAi.candidateFitFocus, "comparison");
assertIncludesEntities(candidateDataVsAi, [
  "person:soufiane-azerdaoui",
  "education-isima-siad-2026",
  "chu-mohammed-vi-pfe-2026",
  "pfe-business-intelligence-2024",
  "medical-rag-platform",
  "personalized-recommendation-system",
  "real-time-ecommerce-activity-tracking",
]);

const nlpSkills = retrievePortfolioKnowledge(
  "Quelles technologies maîtrise-t-il en NLP ?",
  { locale: "fr", topK: 10 },
);
assert.equal(nlpSkills.intent, "skills_by_category");
assert.equal(nlpSkills.skillCategory, "ai-nlp-genai");
assertExactEntities(nlpSkills, ["person:soufiane-azerdaoui"]);

const kubernetesSkill = retrievePortfolioKnowledge("Connaît-il Kubernetes ?", {
  locale: "fr",
  topK: 10,
});
assert.equal(kubernetesSkill.intent, "skill_lookup");
assert.equal(kubernetesSkill.normalizedSkillId, "tech:kubernetes");
assertExactEntities(kubernetesSkill, ["person:soufiane-azerdaoui"]);
assert.equal(kubernetesSkill.status, "verified");
assert.equal(kubernetesSkill.notDocumented, false);

const kubernetesExpertise = retrievePortfolioKnowledge(
  "Est-il expert Kubernetes ?",
  { locale: "fr", topK: 10 },
);
assert.equal(kubernetesExpertise.intent, "skill_lookup");
assert.equal(kubernetesExpertise.normalizedSkillId, "tech:kubernetes");
assertExactEntities(kubernetesExpertise, ["person:soufiane-azerdaoui"]);

const languageOverview = retrievePortfolioKnowledge(
  "Quelles langues parle-t-il ?",
  { locale: "fr", topK: 10 },
);
assert.equal(languageOverview.intent, "language_overview");
assertExactEntities(languageOverview, ["person:soufiane-azerdaoui"]);
assert.equal(
  groupFor(languageOverview, "person:soufiane-azerdaoui")?.facts.filter(
    (fact) => fact.predicate === "speaksLanguage",
  ).length,
  4,
);

const englishLevel = retrievePortfolioKnowledge(
  "Quel est son niveau en anglais ?",
  { locale: "fr", topK: 10 },
);
assert.equal(englishLevel.intent, "language_lookup");
assert.equal(englishLevel.languageId, "language:english");
assert.equal(englishLevel.languageQueryKind, "level");
assertExactEntities(englishLevel, ["person:soufiane-azerdaoui"]);

const nativeLanguage = retrievePortfolioKnowledge(
  "Quelle est sa langue maternelle ?",
  { locale: "fr", topK: 10 },
);
assert.equal(nativeLanguage.intent, "language_lookup");
assert.equal(nativeLanguage.languageQueryKind, "native");
assertExactEntities(nativeLanguage, ["person:soufiane-azerdaoui"]);
assert.equal(
  groupFor(nativeLanguage, "person:soufiane-azerdaoui")?.facts.some(
    (fact) =>
      fact.predicate === "speaksLanguage" &&
      typeof fact.value === "object" &&
      fact.value !== null &&
      "languageId" in fact.value &&
      fact.value.languageId === "language:arabic",
  ),
  true,
);

const dataAiProjects = retrievePortfolioKnowledge(
  "Quels sont ses projets Data/IA ?",
  { locale: "fr", topK: 10 },
);
assert.equal(dataAiProjects.intent, "projects_by_domain");
assert.equal(dataAiProjects.notDocumented, false);
assertIncludesEntities(dataAiProjects, [
  "medical-rag-platform",
  "real-time-ecommerce-activity-tracking",
  "bank-credit-decision-support-system",
]);

const englishDataAiProjects = retrievePortfolioKnowledge(
  "What are his Data and AI projects?",
  { locale: "en", topK: 10 },
);
assert.equal(englishDataAiProjects.intent, "projects_by_domain");
assert.equal(englishDataAiProjects.notDocumented, false);
assertIncludesEntities(englishDataAiProjects, [
  "medical-rag-platform",
  "real-time-ecommerce-activity-tracking",
  "bank-credit-decision-support-system",
]);

const comparison = retrievePortfolioKnowledge("Compare Medical RAG et SyndiSmart", {
  locale: "fr",
});
assert.equal(comparison.intent, "comparison");
assert.ok(entityIds(comparison).includes("medical-rag-platform"));
assert.ok(entityIds(comparison).includes("syndismart-ai"));

const whyQdrantMedicalRag = retrievePortfolioKnowledge(
  "Why did he use Qdrant in his medical RAG project?",
  { locale: "en", topK: 10 },
);
assert.equal(whyQdrantMedicalRag.intent, "project_technology_explanation");
assertExactEntities(whyQdrantMedicalRag, ["medical-rag-platform"]);
assert.ok(
  whyQdrantMedicalRag.matchedEntities.some(
    (match) => match.entity.id === "tech:qdrant",
  ),
);
assert.ok(
  factValues(whyQdrantMedicalRag, "medical-rag-platform").includes(
    "tech:qdrant",
  ),
);
assert.ok(
  factValues(whyQdrantMedicalRag, "medical-rag-platform").includes(
    "indexation Qdrant",
  ),
);
assert.equal(entityIds(whyQdrantMedicalRag).includes("syndismart-ai"), false);

const qdrantUsedForMedicalRag = retrievePortfolioKnowledge(
  "What was Qdrant used for in the Medical RAG Platform?",
  { locale: "en", topK: 10 },
);
assert.equal(qdrantUsedForMedicalRag.intent, "project_technology_explanation");
assertExactEntities(qdrantUsedForMedicalRag, ["medical-rag-platform"]);

const qdrantRoleMedicalRagFr = retrievePortfolioKnowledge(
  "Quel est le rôle de Qdrant dans le projet RAG médical ?",
  { locale: "fr", topK: 10 },
);
assert.equal(qdrantRoleMedicalRagFr.intent, "project_technology_explanation");
assertExactEntities(qdrantRoleMedicalRagFr, ["medical-rag-platform"]);

const qdrantInsteadOfPinecone = retrievePortfolioKnowledge(
  "Why Qdrant instead of Pinecone in the medical RAG project?",
  { locale: "en", topK: 10 },
);
assert.equal(qdrantInsteadOfPinecone.intent, "project_technology_explanation");
assertExactEntities(qdrantInsteadOfPinecone, ["medical-rag-platform"]);

const kafkaRecommendationExplanation = retrievePortfolioKnowledge(
  "Pourquoi Kafka est utilisé dans son Recommendation System ?",
  { locale: "fr", topK: 10 },
);
assert.equal(
  kafkaRecommendationExplanation.intent,
  "project_technology_explanation",
);
assertExactEntities(kafkaRecommendationExplanation, [
  "personalized-recommendation-system",
]);

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

[
  "Kubernetes",
  "Travaille-t-il chez Google ?",
  "A-t-il une certification AWS ?",
].forEach((query) => {
  assertNotDocumented(retrievePortfolioKnowledge(query, { locale: "fr" }));
});

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
