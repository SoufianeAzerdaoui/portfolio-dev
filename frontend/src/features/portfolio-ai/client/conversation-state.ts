import type { LocaleCode } from "@/types/portfolio";
import {
  PORTFOLIO_AI_CLIENT_MAX_HISTORY_MESSAGES,
  PORTFOLIO_AI_CLIENT_MAX_HISTORY_MESSAGE_LENGTH,
  PORTFOLIO_AI_CLIENT_MAX_HISTORY_TOTAL_LENGTH,
  type PortfolioAIClientErrorPayload,
  type PortfolioAIHistoryMessage,
  type PublicPortfolioAISource,
} from "@/features/portfolio-ai/client/portfolio-ai-client";

export type PortfolioAIConversationStatus =
  | "idle"
  | "submitting"
  | "streaming"
  | "success"
  | "error";

export type PortfolioAIMessageStatus =
  | "pending"
  | "streaming"
  | "success"
  | "error";

export type PortfolioAIConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: PortfolioAIMessageStatus;
  sources?: PublicPortfolioAISource[];
  requestId?: string;
  uncertainty?: string;
  language?: LocaleCode;
  error?: PortfolioAIClientErrorPayload;
};

export function isPortfolioAIRequestActive(
  status: PortfolioAIConversationStatus,
) {
  return status === "submitting" || status === "streaming";
}

export function createPortfolioAIMessageId(role: "user" | "assistant") {
  return `pai_${role}_${crypto.randomUUID()}`;
}

export function buildBoundedPortfolioAIHistory(
  messages: readonly PortfolioAIConversationMessage[],
): PortfolioAIHistoryMessage[] {
  const candidates = messages
    .filter((message) => {
      return (
        message.status === "success" &&
        (message.role === "user" || message.role === "assistant") &&
        message.content.trim().length > 0
      );
    })
    .map((message) => ({
      role: message.role,
      content: message.content
        .trim()
        .slice(0, PORTFOLIO_AI_CLIENT_MAX_HISTORY_MESSAGE_LENGTH),
    }));
  const selected: PortfolioAIHistoryMessage[] = [];
  let totalLength = 0;

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    if (selected.length >= PORTFOLIO_AI_CLIENT_MAX_HISTORY_MESSAGES) {
      break;
    }

    const candidate = candidates[index];

    if (!candidate) {
      continue;
    }

    if (
      totalLength + candidate.content.length >
      PORTFOLIO_AI_CLIENT_MAX_HISTORY_TOTAL_LENGTH
    ) {
      continue;
    }

    selected.unshift(candidate);
    totalLength += candidate.content.length;
  }

  return selected;
}

export function appendPortfolioAIAssistantDelta(
  messages: readonly PortfolioAIConversationMessage[],
  assistantMessageId: string,
  text: string,
): PortfolioAIConversationMessage[] {
  return messages.map((message) =>
    message.id === assistantMessageId
      ? {
          ...message,
          content: `${message.content}${text}`,
          status: "streaming",
        }
      : message,
  );
}

export function updatePortfolioAIAssistantMessage(
  messages: readonly PortfolioAIConversationMessage[],
  assistantMessageId: string,
  update: Partial<PortfolioAIConversationMessage>,
): PortfolioAIConversationMessage[] {
  return messages.map((message) =>
    message.id === assistantMessageId
      ? {
          ...message,
          ...update,
        }
      : message,
  );
}
