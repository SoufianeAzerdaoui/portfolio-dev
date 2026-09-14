export type LocaleCode = "fr" | "en";

export type ThemePreference = "dark" | "light" | "system";

export type MotionPreference = "system" | "reduced";

export const PORTFOLIO_SECTION_IDS = [
  "home",
  "about",
  "education",
  "journey",
  "projects",
  "ai-lab",
] as const;

export type SectionId = (typeof PORTFOLIO_SECTION_IDS)[number];

export type SectionHref = `#${SectionId}`;

export type SocialIconKey = "github" | "linkedin" | "instagram";

export type LanguageOption = {
  code: LocaleCode;
  label: string;
};

export type NavigationItem = {
  id: SectionId;
  href: SectionHref;
  label: string;
  disabled?: boolean;
};

export type SocialLink = {
  href: string;
  label: string;
  icon: SocialIconKey;
  external?: boolean;
  disabled?: boolean;
};

export type CtaLink = {
  href: SectionHref;
  label: string;
};

export type PortfolioAIConsolePublicErrorCode =
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "AI_TEMPORARILY_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "AI_UNAVAILABLE"
  | "AI_RESPONSE_INVALID"
  | "AI_PROVIDER_ERROR"
  | "NETWORK_ERROR"
  | "STREAM_PROTOCOL_ERROR";

export type PortfolioAIConsoleContent = {
  ariaLabel: string;
  mark: string;
  close: string;
  languageLabel: string;
  title: string;
  intro: string;
  subtitle: string;
  suggestions: string[];
  userLabel: string;
  assistantLabel: string;
  sourcesTitle: string;
  inputPlaceholder: string;
  send: string;
  minimize: string;
  expand: string;
  restore: string;
  minimizedReady: string;
  minimizedActive: string;
  answerAvailable: string;
  sourceProjectAction: string;
  retry: string;
  processing: string;
  sourceTypeLabels: Record<string, string>;
  errorMessages: Record<PortfolioAIConsolePublicErrorCode, string>;
  retryAfterSuffix: string;
  remainingCharacters: string;
};

export type HeroSectionContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export type AboutParagraphSegment = {
  text: string;
  tone?: "accent" | "strong";
};

export type AboutStat = {
  value: string;
  label: string;
};

export type AboutSectionContent = {
  id: "about";
  eyebrow: string;
  title: string;
  paragraphs: AboutParagraphSegment[][];
  stats: AboutStat[];
  highlights: string[];
  image: {
    src: string;
    alt: string;
  };
  profileLabel: string;
  profileMeta: string;
  signature: string;
  cta: CtaLink;
};

export type SectionPreview = {
  id: Exclude<SectionId, "home" | "about">;
  title: string;
  description: string;
};

export type PortfolioContent = {
  identity: {
    name: string;
    role: string;
  };
  languages: LanguageOption[];
  navigation: NavigationItem[];
  socialLinks: SocialLink[];
  about: AboutSectionContent;
  sections: SectionPreview[];
  hero: HeroSectionContent;
  ctas: {
    primary: CtaLink;
    secondary: CtaLink;
  };
  aiConsole: PortfolioAIConsoleContent;
};
