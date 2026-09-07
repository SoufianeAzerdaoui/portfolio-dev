import type {
  RetrievalCandidate,
  RetrievalResultGroup,
} from "@/features/portfolio-ai/retrieval/retrieval.types";

function uniqueByStableKey<T>(
  items: readonly T[],
  key: (item: T) => string,
) {
  return [...new Map(items.map((item) => [key(item), item])).values()];
}

function limitFacts(candidate: RetrievalCandidate) {
  if (candidate.facts.length <= 12) {
    return candidate.facts;
  }

  return [
    ...candidate.facts.filter((fact) => fact.status === "verified").slice(0, 9),
    ...candidate.facts.filter((fact) => fact.status !== "verified").slice(0, 2),
  ];
}

export function rankCandidates(
  candidates: readonly RetrievalCandidate[],
  topK: number,
): RetrievalResultGroup[] {
  return [...candidates]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.entity.id.localeCompare(right.entity.id);
    })
    .slice(0, topK)
    .map((candidate) => ({
      entity: candidate.entity,
      score: candidate.score,
      status: candidate.status,
      facts: uniqueByStableKey(limitFacts(candidate), (fact) => fact.id),
      relations: uniqueByStableKey(
        candidate.relations,
        (relation) => relation.id,
      ),
      evidence: uniqueByStableKey(
        candidate.evidence,
        (evidence) =>
          `${evidence.sourceType}:${evidence.sourceId}:${evidence.field ?? ""}:${
            evidence.strength
          }`,
      ),
      whyMatched: [...new Set(candidate.reasons)],
      matchedEntities: candidate.matchedEntities.map((match) => ({
        entityId: match.entity.id,
        canonicalName: match.entity.canonicalName,
        matchType: match.matchType,
        matchedAlias: match.matchedAlias,
        score: match.score,
      })),
    }));
}
