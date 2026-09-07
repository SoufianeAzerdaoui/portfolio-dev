import {
  getKnowledgeBase,
  type KnowledgeEntity,
} from "@/features/portfolio-ai/knowledge";
import { normalizeAlias } from "@/features/portfolio-ai/knowledge/build-aliases";
import type {
  DetectedEntity,
  EntityMatchType,
  NormalizedQuery,
} from "@/features/portfolio-ai/retrieval/retrieval.types";

const GENERIC_TERMS = new Set([
  "ai",
  "ia",
  "ml",
  "data",
  "projet",
  "projets",
  "project",
  "projects",
  "system",
  "platform",
  "analysis",
  "analytics",
  "engineering",
  "final",
  "full",
  "internship",
  "master",
  "stack",
  "stage",
]);

const MATCH_SCORES: Record<EntityMatchType, number> = {
  "exact-canonical": 100,
  "exact-alias": 90,
  "normalized-canonical": 80,
  "normalized-alias": 76,
  "strong-token": 44,
  "retrieval-only": 22,
  "derived-category-domain": 34,
};

type RetrievalTerm = {
  term: string;
};

function isRetrievalTerm(value: unknown): value is RetrievalTerm {
  return (
    typeof value === "object" &&
    value !== null &&
    "term" in value &&
    typeof value.term === "string"
  );
}

function getRetrievalTerms(entity: KnowledgeEntity) {
  const terms = entity.metadata?.retrievalTerms;

  if (!Array.isArray(terms)) {
    return [];
  }

  return terms.filter(isRetrievalTerm).map((term) => term.term);
}

function isGenericAlias(alias: string) {
  const normalizedAlias = normalizeAlias(alias);

  return (
    GENERIC_TERMS.has(normalizedAlias) ||
    (normalizedAlias.length <= 3 && !/^[a-z0-9.+#-]{2,}$/i.test(alias))
  );
}

function queryContainsPhrase(query: NormalizedQuery, phrase: string) {
  const normalizedPhrase = normalizeAlias(phrase);

  if (!normalizedPhrase || isGenericAlias(phrase)) {
    return false;
  }

  return ` ${query.normalized} `.includes(` ${normalizedPhrase} `);
}

function tokenOverlapScore(query: NormalizedQuery, entity: KnowledgeEntity) {
  const candidateText = normalizeAlias(
    [entity.canonicalName, ...entity.aliases].join(" "),
  );
  const candidateTokens = new Set(
    candidateText
      .split(" ")
      .filter((token) => token.length >= 4 && !GENERIC_TERMS.has(token)),
  );
  const matchedTokens = query.tokens.filter((token) =>
    candidateTokens.has(token),
  );

  if (matchedTokens.length === 0) {
    return undefined;
  }

  return {
    matchedAlias: matchedTokens.join(" "),
    score: MATCH_SCORES["strong-token"] + matchedTokens.length * 4,
  };
}

function bestMatchForEntity(
  query: NormalizedQuery,
  entity: KnowledgeEntity,
): DetectedEntity | undefined {
  if (
    query.original.trim() === entity.canonicalName ||
    query.normalized === normalizeAlias(entity.canonicalName)
  ) {
    return {
      entity,
      matchType: "exact-canonical",
      matchedAlias: entity.canonicalName,
      score: MATCH_SCORES["exact-canonical"],
      reasons: [`exact canonical match: ${entity.canonicalName}`],
    };
  }

  const exactAlias = entity.aliases.find(
    (alias) => query.original.trim() === alias && !isGenericAlias(alias),
  );

  if (exactAlias) {
    return {
      entity,
      matchType: "exact-alias",
      matchedAlias: exactAlias,
      score: MATCH_SCORES["exact-alias"],
      reasons: [`exact alias match: ${exactAlias}`],
    };
  }

  if (queryContainsPhrase(query, entity.canonicalName)) {
    return {
      entity,
      matchType: "normalized-canonical",
      matchedAlias: entity.canonicalName,
      score: MATCH_SCORES["normalized-canonical"],
      reasons: [`normalized canonical match: ${entity.canonicalName}`],
    };
  }

  const retrievalOnlyAlias = getRetrievalTerms(entity).find((term) =>
    queryContainsPhrase(query, term),
  );

  if (retrievalOnlyAlias) {
    return {
      entity,
      matchType: "retrieval-only",
      matchedAlias: retrievalOnlyAlias,
      score: MATCH_SCORES["retrieval-only"],
      reasons: [`retrieval-only term matched: ${retrievalOnlyAlias}`],
    };
  }

  const normalizedAlias = entity.aliases.find((alias) =>
    queryContainsPhrase(query, alias),
  );

  if (normalizedAlias) {
    const matchType =
      entity.type === "skill" || entity.type === "domain"
        ? "derived-category-domain"
        : "normalized-alias";

    return {
      entity,
      matchType,
      matchedAlias: normalizedAlias,
      score: MATCH_SCORES[matchType],
      reasons: [`${matchType} match: ${normalizedAlias}`],
    };
  }

  const tokenMatch = tokenOverlapScore(query, entity);

  if (!tokenMatch) {
    return undefined;
  }

  return {
    entity,
    matchType: "strong-token",
    matchedAlias: tokenMatch.matchedAlias,
    score: tokenMatch.score,
    reasons: [`strong token match: ${tokenMatch.matchedAlias}`],
  };
}

export function detectEntities(query: NormalizedQuery): DetectedEntity[] {
  const bestMatches = getKnowledgeBase()
    .entities.map((entity) => bestMatchForEntity(query, entity))
    .filter((match): match is DetectedEntity => Boolean(match));

  return bestMatches
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.entity.id.localeCompare(right.entity.id);
    })
    .slice(0, 12);
}
