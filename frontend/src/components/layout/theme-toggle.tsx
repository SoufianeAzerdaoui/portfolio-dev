"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type ThemeName = "dark" | "light";

const STORAGE_KEY = "portfolio-theme";

function readTheme(): ThemeName {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(
    new CustomEvent("portfolio-theme-change", { detail: { theme } }),
  );
}

function subscribeToThemeChange(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("portfolio-theme-change", callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("portfolio-theme-change", callback);
  };
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const theme = useSyncExternalStore(
    subscribeToThemeChange,
    readTheme,
    () => "dark",
  );

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={
        nextTheme === "light"
          ? "Activer le thème clair"
          : "Activer le thème sombre"
      }
      title={nextTheme === "light" ? "Thème clair" : "Thème sombre"}
      onClick={() => {
        applyTheme(nextTheme);
      }}
      className={[
        "theme-toggle relative inline-grid h-9 w-9 place-items-center rounded-full border border-[var(--home-line)] bg-transparent text-[var(--home-muted)] transition duration-200 hover:border-[var(--home-accent)] hover:bg-[var(--home-button-secondary-hover)] hover:text-[var(--home-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent-2)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--home-bg-0)] motion-reduce:transition-none",
        className,
      ]
        .join(" ")
        .trim()}
    >
      <Sun
        aria-hidden="true"
        className="theme-toggle__sun absolute h-4 w-4 transition duration-200 motion-reduce:transition-none"
        strokeWidth={1.8}
      />
      <Moon
        aria-hidden="true"
        className="theme-toggle__moon absolute h-4 w-4 transition duration-200 motion-reduce:transition-none"
        strokeWidth={1.8}
      />
    </button>
  );
}
