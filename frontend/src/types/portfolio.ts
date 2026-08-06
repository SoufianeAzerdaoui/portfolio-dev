export type LocaleCode = "fr" | "en";

export type SocialIconKey = "github" | "linkedin" | "mail";

export type LanguageOption = {
  code: LocaleCode;
  label: string;
};

export type NavigationItem = {
  href: `#${string}`;
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
  href: `#${string}`;
  label: string;
};

export type HeroSectionContent = {
  eyebrow: string;
  title: string;
  description: string;
  availability: string;
};

export type SectionPreview = {
  id: string;
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
  hero: HeroSectionContent;
  ctas: {
    primary: CtaLink;
    secondary: CtaLink;
  };
};
