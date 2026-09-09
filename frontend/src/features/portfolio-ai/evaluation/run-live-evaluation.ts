import "server-only";

import {
  buildGroundedContext,
  DEFAULT_PORTFOLIO_AI_MODEL,
  getAllowedEvidenceIds,
  generatePortfolioAnswer,
  GenerationConfigurationError,
} from "@/features/portfolio-ai/generation";
import {
  type PortfolioAIEvaluationCase,
  portfolioAIEvaluationDataset,
} from "@/features/portfolio-ai/evaluation/evaluation.dataset";
import { retrievePortfolioKnowledge } from "@/features/portfolio-ai/retrieval";

type EvaluationRow = {
  id: string;
  category: string;
  retrievalStatus: string;
  groundingValid: boolean;
  languageCorrect: boolean;
  evidenceIdsValid: boolean;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  retryCount: number;
  providerCalled: boolean;
  answerLength: number;
  opening: string;
  scores: {
    factuality: 0 | 1 | 2;
    directness: 0 | 1 | 2;
    style: 0 | 1 | 2;
    grounding: 0 | 1 | 2;
    language: 0 | 1;
  };
  error?: string;
};

const TEMPLATE_OPENERS = [
  "selon le portfolio",
  "en résumé",
  "voici",
  "il possède",
  "according to the portfolio",
  "in summary",
  "here are",
];

const CONFIRMATION_PATTERNS = [
  /\boui\b/i,
  /\byes\b/i,
  /\bconfirm[eé]\b/i,
  /\bconfirmed\b/i,
  /\butilis[eé]\b/i,
  /\bused\b/i,
  /\bma[iî]trise\b/i,
  /\bmasters\b/i,
  /\bexpert\b/i,
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(values: readonly number[], p: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );

  return sorted[index] ?? 0;
}

function opening(answer: string) {
  return answer.trim().split(/\s+/).slice(0, 5).join(" ");
}

function likelyFrench(answer: string) {
  return /\b(le|la|les|un|une|des|est|dans|son|ses|pas|document[eé]e?)\b/i.test(
    answer,
  );
}

function likelyEnglish(answer: string) {
  return /\b(the|is|are|his|not|documented|project|projects|used)\b/i.test(
    answer,
  );
}

function languageCorrect(answer: string, expectedLanguage: "fr" | "en") {
  return expectedLanguage === "fr" ? likelyFrench(answer) : likelyEnglish(answer);
}

function hasUnsupportedConfirmation(
  answer: string,
  terms: readonly string[] | undefined,
) {
  if (!terms || terms.length === 0) {
    return false;
  }

  const lowerAnswer = answer.toLowerCase();

  return terms.some((term) => {
    if (!lowerAnswer.includes(term.toLowerCase())) {
      return false;
    }

    return CONFIRMATION_PATTERNS.some((pattern) => pattern.test(answer));
  });
}

function scoreAnswer(params: {
  answer: string;
  expectedLanguage: "fr" | "en";
  groundingValid: boolean;
  evidenceIdsValid: boolean;
  uncertainty: string;
  expectedUncertainty?: string;
  forbiddenConfirmedTerms?: readonly string[];
}): EvaluationRow["scores"] {
  const factuality: 0 | 1 | 2 =
    params.expectedUncertainty &&
    params.uncertainty !== params.expectedUncertainty
      ? 0
      : hasUnsupportedConfirmation(params.answer, params.forbiddenConfirmedTerms)
        ? 0
        : 2;
  const directness: 0 | 1 | 2 =
    params.answer.length <= 900 ? 2 : params.answer.length <= 1400 ? 1 : 0;
  const style: 0 | 1 | 2 = TEMPLATE_OPENERS.some((phrase) =>
    params.answer.toLowerCase().startsWith(phrase),
  )
    ? 1
    : 2;
  const grounding: 0 | 1 | 2 =
    params.groundingValid && params.evidenceIdsValid
      ? factuality === 0
        ? 0
        : 2
      : 0;
  const language: 0 | 1 = languageCorrect(params.answer, params.expectedLanguage)
    ? 1
    : 0;

  return { factuality, directness, style, grounding, language };
}

async function evaluateCase(
  item: PortfolioAIEvaluationCase,
): Promise<EvaluationRow> {
  const retrieval = retrievePortfolioKnowledge(item.question, {
    locale: item.locale,
    topK: 5,
  });
  const context = buildGroundedContext({
    question: item.question,
    locale: item.locale,
    retrieval,
  });
  const allowedEvidenceIds = new Set(getAllowedEvidenceIds(context));
  const startedAt = Date.now();

  try {
    const result = await generatePortfolioAnswer({
      question: item.question,
      locale: item.locale,
      retrieval,
    });
    const answer = result.answer.answer;
    const evidenceIdsValid = result.answer.usedEvidenceIds.every((id) =>
      allowedEvidenceIds.has(id),
    );
    const groundingValid = evidenceIdsValid;
    const scores = scoreAnswer({
      answer,
      expectedLanguage: item.expectedLanguage,
      groundingValid,
      evidenceIdsValid,
      uncertainty: result.answer.uncertainty,
      expectedUncertainty: item.expectedUncertainty,
      forbiddenConfirmedTerms: item.forbiddenConfirmedTerms,
    });

    return {
      id: item.id,
      category: item.category,
      retrievalStatus: retrieval.status,
      groundingValid,
      languageCorrect: scores.language === 1,
      evidenceIdsValid,
      latencyMs: result.metadata.latencyMs || Date.now() - startedAt,
      inputTokens: result.metadata.usage?.promptTokenCount,
      outputTokens: result.metadata.usage?.candidatesTokenCount,
      totalTokens: result.metadata.usage?.totalTokenCount,
      retryCount: result.metadata.retryCount,
      providerCalled: result.metadata.providerCalled,
      answerLength: answer.length,
      opening: opening(answer),
      scores,
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";

    return {
      id: item.id,
      category: item.category,
      retrievalStatus: retrieval.status,
      groundingValid: false,
      languageCorrect: false,
      evidenceIdsValid: false,
      latencyMs: Date.now() - startedAt,
      retryCount: 0,
      providerCalled: !retrieval.notDocumented,
      answerLength: 0,
      opening: "",
      scores: {
        factuality: 0,
        directness: 0,
        style: 0,
        grounding: 0,
        language: 0,
      },
      error: errorName,
    };
  }
}

export async function runLivePortfolioAIEvaluation() {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return {
      blocked: true,
      message: "LIVE EVAL BLOCKED - GEMINI_API_KEY unavailable.",
    };
  }

  const rows: EvaluationRow[] = [];

  for (const item of portfolioAIEvaluationDataset) {
    const row = await evaluateCase(item);
    rows.push(row);

    if (row.error === GenerationConfigurationError.name) {
      break;
    }

    await sleep(700);
  }

  const latencies = rows.map((row) => row.latencyMs);
  const openingCounts = rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.opening] = (counts[row.opening] ?? 0) + 1;
    return counts;
  }, {});

  return {
    blocked: false,
    model: process.env.PORTFOLIO_AI_MODEL ?? DEFAULT_PORTFOLIO_AI_MODEL,
    totalQueries: rows.length,
    successfulQueries: rows.filter((row) => !row.error).length,
    failedQueries: rows.filter((row) => row.error).length,
    retries: rows.reduce((total, row) => total + row.retryCount, 0),
    rateLimitEvents: rows.filter((row) => row.error === "GenerationRateLimitError")
      .length,
    scores: {
      factuality: rows.reduce((total, row) => total + row.scores.factuality, 0),
      directness: rows.reduce((total, row) => total + row.scores.directness, 0),
      style: rows.reduce((total, row) => total + row.scores.style, 0),
      grounding: rows.reduce((total, row) => total + row.scores.grounding, 0),
      language: rows.reduce((total, row) => total + row.scores.language, 0),
    },
    maxScores: {
      factuality: rows.length * 2,
      directness: rows.length * 2,
      style: rows.length * 2,
      grounding: rows.length * 2,
      language: rows.length,
    },
    answerLengthAverage: Math.round(
      rows.reduce((total, row) => total + row.answerLength, 0) / rows.length,
    ),
    latency: {
      min: Math.min(...latencies),
      median: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      max: Math.max(...latencies),
    },
    tokens: {
      input: rows.reduce((total, row) => total + (row.inputTokens ?? 0), 0),
      output: rows.reduce((total, row) => total + (row.outputTokens ?? 0), 0),
      total: rows.reduce((total, row) => total + (row.totalTokens ?? 0), 0),
    },
    repeatedOpenings: Object.entries(openingCounts)
      .filter(([, count]) => count >= 3)
      .map(([phrase, count]) => ({ phrase, count })),
    rows,
  };
}

if (require.main === module) {
  runLivePortfolioAIEvaluation()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.name : "UnknownError";
      console.error(`Live Portfolio AI evaluation failed: ${message}`);
      process.exitCode = 1;
    });
}
