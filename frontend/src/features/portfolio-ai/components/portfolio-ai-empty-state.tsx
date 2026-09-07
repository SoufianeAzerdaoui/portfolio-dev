"use client";

import { ArrowUpRight } from "lucide-react";

import type { PortfolioAIConsoleContent } from "@/types/portfolio";

type PortfolioAIEmptyStateProps = {
  content: PortfolioAIConsoleContent;
  disabled: boolean;
  onSuggestion: (question: string) => void;
};

export function PortfolioAIEmptyState({
  content,
  disabled,
  onSuggestion,
}: PortfolioAIEmptyStateProps) {
  return (
    <section className="mx-auto flex w-full max-w-[40rem] flex-1 flex-col justify-center px-5 py-12 sm:px-8">
      <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-[#8B80D9]">
        {content.title}
      </p>
      <h2 className="mt-5 max-w-[34rem] text-[clamp(1.65rem,3vw,2.45rem)] font-medium leading-[1.08] text-[var(--home-text)]">
        {content.intro}
      </h2>

      <div className="mt-10 border-y border-[var(--home-line-muted)]">
        {content.suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestion(suggestion)}
            className="group grid min-h-[4.1rem] w-full grid-cols-[2rem_minmax(0,1fr)_1.75rem] items-center gap-4 border-b border-[var(--home-line-muted)] py-4 text-left last:border-b-0 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span className="font-mono text-[0.66rem] font-semibold text-[var(--home-muted)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[0.94rem] leading-6 text-[var(--home-text-secondary)] transition-colors duration-150 group-hover:text-[var(--home-text)] motion-reduce:transition-none">
              {suggestion}
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="h-4 w-4 justify-self-end text-[var(--home-muted)] transition duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#8B80D9] motion-reduce:transform-none motion-reduce:transition-none"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
