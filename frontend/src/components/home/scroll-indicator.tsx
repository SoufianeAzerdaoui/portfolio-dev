"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { usePreferences } from "@/components/providers/preferences-provider";

type ScrollIndicatorProps = {
  href: `#${string}`;
};

export function ScrollIndicator({ href }: ScrollIndicatorProps) {
  const systemReducedMotion = useReducedMotion();
  const { reduceMotion, locale } = usePreferences();
  const reducedMotion = systemReducedMotion || reduceMotion;

  return (
    <Link
      href={href}
      aria-label={
        locale === "fr"
          ? "Défiler vers la section suivante"
          : "Scroll to the next section"
      }
      className="group inline-flex rounded-full p-2 text-[var(--home-muted)] transition hover:text-[var(--home-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]"
    >
      <span className="relative flex h-8 w-5 items-start justify-center rounded-full border border-[var(--home-line)] bg-transparent pt-2">
        <motion.span
          aria-hidden="true"
          initial={reducedMotion ? false : { y: 0, opacity: 0.85 }}
          animate={reducedMotion ? { y: 0, opacity: 0.85 } : { y: [0, 8, 0], opacity: [0.8, 0.28, 0.8] }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: 2.1, repeat: Infinity, ease: "easeInOut" }
          }
          className="h-1.5 w-1.5 rounded-full bg-[var(--home-accent-2)]"
        />
      </span>
    </Link>
  );
}
