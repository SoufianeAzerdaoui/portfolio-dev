import type {
  Project,
  ProjectMedia,
  ProjectMediaRole,
} from "@/features/projects/domain/project.types";

export function resolveProjectMediaUrl(media: ProjectMedia) {
  return media.storagePath;
}

export function getProjectMediaByRole(
  project: Pick<Project, "coverImage" | "gallery">,
  role: ProjectMediaRole,
) {
  return [project.coverImage, ...project.gallery]
    .filter((media): media is ProjectMedia => Boolean(media))
    .filter((media) => media.role === role)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
