"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

type HeroLogoProps = {
  name: string;
  role: string;
};

export function HeroLogo({ name, role }: HeroLogoProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.9, delay: 0.1 }}
      className="relative mx-auto flex w-full max-w-[30rem] flex-col items-center sm:max-w-[32rem]"
    >
      <div className="relative w-full">
        <div className="absolute inset-x-[18%] top-[16%] h-9 bg-[radial-gradient(circle,rgba(226,232,240,0.26),transparent_72%)] blur-3xl" />
        <div className="absolute inset-x-[24%] bottom-[14%] h-10 bg-[radial-gradient(circle,rgba(79,107,255,0.16),transparent_72%)] blur-3xl" />
        <Image
          src="/assets/logo.png"
          alt="Monogramme SA argent sur fond technologique"
          width={1536}
          height={1024}
          priority
          sizes="(max-width: 767px) 72vw, 480px"
          className="relative z-10 h-auto w-full object-contain mix-blend-screen opacity-[0.97]"
        />
      </div>

      <div className="-mt-2 text-center">
        <p className="text-[0.62rem] uppercase tracking-[0.55em] text-slate-200/82 sm:text-[0.68rem]">
          {name}
        </p>
        <p className="mt-3 text-[0.6rem] uppercase tracking-[0.5em] text-slate-400/92 sm:text-[0.66rem]">
          {role}
        </p>
      </div>
    </motion.div>
  );
}
