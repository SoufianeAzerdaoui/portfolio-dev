"use client";

import { usePreferences } from "@/components/providers/preferences-provider";
import type { LanguageOption } from "@/types/portfolio";

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
  const { locale: active, setLocale } = usePreferences();
  const groupLabel =
    active === "fr" ? "Sélection de langue" : "Language selection";

  return (
    <div
      className={[
        "inline-flex items-center",
        variant === "minimal"
          ? "gap-3"
          : "gap-1 rounded-full border border-[var(--home-line)] bg-[rgb(var(--home-bg-1-rgb)/0.38)] p-1",
        className,
      ]
        .join(" ")
        .trim()}
      aria-label={groupLabel}
      role="group"
    >
      {languages.map((language) => {
        const isActive = language.code === active;

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => setLocale(language.code)}
            aria-pressed={isActive}
            className={[
              variant === "minimal"
                ? "relative px-0 py-1 text-[0.75rem] font-medium uppercase tracking-[0.14em]"
                : "relative min-w-11 rounded-full px-3 py-2 text-[0.78rem] font-medium uppercase tracking-[0.28em]",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)]",
              isActive
                ? "text-[var(--home-text)]"
                : "text-[var(--home-muted)] hover:text-[var(--home-text-secondary)]",
            ].join(" ")}
          >
            {language.label}
            <span
              aria-hidden="true"
              className={[
                variant === "minimal"
                  ? "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--home-accent-2)] transition-opacity"
                  : "pointer-events-none absolute inset-x-2 bottom-1 h-px rounded-full bg-gradient-to-r from-transparent via-[var(--home-accent-2)] to-transparent transition-opacity",
                isActive ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
