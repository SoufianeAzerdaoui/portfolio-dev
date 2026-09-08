"use client";

import { ArrowRight } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";

import { PORTFOLIO_AI_CLIENT_MAX_MESSAGE_LENGTH } from "@/features/portfolio-ai/client/portfolio-ai-client";
import type { PortfolioAIConsoleContent } from "@/types/portfolio";

type PortfolioAIComposerProps = {
  content: PortfolioAIConsoleContent;
  value: string;
  disabled: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function PortfolioAIComposer({
  content,
  value,
  disabled,
  inputRef,
  onChange,
  onSubmit,
}: PortfolioAIComposerProps) {
  const trimmedValue = value.trim();
  const remainingCharacters = PORTFOLIO_AI_CLIENT_MAX_MESSAGE_LENGTH - value.length;
  const showCounter = remainingCharacters <= 180;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="shrink-0 border-t border-[var(--home-line-muted)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-[52rem] items-end gap-3">
        <label className="sr-only" htmlFor="portfolio-ai-composer">
          {content.inputPlaceholder}
        </label>
        <textarea
          ref={inputRef}
          id="portfolio-ai-composer"
          value={value}
          maxLength={PORTFOLIO_AI_CLIENT_MAX_MESSAGE_LENGTH}
          rows={1}
          disabled={disabled}
          placeholder={content.inputPlaceholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[3.25rem] max-h-[8.5rem] min-w-0 flex-1 resize-none rounded-[8px] border border-[rgba(180,177,194,0.1)] bg-[rgba(23,22,28,0.5)] px-4 py-3 text-[0.92rem] leading-6 text-[var(--home-text)] outline-none transition duration-150 placeholder:text-[var(--home-muted)] focus:border-[rgba(139,128,217,0.48)] focus:bg-[rgba(23,22,28,0.72)] focus:shadow-[0_0_0_3px_rgba(97,85,185,0.09)] disabled:cursor-not-allowed disabled:opacity-65 motion-reduce:transition-none"
        />
        <button
          type="submit"
          disabled={disabled || !trimmedValue}
          aria-label={content.send}
          className="inline-grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-[8px] border border-[var(--home-button-primary-border)] bg-[var(--home-button-primary-bg)] text-[#F8F7FB] shadow-[var(--home-button-primary-shadow)] transition duration-150 hover:-translate-y-px hover:bg-[var(--home-button-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17161C] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 motion-reduce:transition-none"
        >
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {showCounter ? (
        <p className="mx-auto mt-2 w-full max-w-[52rem] text-right font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--home-muted)]">
          {remainingCharacters} {content.remainingCharacters}
        </p>
      ) : null}
    </form>
  );
}
