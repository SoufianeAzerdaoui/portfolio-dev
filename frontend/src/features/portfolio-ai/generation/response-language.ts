import type { LocaleCode } from "@/types/portfolio";

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;

const ENGLISH_PATTERNS = [
  /\bhello\b/,
  /\bhi\b/,
  /\bhey\b/,
  /\bwhat\b/,
  /\bwhich\b/,
  /\bwho\b/,
  /\bwhere\b/,
  /\bwhen\b/,
  /\bwhy\b/,
  /\bhow\b/,
  /\btell\b/,
  /\bhas\b/,
  /\bhave\b/,
  /\bdoes\b/,
  /\bdid\b/,
  /\bdo\b/,
  /\bis\b/,
  /\bare\b/,
  /\bused?\b/,
  /\buses\b/,
  /\bprojects?\b/,
  /\bskills?\b/,
  /\bexperience\b/,
  /\beducation\b/,
  /\bcurrent\b/,
  /\bprogram\b/,
  /\band\b/,
];

const FRENCH_PATTERNS = [
  /\bbonjour\b/,
  /\bsalut\b/,
  /\bquel\b/,
  /\bquelle\b/,
  /\bquels\b/,
  /\bquelles\b/,
  /\bqui\b/,
  /\bou\b/,
  /\bquand\b/,
  /\bpourquoi\b/,
  /\bcomment\b/,
  /\ba t il\b/,
  /\best ce\b/,
  /\best il\b/,
  /\butilise\b/,
  /\butilises\b/,
  /\butilisee\b/,
  /\butilisees\b/,
  /\bprojet\b/,
  /\bprojets\b/,
  /\bcompetences\b/,
  /\bformation\b/,
  /\bparcours\b/,
  /\bexperience\b/,
  /\bactuel\b/,
  /\bactuellement\b/,
  /\bmaster\b/,
  /\bet\b/,
];

const ENGLISH_GREETINGS = new Set(["hello", "hi", "hey"]);
const FRENCH_GREETINGS = new Set(["bonjour", "salut"]);

function normalizeLanguageText(value: string) {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function scoreLanguage(normalized: string, patterns: readonly RegExp[]) {
  return patterns.reduce(
    (score, pattern) => score + (pattern.test(normalized) ? 1 : 0),
    0,
  );
}

export function detectPortfolioAIResponseLanguage(
  message: string,
  fallback: LocaleCode,
): LocaleCode {
  const normalized = normalizeLanguageText(message);
  const englishScore = scoreLanguage(normalized, ENGLISH_PATTERNS);
  const frenchScore = scoreLanguage(normalized, FRENCH_PATTERNS);

  if (englishScore > frenchScore) {
    return "en";
  }

  if (frenchScore > englishScore) {
    return "fr";
  }

  return fallback;
}

export function isPortfolioAIGreeting(message: string) {
  const normalized = normalizeLanguageText(message);

  return ENGLISH_GREETINGS.has(normalized) || FRENCH_GREETINGS.has(normalized);
}
