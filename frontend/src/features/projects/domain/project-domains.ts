import type { ProjectDomain, ProjectDomainFilter } from "@/features/projects/domain/project.types";

export type ProjectDomainOption = {
  id: ProjectDomain;
  label: string;
  order: number;
};

export type ProjectDomainFilterOption = {
  id: ProjectDomainFilter;
  label: string;
};

export const ALL_PROJECT_DOMAIN_OPTION = {
  id: "all",
  label: "Tous",
} satisfies ProjectDomainFilterOption;

export const PROJECT_DOMAIN_OPTIONS = [
  {
    id: "ai-ml",
    label: "AI & Machine Learning",
    order: 1,
  },
  {
    id: "data-analytics",
    label: "Data & Analytics",
    order: 2,
  },
  {
    id: "data-engineering",
    label: "Data Engineering",
    order: 3,
  },
  {
    id: "software-engineering",
    label: "Software Engineering",
    order: 4,
  },
] as const satisfies readonly ProjectDomainOption[];

const PROJECT_DOMAIN_LABELS = new Map<ProjectDomain, string>(
  PROJECT_DOMAIN_OPTIONS.map((domain) => [domain.id, domain.label]),
);

export function getProjectDomainLabel(domain: ProjectDomain) {
  return PROJECT_DOMAIN_LABELS.get(domain) ?? domain;
}

export function isProjectDomain(value: string): value is ProjectDomain {
  return PROJECT_DOMAIN_OPTIONS.some((domain) => domain.id === value);
}
