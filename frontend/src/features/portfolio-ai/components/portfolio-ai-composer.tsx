"use client";

import { useEffect } from "react";
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
  const resizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    resizeTextarea(inputRef.current);
  }, [inputRef, value]);

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
        <div className="group/composer relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-3.5 font-mono text-[1rem] leading-6 text-[var(--home-muted)] transition-colors duration-150 group-focus-within/composer:text-[#8B80D9] motion-reduce:transition-none">
            ›
          </span>
          <textarea
            ref={inputRef}
            id="portfolio-ai-composer"
            value={value}
            maxLength={PORTFOLIO_AI_CLIENT_MAX_MESSAGE_LENGTH}
            rows={1}
            disabled={disabled}
            placeholder={content.inputPlaceholder}
            onChange={(event) => {
              onChange(event.target.value);
              resizeTextarea(event.currentTarget);
            }}
            onKeyDown={handleKeyDown}
            className="min-h-[3.25rem] max-h-[8.5rem] w-full min-w-0 resize-none rounded-[8px] border border-[rgba(180,177,194,0.1)] bg-[rgba(32,33,38,0.42)] py-3 pl-8 pr-4 text-[0.92rem] leading-6 text-[var(--home-text)] outline-none transition-[background-color,border-color] duration-150 placeholder:text-[var(--home-muted)] focus:border-[rgba(139,128,217,0.42)] focus:bg-[rgba(32,33,38,0.58)] disabled:cursor-not-allowed disabled:opacity-65 motion-reduce:transition-none"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !trimmedValue}
          aria-label={content.send}
          className="inline-grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-[8px] border border-[rgba(139,128,217,0.34)] bg-[rgba(32,33,38,0.62)] font-mono text-[1.12rem] leading-none text-[#F8F7FB] transition-[background-color,border-color,color,transform] duration-150 hover:-translate-y-px hover:border-[rgba(139,128,217,0.56)] hover:bg-[rgba(97,85,185,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17161C] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 motion-reduce:transition-none"
        >
          <span aria-hidden="true">→</span>
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
