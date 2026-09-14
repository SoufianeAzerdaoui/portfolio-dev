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
    <section className="mx-auto flex w-full max-w-[42rem] flex-1 flex-col justify-center px-5 py-12 sm:px-8">
      <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-[#8B80D9]">
        {content.title}
      </p>
      <h2 className="mt-4 max-w-[34rem] text-[clamp(1.72rem,2.45vw,2.32rem)] font-medium leading-[1.08] text-[var(--home-text)]">
        {content.intro}
      </h2>
      <p className="mt-3 max-w-[34rem] text-[0.94rem] leading-6 text-[var(--home-text-secondary)]">
        {content.subtitle}
      </p>

      <div className="mt-9 border-y border-[var(--home-line-muted)]">
        {content.suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestion(suggestion)}
            className="group relative -mx-3 grid min-h-[4.1rem] w-[calc(100%+1.5rem)] grid-cols-[2rem_minmax(0,1fr)_1.75rem] items-center gap-4 border-b border-[var(--home-line-muted)] px-3 py-4 text-left transition-[background-color,border-color] duration-150 last:border-b-0 hover:bg-[rgba(97,85,185,0.045)] focus-visible:bg-[rgba(97,85,185,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17161C] disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none"
          >
            <span
              aria-hidden="true"
              className="absolute bottom-4 left-0 top-4 w-px bg-[#8B80D9] opacity-0 transition-opacity duration-150 group-hover:opacity-60 group-focus-visible:opacity-80 motion-reduce:transition-none"
            />
            <span className="font-mono text-[0.66rem] font-semibold text-[#9B9AA4]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-[0.95rem] leading-6 text-[#B9B6C6] transition-colors duration-150 group-hover:text-[var(--home-text)] motion-reduce:transition-none">
              {suggestion}
            </span>
            <ArrowUpRight
              aria-hidden="true"
              focusable="false"
              className="h-[1.05rem] w-[1.05rem] justify-self-end text-[#A7A5AF] transition duration-150 group-hover:translate-x-1 group-hover:text-[#8B80D9] motion-reduce:transform-none motion-reduce:transition-none"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
