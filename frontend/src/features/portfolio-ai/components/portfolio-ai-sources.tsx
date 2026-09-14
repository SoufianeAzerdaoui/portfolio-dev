"use client";

import Link from "next/link";

import type { PublicPortfolioAISource } from "@/features/portfolio-ai/client/portfolio-ai-client";
import { getPortfolioAISourceTypeLabel } from "@/features/portfolio-ai/client/display";
import type { PortfolioAIConsoleContent } from "@/types/portfolio";

type PortfolioAISourcesProps = {
  content: PortfolioAIConsoleContent;
  sources: PublicPortfolioAISource[];
};

export function isPortfolioAIProjectSource(source: PublicPortfolioAISource) {
  return source.type.toLowerCase() === "project";
}

export function getPortfolioAIProjectSourceHref(source: PublicPortfolioAISource) {
  return `/projects#${encodeURIComponent(source.entityId)}`;
}

export function PortfolioAISources({ content, sources }: PortfolioAISourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <aside className="mt-5 max-w-[38rem] border-t border-[var(--home-line-muted)] pt-4">
      <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#9B9AA4]">
        {content.sourcesTitle}
      </p>
      <ul className="mt-2 divide-y divide-[var(--home-line-muted)]">
        {sources.map((source) => {
          const sourceType = getPortfolioAISourceTypeLabel(content, source.type);
          const sourceContent = (
            <>
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-0 top-3 w-px bg-[#8B80D9] opacity-50 transition-opacity duration-150 group-hover/source:opacity-90 group-focus-visible/source:opacity-90 motion-reduce:transition-none"
              />
              <span className="min-w-0">
                <span className="block font-mono text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[var(--home-muted)]">
                  {sourceType}
                </span>
                <span className="block break-words text-[0.84rem] font-medium leading-5 text-[#B9B6C6] transition-colors duration-150 group-hover/source:text-[var(--home-text)] group-focus-visible/source:text-[var(--home-text)] motion-reduce:transition-none">
                  {source.label}
                </span>
              </span>
            </>
          );
          const sourceAction = (
            <span className="inline-flex min-h-7 shrink-0 items-center gap-1.5 justify-self-start font-mono text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#A7A5AF] transition-[border-color,color] duration-150 group-hover/source:text-[#8B80D9] group-focus-visible/source:text-[#8B80D9] motion-reduce:transition-none sm:justify-self-end">
              <span className="border-b border-[rgba(139,128,217,0.22)] pb-0.5 transition-colors duration-150 group-hover/source:border-[rgba(139,128,217,0.62)] group-focus-visible/source:border-[rgba(139,128,217,0.62)] motion-reduce:transition-none">
                {content.sourceProjectAction}
              </span>
              <span
                aria-hidden="true"
                className="transition-transform duration-150 group-hover/source:translate-x-1 group-focus-visible/source:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
              >
                ↗
              </span>
            </span>
          );

          return (
            <li key={`${source.id}-${source.entityId}`}>
              {isPortfolioAIProjectSource(source) ? (
                <Link
                  href={getPortfolioAIProjectSourceHref(source)}
                  aria-label={`${sourceType}: ${source.label}. ${content.sourceProjectAction}`}
                  className="group/source relative grid min-h-14 grid-cols-1 items-center gap-2 py-3 pl-3 pr-2 transition-[background-color] duration-150 hover:bg-[rgba(97,85,185,0.045)] focus-visible:bg-[rgba(97,85,185,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#17161C] motion-reduce:transition-none sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3"
                >
                  {sourceContent}
                  {sourceAction}
                </Link>
              ) : (
                <div className="relative grid min-h-14 grid-cols-[minmax(0,1fr)] items-center py-3 pl-3 pr-1">
                  {sourceContent}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
