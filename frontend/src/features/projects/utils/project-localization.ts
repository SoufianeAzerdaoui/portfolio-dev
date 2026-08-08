import type {
  Project,
  SupportedLocale,
} from "@/features/projects/domain/project.types";

export function getProjectContent(project: Project, locale: SupportedLocale = "fr") {
  return project.content[locale] ?? project.content.fr;
}
