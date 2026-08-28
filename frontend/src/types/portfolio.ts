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
};
