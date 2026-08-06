import { HeroActions } from "@/components/home/hero-actions";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { HeroLogo } from "@/components/home/hero-logo";
import { ParticleWave } from "@/components/home/particle-wave";
import { ScrollIndicator } from "@/components/home/scroll-indicator";
import type { PortfolioContent } from "@/types/portfolio";

type HeroSectionProps = {
  content: PortfolioContent;
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section
      id="accueil"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-8 pt-6 sm:px-6 lg:px-10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(57,79,167,0.14),transparent_26%),linear-gradient(180deg,#05070f_0%,#040812_38%,#050912_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.018),transparent_16%,transparent_84%,rgba(255,255,255,0.018))]" />
      <div className="absolute left-1/2 top-[21%] h-56 w-56 -translate-x-1/2 rounded-full bg-[#10245f]/18 blur-[130px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(67,94,255,0.85),transparent)]" />

      <ParticleWave />

      <div className="relative mx-auto flex w-full max-w-[120rem] flex-1 flex-col">
        <div className="hidden items-center justify-end pr-14 pt-8 lg:flex xl:pr-18">
          <LanguageSwitcher
            languages={content.languages}
            className="rounded-[1.75rem] border-white/12 bg-white/[0.035] px-1 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          />
        </div>

        <div className="flex flex-1 items-center justify-center py-8 lg:py-9">
          <div className="relative z-10 flex w-full max-w-[62rem] flex-col items-center text-center lg:-translate-y-2 lg:pr-4 xl:pr-6">
            <HeroLogo
              name={content.identity.name}
              role={content.identity.role}
            />
            <h1 className="mt-10 max-w-[9.5ch] text-balance text-[clamp(3.4rem,5vw,6rem)] font-medium leading-[0.96] tracking-[-0.06em] text-slate-50 sm:max-w-[10ch]">
              {content.hero.title}
            </h1>
            <p className="mt-8 max-w-[45rem] text-pretty text-[1rem] leading-8 text-slate-300/88 sm:text-[1.1rem]">
              {content.hero.description}
            </p>
            <div className="mt-9 w-full max-w-[38rem]">
              <HeroActions ctas={content.ctas} />
            </div>
            <p className="mt-6 text-center text-[0.76rem] font-light tracking-[0.08em] text-slate-400/84 sm:text-[0.82rem]">
              {content.hero.availability}
            </p>
            <div className="mt-7">
              <ScrollIndicator href="#accueil" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
