"use client";

import { useState } from "react";

import type { LanguageOption, LocaleCode } from "@/types/portfolio";

type LanguageSwitcherProps = {
  languages: LanguageOption[];
  className?: string;
  variant?: "default" | "minimal";
};

export function LanguageSwitcher({
  languages,
  className = "",
  variant = "default",
}: LanguageSwitcherProps) {
  const [active, setActive] = useState<LocaleCode>("fr");

  return (
    <div
      className={[
        "inline-flex items-center",
        variant === "minimal"
          ? "gap-3"
          : "gap-1 rounded-full border border-white/10 bg-white/5 p-1",
        className,
      ]
        .join(" ")
        .trim()}
      aria-label="Selection de langue"
      role="group"
    >
      {languages.map((language) => {
        const isActive = language.code === active;

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => setActive(language.code)}
            aria-pressed={isActive}
            className={[
              variant === "minimal"
                ? "relative px-0 py-1 text-[0.75rem] font-medium uppercase tracking-[0.14em]"
                : "relative min-w-11 rounded-full px-3 py-2 text-[0.78rem] font-medium uppercase tracking-[0.28em]",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6BFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050912]",
              isActive ? "text-slate-50" : "text-slate-400 hover:text-slate-200",
            ].join(" ")}
          >
            {language.label}
            <span
              aria-hidden="true"
              className={[
                variant === "minimal"
                  ? "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#7C8CFF] transition-opacity"
                  : "pointer-events-none absolute inset-x-2 bottom-1 h-px rounded-full bg-gradient-to-r from-transparent via-[#4F6BFF] to-transparent transition-opacity",
                isActive ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
