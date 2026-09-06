import type { KnowledgeEntity } from "@/features/portfolio-ai/knowledge/knowledge.types";

const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;
const NON_ALNUM_PATTERN = /[^a-z0-9]+/g;

export function normalizeAlias(value: string) {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(NON_ALNUM_PATTERN, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function toSlug(value: string) {
  return normalizeAlias(value).replace(/\s+/g, "-");
}

export function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function buildAliases(entities: readonly KnowledgeEntity[]) {
  const aliases: Record<string, string[]> = {};

  entities.forEach((entity) => {
    uniqueStrings([entity.canonicalName, entity.id, ...entity.aliases]).forEach(
      (alias) => {
        const normalizedAlias = normalizeAlias(alias);

        if (!normalizedAlias) {
          return;
        }

        aliases[normalizedAlias] = uniqueStrings([
          ...(aliases[normalizedAlias] ?? []),
          entity.id,
        ]);
      },
    );
  });

  return aliases;
}
