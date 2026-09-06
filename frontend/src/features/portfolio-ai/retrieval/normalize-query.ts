import type {
  NormalizedQuery,
  RetrievalLocale,
} from "@/features/portfolio-ai/retrieval/retrieval.types";
import { RETRIEVAL_MAX_QUERY_LENGTH } from "@/features/portfolio-ai/retrieval/retrieval.types";

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;
const VALID_LOCALES = new Set<RetrievalLocale>(["fr", "en"]);

const QUERY_SYNONYMS: ReadonlyArray<[RegExp, string]> = [
  [/\ba t il\b/g, "a-t-il"],
  [/\best ce qu il\b/g, "est-ce qu'il"],
  [/\bworked with\b/g, "used"],
  [/\btravaille avec\b/g, "utilise"],
  [/\btravaille sur\b/g, "utilise"],
  [/\bconnait\b/g, "utilise"],
  [/\bconnaît\b/g, "utilise"],
  [/\butilisé\b/g, "utilise"],
  [/\bused\b/g, "utilise"],
  [/\buses\b/g, "utilise"],
  [/\bprojects\b/g, "projets"],
];

function stripAccents(value: string) {
  return value.normalize("NFD").replace(DIACRITICS_PATTERN, "");
}

export function normalizeQuery(
  rawQuery: string,
  locale: RetrievalLocale = "fr",
): { query?: NormalizedQuery; errors: string[] } {
  const errors: string[] = [];

  if (!VALID_LOCALES.has(locale)) {
    errors.push(`Unsupported locale "${locale}".`);
  }

  const trimmedQuery = rawQuery.trim();

  if (!trimmedQuery) {
    errors.push("Query cannot be empty.");
  }

  if (trimmedQuery.length > RETRIEVAL_MAX_QUERY_LENGTH) {
    errors.push(
      `Query cannot exceed ${RETRIEVAL_MAX_QUERY_LENGTH} characters.`,
    );
  }

  if (errors.length > 0) {
    return { errors };
  }

  const withoutAccents = stripAccents(trimmedQuery).toLowerCase();
  const punctuationNormalized = withoutAccents
    .replace(/['’]/g, " ")
    .replace(/[?!.:,;()[\]{}"“”]/g, " ")
    .replace(/[/-]+/g, " ");
  const normalized = QUERY_SYNONYMS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    punctuationNormalized,
  )
    .replace(/\s+/g, " ")
    .trim();

  return {
    errors: [],
    query: {
      original: rawQuery,
      normalized,
      tokens: normalized.split(" ").filter(Boolean),
      locale,
    },
  };
}
