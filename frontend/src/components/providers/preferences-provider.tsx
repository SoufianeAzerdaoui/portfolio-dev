"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  LocaleCode,
  MotionPreference,
  ThemePreference,
} from "@/types/portfolio";

type ResolvedTheme = "dark" | "light";

type PreferencesContextValue = {
  locale: LocaleCode;
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  motion: MotionPreference;
  setLocale: (locale: LocaleCode) => void;
  setTheme: (theme: ThemePreference) => void;
  setMotion: (motion: MotionPreference) => void;
  resetPreferences: () => void;
  reduceMotion: boolean;
};

const LOCALE_STORAGE_KEY = "portfolio-locale";
const THEME_STORAGE_KEY = "portfolio-theme";
const MOTION_STORAGE_KEY = "portfolio-motion";
const DEFAULT_LOCALE: LocaleCode = "fr";
const DEFAULT_THEME: ThemePreference = "dark";
const DEFAULT_MOTION: MotionPreference = "system";

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readDocumentLocale(fallback: LocaleCode = DEFAULT_LOCALE): LocaleCode {
  if (typeof document === "undefined") {
    return fallback;
  }

  const locale = document.documentElement.dataset.locale;
  if (locale === "fr" || locale === "en") {
    return locale;
  }

  return fallback;
}

function readDocumentTheme(
  fallback: ThemePreference = DEFAULT_THEME,
): ThemePreference {
  if (typeof document === "undefined") {
    return fallback;
  }

  const theme = document.documentElement.dataset.themePreference;
  if (theme === "dark" || theme === "light" || theme === "system") {
    return theme;
  }

  return fallback;
}

function readDocumentMotion(
  fallback: MotionPreference = DEFAULT_MOTION,
): MotionPreference {
  if (typeof document === "undefined") {
    return fallback;
  }

  const motion = document.documentElement.dataset.motionPreference;
  if (motion === "system" || motion === "reduced") {
    return motion;
  }

  return fallback;
}

function resolveThemePreference(theme: ThemePreference): ResolvedTheme {
  if (theme === "dark" || theme === "light") {
    return theme;
  }

  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function systemReducedMotion() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function persistCookie(key: string, value: string) {
  document.cookie = `${key}=${value};path=/;max-age=31536000;samesite=lax`;
}

function clearCookie(key: string) {
  document.cookie = `${key}=;path=/;max-age=0;samesite=lax`;
}

export function PreferencesProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
  initialTheme = DEFAULT_THEME,
  initialMotion = DEFAULT_MOTION,
}: {
  children: React.ReactNode;
  initialLocale?: LocaleCode;
  initialTheme?: ThemePreference;
  initialMotion?: MotionPreference;
}) {
  const [locale, setLocaleState] = useState<LocaleCode>(
    () => readDocumentLocale(initialLocale),
  );
  const [theme, setThemeState] = useState<ThemePreference>(
    () => readDocumentTheme(initialTheme),
  );
  const [motion, setMotionState] =
    useState<MotionPreference>(() => readDocumentMotion(initialMotion));
  const [systemTheme, setSystemTheme] =
    useState<ResolvedTheme>(() => resolveThemePreference("system"));
  const [systemMotionReduced, setSystemMotionReduced] =
    useState(systemReducedMotion);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const reduceMotion = motion === "reduced" || systemMotionReduced;

  useEffect(() => {
    const themeQuery = window.matchMedia("(prefers-color-scheme: light)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncTheme = () => {
      setSystemTheme(themeQuery.matches ? "light" : "dark");
    };
    const syncMotion = () => {
      setSystemMotionReduced(motionQuery.matches);
    };

    syncTheme();
    syncMotion();

    themeQuery.addEventListener("change", syncTheme);
    motionQuery.addEventListener("change", syncMotion);

    return () => {
      themeQuery.removeEventListener("change", syncTheme);
      motionQuery.removeEventListener("change", syncMotion);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dataset.locale = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    persistCookie(LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(
      new CustomEvent("portfolio-preferences-change", {
        detail: { locale, theme, motion },
      }),
    );
  }, [locale, motion, theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.themePreference = theme;
    root.style.colorScheme = resolvedTheme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    persistCookie(THEME_STORAGE_KEY, theme);
    window.dispatchEvent(
      new CustomEvent("portfolio-theme-change", { detail: { theme: resolvedTheme } }),
    );
  }, [resolvedTheme, theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = reduceMotion ? "reduce" : "system";
    root.dataset.motionPreference = motion;
    localStorage.setItem(MOTION_STORAGE_KEY, motion);
    persistCookie(MOTION_STORAGE_KEY, motion);
    window.dispatchEvent(
      new CustomEvent("portfolio-preferences-change", {
        detail: { locale, theme, motion },
      }),
    );
  }, [locale, motion, reduceMotion, theme]);

  const setLocale = useCallback((nextLocale: LocaleCode) => {
    setLocaleState(nextLocale);
  }, []);

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    setThemeState(nextTheme);
  }, []);

  const setMotion = useCallback((nextMotion: MotionPreference) => {
    setMotionState(nextMotion);
  }, []);

  const resetPreferences = useCallback(() => {
    localStorage.removeItem(LOCALE_STORAGE_KEY);
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(MOTION_STORAGE_KEY);
    clearCookie(LOCALE_STORAGE_KEY);
    clearCookie(THEME_STORAGE_KEY);
    clearCookie(MOTION_STORAGE_KEY);
    setLocaleState(DEFAULT_LOCALE);
    setThemeState(DEFAULT_THEME);
    setMotionState(DEFAULT_MOTION);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      locale,
      theme,
      resolvedTheme,
      motion,
      setLocale,
      setTheme,
      setMotion,
      resetPreferences,
      reduceMotion,
    }),
    [
      locale,
      motion,
      reduceMotion,
      resetPreferences,
      resolvedTheme,
      setLocale,
      setMotion,
      setTheme,
      theme,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }

  return context;
}
