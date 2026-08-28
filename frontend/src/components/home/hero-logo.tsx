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
        <p className="text-[clamp(0.7rem,0.82vw,0.95rem)] font-semibold uppercase tracking-[0.34em] text-[var(--home-text)]">
          {name}
        </p>
        <p className="mt-2.5 text-[clamp(0.58rem,0.68vw,0.72rem)] uppercase tracking-[0.36em] text-[#8B80D9]">
          {role}
        </p>
      </div>
    </div>
  );
}
