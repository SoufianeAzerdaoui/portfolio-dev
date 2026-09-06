import {
  toSlug,
  uniqueStrings,
} from "@/features/portfolio-ai/knowledge/build-aliases";
import type {
  KnowledgeEntity,
  KnowledgeFact,
  KnowledgeRelation,
  TechnologyEvidenceItem,
} from "@/features/portfolio-ai/knowledge/knowledge.types";

const CANONICAL_TECHNOLOGIES: Record<
  string,
  { id: string; canonicalName: string; aliases: string[] }
> = {
  "react js": {
    id: "tech:react",
    canonicalName: "React",
    aliases: ["React.js", "react"],
  },
  react: {
    id: "tech:react",
    canonicalName: "React",
    aliases: ["React.js", "react"],
  },
  "next js": {
    id: "tech:next-js",
    canonicalName: "Next.js",
    aliases: ["next-js", "Next"],
  },
  "apache kafka": {
    id: "tech:apache-kafka",
    canonicalName: "Apache Kafka",
    aliases: ["Kafka", "kafka"],
  },
  kafka: {
    id: "tech:apache-kafka",
    canonicalName: "Apache Kafka",
    aliases: ["Kafka", "kafka"],
  },
  "apache spark": {
    id: "tech:apache-spark",
    canonicalName: "Apache Spark",
    aliases: ["Spark"],
  },
  spark: {
    id: "tech:apache-spark",
    canonicalName: "Apache Spark",
    aliases: ["Spark"],
  },
  "git bitbucket": {
    id: "tech:git-bitbucket",
    canonicalName: "Git / Bitbucket",
    aliases: ["Git/Bitbucket", "Git", "Bitbucket"],
  },
  "git and bitbucket": {
    id: "tech:git-bitbucket",
    canonicalName: "Git / Bitbucket",
    aliases: ["Git/Bitbucket", "Git", "Bitbucket"],
  },
  "baai bge m3": {
    id: "tech:baai-bge-m3",
    canonicalName: "BAAI/bge-m3",
    aliases: ["bge-m3"],
  },
  "intfloat multilingual e5 base": {
    id: "tech:intfloat-multilingual-e5-base",
    canonicalName: "intfloat/multilingual-e5-base",
    aliases: ["multilingual-e5-base"],
  },
};

function normalizeTechnologyKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[./_-]+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export type CanonicalTechnology = {
  id: string;
  canonicalName: string;
  aliases: string[];
};

export function canonicalizeTechnology(value: string): CanonicalTechnology {
  const key = normalizeTechnologyKey(value);
  const known = CANONICAL_TECHNOLOGIES[key];

  if (known) {
    return {
      ...known,
      aliases: uniqueStrings([value, known.canonicalName, ...known.aliases]),
    };
  }

  return {
    id: `tech:${toSlug(value)}`,
    canonicalName: value.trim(),
    aliases: uniqueStrings([value]),
  };
}

export function createTechnologyEntity(value: string): KnowledgeEntity {
  const technology = canonicalizeTechnology(value);

  return {
    id: technology.id,
    type: "technology",
    canonicalName: technology.canonicalName,
    aliases: technology.aliases,
    sourceRefs: [],
  };
}

export function buildSkillsIndex(
  facts: readonly KnowledgeFact[],
  relations: readonly KnowledgeRelation[],
  entitiesById: ReadonlyMap<string, KnowledgeEntity>,
) {
  const technologyRelations = relations.filter(
    (relation) =>
      relation.type === "project-technology" ||
      relation.type === "experience-technology",
  );

  const factsById = new Map(facts.map((fact) => [fact.id, fact]));
  const skillsIndex: Record<string, TechnologyEvidenceItem[]> = {};

  technologyRelations.forEach((relation) => {
    const factId = String(relation.metadata?.factId ?? "");
    const fact = factsById.get(factId);
    const sourceEntity = entitiesById.get(relation.fromEntityId);
    const technologyEntity = entitiesById.get(relation.toEntityId);

    if (!fact || !sourceEntity || !technologyEntity) {
      return;
    }

    if (
      sourceEntity.type !== "project" &&
      sourceEntity.type !== "experience"
    ) {
      return;
    }

    const item: TechnologyEvidenceItem = {
      entityId: sourceEntity.id,
      entityType: sourceEntity.type,
      canonicalName: sourceEntity.canonicalName,
      status: fact.status,
      evidence: fact.evidence,
      factId: fact.id,
    };

    skillsIndex[technologyEntity.id] = [
      ...(skillsIndex[technologyEntity.id] ?? []),
      item,
    ];
  });

  return skillsIndex;
}
