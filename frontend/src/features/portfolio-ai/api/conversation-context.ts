import "server-only";

import type { ConversationContextMessage } from "@/features/portfolio-ai/generation";
import { retrievePortfolioKnowledge } from "@/features/portfolio-ai/retrieval";
import type {
  PortfolioRetrievalResult,
  RetrievalLocale,
} from "@/features/portfolio-ai/retrieval";

export const PORTFOLIO_AI_MAX_HISTORY_MESSAGES = 6;
export const PORTFOLIO_AI_MAX_HISTORY_MESSAGE_LENGTH = 1_500;
export const PORTFOLIO_AI_MAX_HISTORY_TOTAL_LENGTH = 6_000;

export type ConversationContext = {
  messages: ConversationContextMessage[];
  retrievalQuery: string;
  contextualized: boolean;
  historyMessageCount: number;
};

const FOLLOW_UP_PATTERNS = [
  /\bet lequel\b/i,
  /\bet celle-là\b/i,
  /\bet celui-là\b/i,
  /\bdans ce projet\b/i,
  /\bet son rôle\b/i,
  /\bet l'autre\b/i,
  /\bparmi eux\b/i,
  /\bwhich one\b/i,
  /\bwhat about\b/i,
  /\bin that project\b/i,
  /\band the other one\b/i,
  /\bwhat was his role\b/i,
  /\bamong those\b/i,
];

const CONTEXT_STOP_ENTITY_TYPES = new Set(["person"]);

function unique(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function isReferentialFollowUp(message: string) {
  return FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(message));
}

function entityTermsFromRetrieval(retrieval: PortfolioRetrievalResult) {
  return unique([
    ...retrieval.matchedEntities
      .filter((match) => !CONTEXT_STOP_ENTITY_TYPES.has(match.entity.type))
      .map((match) => match.entity.canonicalName),
    ...retrieval.results
      .filter((result) => !CONTEXT_STOP_ENTITY_TYPES.has(result.entity.type))
      .map((result) => result.entity.canonicalName),
  ]);
}

function recentHistoryTerms(
  messages: readonly ConversationContextMessage[],
  locale: RetrievalLocale,
) {
  return unique(
    messages
      .slice(-PORTFOLIO_AI_MAX_HISTORY_MESSAGES)
      .flatMap((message) =>
        entityTermsFromRetrieval(
          retrievePortfolioKnowledge(message.content, {
            locale,
            topK: 3,
          }),
        ),
      ),
  ).slice(0, 6);
}

export function buildConversationContext(
  message: string,
  locale: RetrievalLocale,
  history: readonly ConversationContextMessage[] = [],
): ConversationContext {
  if (history.length === 0) {
    return {
      messages: [],
      retrievalQuery: message,
      contextualized: false,
      historyMessageCount: 0,
    };
  }

  const shouldContextualize = isReferentialFollowUp(message);
  const terms = shouldContextualize ? recentHistoryTerms(history, locale) : [];

  if (terms.length === 0) {
    return {
      messages: [...history],
      retrievalQuery: message,
      contextualized: false,
      historyMessageCount: history.length,
    };
  }

  return {
    messages: [...history],
    retrievalQuery: `${message} ${terms.join(" ")}`,
    contextualized: true,
    historyMessageCount: history.length,
  };
}
