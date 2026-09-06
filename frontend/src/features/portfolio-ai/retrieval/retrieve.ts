import "server-only";

import { detectEntities } from "@/features/portfolio-ai/retrieval/detect-entities";
import { detectIntent } from "@/features/portfolio-ai/retrieval/detect-intent";
import { generateCandidates } from "@/features/portfolio-ai/retrieval/candidate-generator";
import { normalizeQuery } from "@/features/portfolio-ai/retrieval/normalize-query";
import { rankCandidates } from "@/features/portfolio-ai/retrieval/rank-candidates";
import type {
  PortfolioRetrievalResult,
  RetrievalOptions,
} from "@/features/portfolio-ai/retrieval/retrieval.types";
import {
  DEFAULT_RETRIEVAL_TOP_K,
  MAX_RETRIEVAL_TOP_K,
} from "@/features/portfolio-ai/retrieval/retrieval.types";

function normalizeTopK(topK: number | undefined) {
  if (topK === undefined) {
    return DEFAULT_RETRIEVAL_TOP_K;
  }

  if (!Number.isInteger(topK) || topK < 1 || topK > MAX_RETRIEVAL_TOP_K) {
    return undefined;
  }

  return topK;
}

export function retrievePortfolioKnowledge(
  rawQuery: string,
  options: RetrievalOptions = {},
): PortfolioRetrievalResult {
  const topK = normalizeTopK(options.topK);
  const errors: string[] = [];

  if (topK === undefined) {
    errors.push(
      `topK must be an integer between 1 and ${MAX_RETRIEVAL_TOP_K}.`,
    );
  }

  const normalized = normalizeQuery(rawQuery, options.locale ?? "fr");

  if (normalized.errors.length > 0 || topK === undefined || !normalized.query) {
    return {
      intent: "unknown",
      normalizedQuery: "",
      originalQuery: rawQuery,
      matchedEntities: [],
      results: [],
      confidence: 0,
      status: "not-documented",
      notDocumented: true,
      errors: [...errors, ...normalized.errors],
    };
  }

  const matchedEntities = detectEntities(normalized.query);
  const intent = detectIntent(normalized.query, matchedEntities);
  const candidates = generateCandidates(intent, matchedEntities);
  const results = rankCandidates(candidates, topK);

  return {
    intent: intent.intent,
    normalizedQuery: normalized.query.normalized,
    originalQuery: normalized.query.original,
    matchedEntities,
    results,
    confidence:
      results.length > 0
        ? Math.min(1, intent.confidence + results[0].score / 1000)
        : intent.confidence,
    status: results[0]?.status ?? "not-documented",
    notDocumented: results.length === 0,
    errors,
  };
}
