import {
  projectDomains,
  type Project,
} from "@/features/projects/domain/project.types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const PROJECT_DOMAIN_VALUES = new Set<string>(projectDomains);

function assertIsoDate(value: string, field: string, slug: string) {
  if (!ISO_DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`Invalid ${field} ISO date for project "${slug}".`);
  }
}

export function validateProjectSource(projects: readonly Project[]) {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  projects.forEach((project) => {
    if (!project.id.trim()) {
      throw new Error("Project id is required.");
    }

    if (ids.has(project.id)) {
      throw new Error(`Duplicate project id "${project.id}".`);
    }

    ids.add(project.id);

    if (!SLUG_PATTERN.test(project.slug)) {
      throw new Error(
        `Project slug "${project.slug}" must use lowercase kebab-case.`,
      );
    }

    if (slugs.has(project.slug)) {
      throw new Error(`Duplicate project slug "${project.slug}".`);
    }

    slugs.add(project.slug);

    if (!project.content.fr.title.trim()) {
      throw new Error(`French title is required for project "${project.slug}".`);
    }

    if (!project.content.fr.shortDescription.trim()) {
      throw new Error(
        `French shortDescription is required for project "${project.slug}".`,
      );
    }

    project.searchKeywords?.forEach((keyword) => {
      if (!keyword.trim()) {
        throw new Error(
          `Project "${project.slug}" contains an empty search keyword.`,
        );
      }
    });

    if (!PROJECT_DOMAIN_VALUES.has(project.domain)) {
      throw new Error(`Invalid project domain for project "${project.slug}".`);
    }

    if (project.createdAt) {
      assertIsoDate(project.createdAt, "createdAt", project.slug);
    }

    if (project.updatedAt) {
      assertIsoDate(project.updatedAt, "updatedAt", project.slug);
    }

    if (project.publishedAt !== null) {
      assertIsoDate(project.publishedAt, "publishedAt", project.slug);
    }
  });
}
