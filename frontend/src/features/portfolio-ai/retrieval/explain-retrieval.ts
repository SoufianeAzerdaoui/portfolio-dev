import type {
  DetectedEntity,
  RetrievalResultGroup,
} from "@/features/portfolio-ai/retrieval/retrieval.types";

export function explainMatchedEntity(match: DetectedEntity) {
  return {
    entityId: match.entity.id,
    canonicalName: match.entity.canonicalName,
    type: match.entity.type,
    matchType: match.matchType,
    matchedAlias: match.matchedAlias,
    score: match.score,
    reasons: match.reasons,
  };
}

export function explainRetrieval(results: readonly RetrievalResultGroup[]) {
  return results.map((result) => ({
    entityId: result.entity.id,
    canonicalName: result.entity.canonicalName,
    score: result.score,
    status: result.status,
    reasons: result.whyMatched,
    facts: result.facts.map((fact) => ({
      id: fact.id,
      predicate: fact.predicate,
      status: fact.status,
      evidenceCount: fact.evidence.length,
    })),
  }));
}
