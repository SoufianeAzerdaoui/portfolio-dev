export const supportedLocales = ["fr", "en"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const projectStatuses = ["draft", "published", "archived"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export const projectTypes = [
  "academic",
  "personal",
  "professional",
  "internship",
] as const;

export type ProjectType = (typeof projectTypes)[number];

export type ProjectMediaType = "image" | "video";

export type ProjectMediaRole =
  | "cover"
  | "architecture"
  | "interface"
  | "demo";

export type ProjectLinkType =
  | "github"
  | "demo"
  | "documentation"
  | "paper"
  | "other";

export type ProjectViewMode = "grid" | "list";

export type ProjectCategoryFilter = "all" | string;

export interface ProjectCategory {
  id: string;
  slug: string;
  name: string;
}

export interface ProjectTechnology {
  id: string;
  slug: string;
  name: string;
  icon?: string;
}

export interface ProjectContributor {
  name: string;
  role?: string;
  profileUrl?: string;
}

export interface ProjectMedia {
  id: string;
  type: ProjectMediaType;
  role?: ProjectMediaRole;
  storagePath: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  sortOrder: number;
}

export interface ProjectLink {
  id: string;
  type: ProjectLinkType;
  label: string;
  url: string;
}

export interface ProjectResult {
  label: string;
  value?: string;
  description: string;
  verified: boolean;
}

export interface ProjectCaseStudy {
  overview?: string;
  context?: string;
  problem?: string;
  objectives?: string[];
  role?: string;
  approach?: string;
  architecture?: string;
  architectureSteps?: string[];
  challenges?: string[];
  solutions?: string[];
  results?: ProjectResult[];
  limitations?: string[];
  lessonsLearned?: string[];
  nextSteps?: string[];
}

export interface ProjectSEO {
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface ProjectLocalizedContent {
  title: string;
  shortDescription: string;
  caseStudy?: ProjectCaseStudy;
  seo?: ProjectSEO;
}

export interface Project {
  id: string;
  slug: string;
  status: ProjectStatus;
  type?: ProjectType;
  content: {
    fr: ProjectLocalizedContent;
    en?: ProjectLocalizedContent;
  };
  categories: ProjectCategory[];
  technologies: ProjectTechnology[];
  coverImage: ProjectMedia | null;
  gallery: ProjectMedia[];
  links: ProjectLink[];
  contributors?: ProjectContributor[];
  year?: number;
  duration?: string;
  role?: string;
  organization?: string;
  featured: boolean;
  featuredOrder: number | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt: string | null;
}

export interface ProjectExplorerState {
  query: string;
  category: ProjectCategoryFilter;
  view: ProjectViewMode;
  page: number;
}
