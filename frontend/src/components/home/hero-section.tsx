import { HeroActions } from "@/components/home/hero-actions";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { HeroLogo } from "@/components/home/hero-logo";
import { ScrollIndicator } from "@/components/home/scroll-indicator";
import type { PortfolioContent } from "@/types/portfolio";

type HeroSectionProps = {
  content: PortfolioContent;
};

export function HeroSection({ content }: HeroSectionProps) {
  return (
    <section
      id="home"
      className="relative grid min-h-[100svh] place-items-center overflow-hidden px-5 pt-[clamp(5rem,6vh,5.75rem)] pb-[clamp(4rem,8vh,5rem)] sm:px-8 lg:px-[clamp(2rem,4vw,4.5rem)]"
    >
      <div className="pointer-events-none absolute left-1/2 top-[18%] -z-10 h-[26.25rem] w-[38.75rem] -translate-x-1/2 rounded-full bg-[#0C2465]/8 blur-[110px]" />

      <div className="relative mx-auto flex h-full w-full max-w-[120rem] flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-16 lg:block">
          <LanguageSwitcher
            languages={content.languages}
            variant="minimal"
            className="pointer-events-auto absolute right-[clamp(1.25rem,3vw,2.5rem)] top-7 z-10"
          />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative z-10 flex w-full max-w-[57.5rem] flex-col items-center text-center lg:-translate-x-5 lg:translate-y-3 xl:-translate-x-8 xl:translate-y-4 2xl:-translate-x-10 2xl:translate-y-5">
            <HeroLogo
              name={content.identity.name}
              role={content.identity.role}
            />
            {/* <h1 className="mt-7 w-full max-w-[49rem] text-center text-[clamp(2.55rem,3.95vw,4.35rem)] font-medium leading-[0.98] tracking-[-0.045em] text-slate-50 [text-wrap:balance] md:mt-8">
              Je transforme des donnees
              <br className="hidden md:block" />
              {" "}
              complexes en decisions
              <br className="hidden md:block" />
              {" "}
              intelligentes.
            </h1> */}
            <p className="mt-4 max-w-[41.25rem] text-pretty text-[clamp(0.88rem,1vw,1rem)] leading-[1.65] text-slate-400 md:mt-5">
              {content.hero.description}
            </p>
            <div className="mt-5 w-full max-w-[39rem] md:mt-6">
              <HeroActions ctas={content.ctas} />
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-[0.76rem] leading-[1.4] text-slate-400 md:mt-4">
              <span
                aria-hidden="true"
                className="h-[5px] w-[5px] shrink-0 rounded-full bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.35)]"
              />
              <span>{content.hero.availability}</span>
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-4 hidden lg:flex lg:justify-center">
          <div className="pointer-events-auto">
            <ScrollIndicator href="#about" />
          </div>
        </div>
      </div>
    </section>
  );
}
