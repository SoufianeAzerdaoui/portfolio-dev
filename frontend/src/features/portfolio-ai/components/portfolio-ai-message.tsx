"use client";

import { AlertCircle } from "lucide-react";

import { getPortfolioAIErrorDisplayMessage } from "@/features/portfolio-ai/client/display";
import type { PortfolioAIConversationMessage } from "@/features/portfolio-ai/client/conversation-state";
import type { PortfolioAIConsoleContent } from "@/types/portfolio";
import { PortfolioAISources } from "@/features/portfolio-ai/components/portfolio-ai-sources";

function renderParagraphs(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return null;
  }

  return paragraphs.map((paragraph) => (
    <p key={paragraph} className="whitespace-pre-wrap">
      {paragraph}
    </p>
  ));
}

type PortfolioAIMessageProps = {
  content: PortfolioAIConsoleContent;
  message: PortfolioAIConversationMessage;
  processing: boolean;
  onRetry: () => void;
};

export function PortfolioAIMessage({
  content,
  message,
  processing,
  onRetry,
}: PortfolioAIMessageProps) {
  const isUser = message.role === "user";
  const label = isUser ? content.userLabel : content.assistantLabel;
  const hasError = message.role === "assistant" && message.status === "error";

  return (
    <article
      className={[
        "grid gap-3 border-b border-[var(--home-line-muted)] py-6 last:border-b-0",
        isUser
          ? "md:grid-cols-[5.5rem_minmax(0,36rem)]"
          : "md:grid-cols-[8rem_minmax(0,1fr)]",
      ].join(" ")}
    >
      <p className="font-mono text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[#9B9AA4]">
        {label}
      </p>

      <div className="min-w-0">
        {hasError && message.error ? (
          <div className="max-w-[38rem] border-l border-[rgba(139,128,217,0.42)] pl-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#8B80D9]"
              />
              <p className="text-[0.9rem] leading-6 text-[var(--home-text-secondary)]">
                {getPortfolioAIErrorDisplayMessage(content, message.error)}
              </p>
            </div>
            {message.error.retryable ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex min-h-8 items-center border-b border-[rgba(139,128,217,0.36)] text-[0.78rem] font-medium text-[var(--home-text-secondary)] transition duration-150 hover:border-[#8B80D9] hover:text-[var(--home-text)] focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-4 focus-visible:ring-offset-[#17161C] motion-reduce:transition-none"
              >
                {content.retry}
              </button>
            ) : null}
          </div>
        ) : null}

        {!hasError && message.content ? (
          <div
            className={[
              "max-w-[42rem] text-[0.98rem] leading-[1.72] text-[#B9B6C6]",
              isUser ? "font-medium text-[var(--home-text)]" : "",
            ].join(" ")}
          >
            {renderParagraphs(message.content)}
          </div>
        ) : null}

        {!hasError && !message.content && processing ? (
          <div className="max-w-[22rem]">
            <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.22em] text-[var(--home-muted)]">
              {content.processing}
            </p>
            <div
              aria-hidden="true"
              className="mt-3 h-px overflow-hidden bg-[var(--home-line-muted)]"
            >
              <span className="portfolio-ai-activity-line block h-px w-1/3 bg-[rgba(139,128,217,0.62)]" />
            </div>
          </div>
        ) : null}

        {!isUser && message.sources ? (
          <PortfolioAISources content={content} sources={message.sources} />
        ) : null}
      </div>
    </article>
  );
}
