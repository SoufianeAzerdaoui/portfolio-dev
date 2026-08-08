import type { ProjectMedia } from "@/features/projects/domain/project.types";

export function resolveProjectMediaUrl(media: ProjectMedia) {
  return media.storagePath;
}
