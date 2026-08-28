import { HeroActions } from "@/components/home/hero-actions";
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
      <div className="pointer-events-none absolute left-1/2 top-[17%] -z-10 h-[26.25rem] w-[38.75rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--home-accent-rgb)/0.038),transparent_68%)] blur-[110px]" />

      <div className="relative mx-auto flex h-full w-full max-w-[120rem] flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="relative z-10 flex w-full max-w-[57.5rem] flex-col items-center text-center lg:-translate-x-5 lg:-translate-y-[4vh] xl:-translate-x-8 xl:-translate-y-[5vh] 2xl:-translate-x-10 2xl:-translate-y-[5vh]">
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
            <p className="mt-4 max-w-[38.75rem] text-pretty text-[clamp(0.89rem,1vw,1.02rem)] leading-[1.58] text-[var(--home-text-secondary)] md:mt-5">
              {content.hero.description}
            </p>
            <div className="mt-5 w-full max-w-[39rem] md:mt-6">
              <HeroActions ctas={content.ctas} />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden lg:flex lg:justify-center">
          <div className="pointer-events-auto">
            <ScrollIndicator href="#about" />
          </div>
        </div>
      </div>
    </section>
  );
}
