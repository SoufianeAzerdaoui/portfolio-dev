"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useId } from "react";
import type { Ref } from "react";

import { usePreferences } from "@/components/providers/preferences-provider";
import { FEATURES } from "@/config/features";
import type { PortfolioContent } from "@/types/portfolio";

type HeroActionsProps = {
  ctas: PortfolioContent["ctas"];
  onPortfolioAIOpen?: () => void;
  portfolioAITriggerRef?: Ref<HTMLButtonElement>;
};

export function HeroActions({
  ctas,
  onPortfolioAIOpen,
  portfolioAITriggerRef,
}: HeroActionsProps) {
  const { locale } = usePreferences();
  const statusId = useId();
  const aiStatus =
    locale === "fr" ? "Bientôt disponible" : "Coming soon";

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row md:flex-wrap">
      <Link
        href={ctas.primary.href}
        className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[var(--home-button-primary-border)] bg-[var(--home-button-primary-bg)] px-6 py-2.5 text-[0.83rem] font-medium text-[#F8F7FB] shadow-[var(--home-button-primary-shadow)] transition duration-200 hover:-translate-y-px hover:border-[var(--home-accent-2)] hover:bg-[var(--home-button-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)] active:translate-y-0 motion-reduce:transition-none md:w-auto md:min-w-[13.25rem]"
      >
        <span>{ctas.primary.label}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-[3px] motion-reduce:transition-none" />
      </Link>

      {FEATURES.portfolioAI ? (
        <button
          ref={portfolioAITriggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-controls="portfolio-ai-console"
          onClick={onPortfolioAIOpen}
          disabled={!onPortfolioAIOpen}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[var(--home-button-secondary-border)] bg-[var(--home-button-secondary-bg)] px-6 py-2.5 text-[0.83rem] font-medium text-[var(--home-button-secondary-text)] transition duration-200 hover:border-[var(--home-line-strong)] hover:bg-[var(--home-button-secondary-hover)] hover:text-[var(--home-button-secondary-hover-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)] md:w-auto md:min-w-[18.25rem]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--home-accent-2)]" />
          <span>{ctas.secondary.label}</span>
        </button>
      ) : (
        <div className="flex w-full flex-col items-center gap-2 md:w-auto">
          <button
            type="button"
            aria-disabled="true"
            aria-describedby={statusId}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[var(--home-button-secondary-border)] bg-[var(--home-button-secondary-bg)] px-6 py-2.5 text-[0.83rem] font-medium text-[var(--home-button-secondary-text)] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)] md:min-w-[18.25rem]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--home-accent-2)]" />
            <span>{ctas.secondary.label}</span>
          </button>
          <p
            id={statusId}
            className="text-[0.66rem] font-medium uppercase tracking-[0.18em] text-[var(--home-muted)]"
          >
            {aiStatus}
          </p>
        </div>
      )}
    </div>
  );
}
