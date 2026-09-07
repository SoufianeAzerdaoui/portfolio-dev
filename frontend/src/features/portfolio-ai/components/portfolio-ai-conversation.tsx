"use client";

import { useEffect, useRef } from "react";

import type {
  PortfolioAIConversationMessage,
  PortfolioAIConversationStatus,
} from "@/features/portfolio-ai/client/conversation-state";
import type { PortfolioAIConsoleContent } from "@/types/portfolio";
import { PortfolioAIEmptyState } from "@/features/portfolio-ai/components/portfolio-ai-empty-state";
import { PortfolioAIMessage } from "@/features/portfolio-ai/components/portfolio-ai-message";

type PortfolioAIConversationProps = {
  content: PortfolioAIConsoleContent;
  messages: PortfolioAIConversationMessage[];
  status: PortfolioAIConversationStatus;
  isActive: boolean;
  onSuggestion: (question: string) => void;
  onRetry: () => void;
};

function isNearBottom(element: HTMLElement) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < 96;
}

export function PortfolioAIConversation({
  content,
  messages,
  status,
  isActive,
  onSuggestion,
  onRetry,
}: PortfolioAIConversationProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element || !stickToBottomRef.current) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [messages, status]);

  if (messages.length === 0) {
    return (
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]"
      >
        <PortfolioAIEmptyState
          content={content}
          disabled={isActive}
          onSuggestion={onSuggestion}
        />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        stickToBottomRef.current = isNearBottom(event.currentTarget);
      }}
      className="min-h-0 flex-1 overflow-y-auto px-5 [scrollbar-width:thin] sm:px-6"
    >
      <div className="mx-auto w-full max-w-[52rem] py-4 sm:py-6">
        {messages.map((message) => (
          <PortfolioAIMessage
            key={message.id}
            content={content}
            message={message}
            processing={message.role === "assistant" && message.status === "pending"}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  );
}
