import { normalizeAlias } from "@/features/portfolio-ai/knowledge/build-aliases";
import type {
  EducationStatus,
  KnowledgeBase,
  KnowledgeValidationIssue,
  KnowledgeValidationResult,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

const EDUCATION_STATUS_VALUES = new Set<EducationStatus>([
  "in_progress",
  "completed",
]);
const PERIOD_PATTERN = /^\d{4}-\d{4}$/;

function issue(code: string, message: string): KnowledgeValidationIssue {
  return { code, message };
}

export function validateKnowledgeBase(
  knowledgeBase: KnowledgeBase,
): KnowledgeValidationResult {
  const issues: KnowledgeValidationIssue[] = [];
  const entityIds = new Set<string>();
  const sourceKeys = new Set(
    knowledgeBase.sourceRefs.map(
      (sourceRef) => `${sourceRef.sourceType}:${sourceRef.sourceId}`,
    ),
  );

  knowledgeBase.entities.forEach((entity) => {
    if (entityIds.has(entity.id)) {
      issues.push(issue("duplicate-entity-id", `Duplicate entity id ${entity.id}.`));
    }

    entityIds.add(entity.id);

    if (!entity.canonicalName.trim()) {
      issues.push(issue("empty-canonical-name", `Entity ${entity.id} has no canonicalName.`));
    }
  });

  knowledgeBase.relations.forEach((relation) => {
    if (!entityIds.has(relation.fromEntityId)) {
      issues.push(
        issue(
          "relation-missing-source",
          `Relation ${relation.id} points from missing entity ${relation.fromEntityId}.`,
        ),
      );
    }

    if (!entityIds.has(relation.toEntityId)) {
      issues.push(
        issue(
          "relation-missing-target",
          `Relation ${relation.id} points to missing entity ${relation.toEntityId}.`,
        ),
      );
    }
  });

  knowledgeBase.facts.forEach((fact) => {
    if (!entityIds.has(fact.subjectId)) {
      issues.push(
        issue(
          "fact-missing-subject",
          `Fact ${fact.id} points to missing entity ${fact.subjectId}.`,
        ),
      );
    }

    fact.evidence.forEach((evidence) => {
      if (!sourceKeys.has(`${evidence.sourceType}:${evidence.sourceId}`)) {
        issues.push(
          issue(
            "evidence-missing-source",
            `Fact ${fact.id} references missing source ${evidence.sourceType}:${evidence.sourceId}.`,
          ),
        );
      }
    });

    if (fact.status === "verified" && fact.evidence.length === 0) {
      issues.push(
        issue("verified-fact-without-evidence", `Verified fact ${fact.id} has no evidence.`),
      );
    }

    if (
      fact.status === "verified" &&
      fact.evidence.some((evidence) => evidence.strength === "retrieval-only")
    ) {
      issues.push(
        issue(
          "retrieval-only-as-verified",
          `Verified fact ${fact.id} uses retrieval-only evidence.`,
        ),
      );
    }

    if (
      fact.predicate === "period" &&
      fact.subjectId.startsWith("education-") &&
      typeof fact.value === "string" &&
      !PERIOD_PATTERN.test(fact.value)
    ) {
      issues.push(issue("malformed-period", `Education period ${fact.value} is malformed.`));
    }

    if (
      fact.predicate === "educationStatus" &&
      typeof fact.value === "string" &&
      !EDUCATION_STATUS_VALUES.has(fact.value as EducationStatus)
    ) {
      issues.push(
        issue(
          "impossible-education-status",
          `Education status ${fact.value} is not supported.`,
        ),
      );
    }
  });

  const factsById = new Map(knowledgeBase.facts.map((fact) => [fact.id, fact]));

  knowledgeBase.relations.forEach((relation) => {
    const factId = String(relation.metadata?.factId ?? "");
    const fact = factsById.get(factId);

    if (relation.status === "verified" && fact?.status === "ambiguous") {
      issues.push(
        issue(
          "ambiguous-fact-used-as-verified",
          `Relation ${relation.id} promotes ambiguous fact ${fact.id}.`,
        ),
      );
    }
  });

  const technologyNames = new Map<string, string>();

  knowledgeBase.entities
    .filter((entity) => entity.type === "technology")
    .forEach((technology) => {
      const normalizedName = normalizeAlias(technology.canonicalName);
      const existingId = technologyNames.get(normalizedName);

      if (existingId && existingId !== technology.id) {
        issues.push(
          issue(
            "duplicate-canonical-technology",
            `Technology ${technology.id} duplicates canonical name from ${existingId}.`,
          ),
        );
      }

      technologyNames.set(normalizedName, technology.id);
    });

  return {
    ok: issues.length === 0,
    issues,
  };
}
