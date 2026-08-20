"use client";

import { AnimatedSALogo } from "@/components/home/animated-sa-logo";

type HeroLogoProps = {
  name: string;
  role: string;
};

export function HeroLogo({ name, role }: HeroLogoProps) {
  return (
    <div className="relative mx-auto flex w-full max-w-[39rem] flex-col items-center">
      <AnimatedSALogo />
      <div className="mt-3.5 text-center">
        <p className="text-[clamp(0.64rem,0.75vw,0.78rem)] font-medium uppercase tracking-[0.42em] text-[var(--home-text)]">
          {name}
        </p>
        <p className="mt-2.5 text-[clamp(0.58rem,0.68vw,0.7rem)] uppercase tracking-[0.4em] text-[var(--home-accent-2)]">
          {role}
        </p>
      </div>
    </div>
  );
}
