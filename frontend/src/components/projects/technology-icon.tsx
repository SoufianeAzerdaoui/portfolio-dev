import Image from "next/image";

import type { ProjectTechnology } from "@/types/project";

const TECHNOLOGY_ICON_PATHS: Record<string, string> = {
  python: "/assets/tech/python.svg",
  fastapi: "/assets/tech/fastapi.svg",
  qdrant: "/assets/tech/qdrant.svg",
  "llama-3-2": "/assets/tech/llama.svg",
};

export function getTechnologyIconSrc(technology: ProjectTechnology) {
  return (
    technology.icon ??
    TECHNOLOGY_ICON_PATHS[technology.slug] ??
    TECHNOLOGY_ICON_PATHS[technology.id] ??
    null
  );
}

export function TechnologyIcon({
  technology,
}: {
  technology: ProjectTechnology;
}) {
  const iconSrc = getTechnologyIconSrc(technology);

  return (
    <span
      aria-hidden="true"
      className="flex h-5 w-5 shrink-0 items-center justify-center"
    >
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt=""
          width={20}
          height={20}
          unoptimized
          className="max-h-[18px] max-w-[18px] object-contain opacity-80"
        />
      ) : null}
    </span>
  );
}
