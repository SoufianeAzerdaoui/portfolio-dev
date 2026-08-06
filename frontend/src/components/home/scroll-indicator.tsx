"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

type ScrollIndicatorProps = {
  href: `#${string}`;
};

export function ScrollIndicator({ href }: ScrollIndicatorProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 rounded-full px-3 py-2 text-[0.68rem] uppercase tracking-[0.34em] text-slate-400 transition hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]"
    >
      <span className="relative flex h-10 w-6 items-start justify-center rounded-full border border-white/14 bg-white/[0.02] pt-2">
        <motion.span
          aria-hidden="true"
          initial={reducedMotion ? false : { y: 0, opacity: 0.85 }}
          animate={reducedMotion ? { y: 0, opacity: 0.85 } : { y: [0, 10, 0], opacity: [0.85, 0.3, 0.85] }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 2.1, repeat: Infinity, ease: "easeInOut" }
          }
          className="h-2 w-2 rounded-full bg-[#8CA0FF]"
        />
      </span>
      <span>Defiler</span>
    </Link>
  );
}
