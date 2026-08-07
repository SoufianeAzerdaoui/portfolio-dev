import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import type { PortfolioContent } from "@/types/portfolio";

type HeroActionsProps = {
  ctas: PortfolioContent["ctas"];
};

export function HeroActions({ ctas }: HeroActionsProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 md:flex-row md:flex-wrap">
      <Link
        href={ctas.primary.href}
        className="group inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#506DE8] bg-[linear-gradient(135deg,#3F63DD,#654EE8)] px-6 py-2.5 text-[0.83rem] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(79,107,255,0.16)] transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912] md:w-auto md:min-w-[13.25rem]"
      >
        <span>{ctas.primary.label}</span>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      <Link
        href={ctas.secondary.href}
        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[6px] border border-[rgba(226,232,240,0.3)] bg-[rgba(8,13,26,0.5)] px-6 py-2.5 text-[0.83rem] font-medium text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-200 hover:border-white/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912] md:w-auto md:min-w-[18.25rem]"
      >
        <Sparkles className="h-3.5 w-3.5 text-[#8CA0FF]" />
        <span>{ctas.secondary.label}</span>
      </Link>
    </div>
  );
}
