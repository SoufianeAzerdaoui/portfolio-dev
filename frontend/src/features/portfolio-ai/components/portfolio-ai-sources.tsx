"use client";

import {
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  GraduationCap,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { getPortfolioAISourceTypeLabel } from "@/features/portfolio-ai/client/display";
import type { PublicPortfolioAISource } from "@/features/portfolio-ai/client/portfolio-ai-client";
import type { PortfolioAIConsoleContent } from "@/types/portfolio";

const sourceIcons: Record<string, LucideIcon> = {
  project: FolderKanban,
  experience: BriefcaseBusiness,
  education: GraduationCap,
  profile: UserRound,
  default: FileText,
};

type PortfolioAISourcesProps = {
  content: PortfolioAIConsoleContent;
  sources: PublicPortfolioAISource[];
};

export function PortfolioAISources({ content, sources }: PortfolioAISourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <aside className="mt-5 max-w-[38rem] border-t border-[var(--home-line-muted)] pt-4">
      <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[var(--home-muted)]">
        {content.sourcesTitle}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {sources.map((source) => {
          const Icon = sourceIcons[source.type] ?? sourceIcons.default;

          return (
            <li
              key={`${source.id}-${source.entityId}`}
              className="grid min-h-14 grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 rounded-[7px] border border-[var(--home-line-muted)] bg-[rgba(255,255,255,0.018)] px-3 py-2.5"
            >
              <span className="inline-grid h-8 w-8 place-items-center rounded-[6px] border border-[rgba(139,128,217,0.14)] bg-[rgba(97,85,185,0.06)] text-[#8B80D9]">
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--home-muted)]">
                  {getPortfolioAISourceTypeLabel(content, source.type)}
                </span>
                <span className="block truncate text-[0.8rem] font-medium text-[var(--home-text-secondary)]">
                  {source.label}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
