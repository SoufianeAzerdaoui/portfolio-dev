"use client";

import { Database, X } from "lucide-react";

import type { PortfolioAIConsoleContent } from "@/types/portfolio";

type PortfolioAIHeaderProps = {
  content: PortfolioAIConsoleContent;
  onClose: () => void;
};

export function PortfolioAIHeader({ content, onClose }: PortfolioAIHeaderProps) {
  return (
    <header className="flex min-h-[4.25rem] shrink-0 items-center justify-between gap-4 border-b border-[var(--home-line-muted)] px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-[7px] border border-[rgba(139,128,217,0.18)] bg-[rgba(97,85,185,0.08)] text-[0.62rem] font-semibold tracking-[0.18em] text-[#F1F0F5]">
            SA
          </span>
          <p className="truncate font-mono text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--home-text-secondary)]">
            {content.mark}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden items-center gap-2 rounded-[6px] border border-[var(--home-line-muted)] px-2.5 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[var(--home-text-secondary)] sm:inline-flex">
          <Database aria-hidden="true" className="h-3.5 w-3.5 text-[#8B80D9]" />
          <span>{content.status}</span>
        </div>
        <span className="rounded-[6px] border border-[var(--home-line-muted)] px-2.5 py-1.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--home-muted)]">
          {content.languageLabel}
        </span>
        <button
          type="button"
          aria-label={content.close}
          onClick={onClose}
          className="inline-grid h-10 w-10 place-items-center rounded-[8px] border border-[var(--home-line-muted)] bg-transparent text-[var(--home-text-secondary)] transition duration-150 hover:border-[var(--home-line-strong)] hover:bg-[rgba(97,85,185,0.06)] hover:text-[var(--home-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17161C] motion-reduce:transition-none"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
