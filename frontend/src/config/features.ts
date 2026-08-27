// Light theme UI is intentionally gated until the design is production-ready.
export const LIGHT_THEME_ENABLED: boolean = false;

export const FEATURES = {
  lightTheme: LIGHT_THEME_ENABLED,
} as const;
