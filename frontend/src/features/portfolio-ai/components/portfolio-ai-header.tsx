"use client";

import type { PortfolioAIConsoleContent } from "@/types/portfolio";

export type PortfolioAIConsoleMode = "normal" | "expanded" | "minimized";

type PortfolioAIHeaderProps = {
  content: PortfolioAIConsoleContent;
  mode: PortfolioAIConsoleMode;
  isActive: boolean;
  onClose: () => void;
  onToggleMinimized: () => void;
  onToggleExpanded: () => void;
};

export function PortfolioAIHeader({
  content,
  mode,
  isActive,
  onClose,
  onToggleMinimized,
  onToggleExpanded,
}: PortfolioAIHeaderProps) {
  const minimized = mode === "minimized";
  const expanded = mode === "expanded";

  return (
    <header
      className={[
        "flex shrink-0 items-center justify-between gap-4 border-b border-[var(--home-line-muted)] px-5 py-4 sm:px-6",
        minimized ? "h-full min-h-0 border-b-0 px-4 py-0 sm:px-4" : "min-h-[4.25rem]",
      ].join(" ")}
    >
      <div className="min-w-0 shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-[7px] border border-[rgba(139,128,217,0.18)] bg-[rgba(97,85,185,0.08)] text-[0.62rem] font-semibold tracking-[0.18em] text-[#F1F0F5]">
            SA
          </span>
          <p className="truncate font-mono text-[0.68rem] font-medium uppercase tracking-[0.22em] text-[#D8D6E0]">
            {content.mark}
          </p>
        </div>
      </div>

      {minimized ? (
        <p className="hidden min-w-0 flex-1 truncate text-center font-mono text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[var(--home-muted)] sm:block">
          {isActive ? content.minimizedActive : content.minimizedReady}
        </p>
      ) : null}

      <div className="flex shrink-0 items-center gap-3">
        <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--home-muted)]">
          {content.languageLabel}
        </span>
        <div className="portfolio-ai-window-controls flex items-center gap-[7px]">
          <button
            type="button"
            aria-label={content.close}
            onClick={onClose}
            className="portfolio-ai-window-control portfolio-ai-window-control-red"
          >
            <span className="portfolio-ai-window-control-symbol" aria-hidden="true">
              ×
            </span>
          </button>
          <button
            type="button"
            aria-label={minimized ? content.restore : content.minimize}
            aria-pressed={minimized}
            onClick={onToggleMinimized}
            className={[
              "portfolio-ai-window-control portfolio-ai-window-control-yellow",
              minimized ? "" : "portfolio-ai-window-control-mobile-hidden",
            ].join(" ")}
          >
            <span className="portfolio-ai-window-control-symbol" aria-hidden="true">
              −
            </span>
          </button>
          <button
            type="button"
            aria-label={expanded ? content.restore : content.expand}
            aria-pressed={expanded}
            onClick={onToggleExpanded}
            className="portfolio-ai-window-control portfolio-ai-window-control-green"
          >
            <span className="portfolio-ai-window-control-symbol" aria-hidden="true">
              +
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
