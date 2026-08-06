import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { PortfolioContent } from "@/types/portfolio";

type HeroActionsProps = {
  ctas: PortfolioContent["ctas"];
};

export function HeroActions({ ctas }: HeroActionsProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
      <Link
        href={ctas.primary.href}
        className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#4F6BFF]/28 bg-[linear-gradient(135deg,rgba(94,103,255,0.92),rgba(124,92,252,0.82))] px-5 py-2.5 text-[0.82rem] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_24px_rgba(79,107,255,0.18)] transition duration-200 hover:border-[#7f91ff]/40 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912] sm:min-w-[11.5rem]"
      >
        <span>{ctas.primary.label}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      <Link
        href={ctas.secondary.href}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/16 bg-white/[0.02] px-5 py-2.5 text-[0.82rem] font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:border-white/28 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912] sm:min-w-[15.5rem]"
      >
        <Sparkles className="h-3.5 w-3.5 text-[#8CA0FF]" />
        <span>{ctas.secondary.label}</span>
      </Link>
    </div>
  );
}
