import { ENTITY_VARIANTS, type EntityRow, type LinkEntitiesResult, type TrendItemForLinking } from "./types";

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buildEntityLinks(
  items: TrendItemForLinking[],
  entities: EntityRow[],
  variants: Record<string, string[]> = ENTITY_VARIANTS
): LinkEntitiesResult {
  const links = new Map<string, { trendItemId: string; entityId: string }>();
  const matchedItems = new Set<string>();

  for (const item of items) {
    const text = normalizeForMatch(`${item.titleEn} ${item.shortSummaryEn}`);

    for (const entity of entities) {
      const keywords = (variants[entity.slug] ?? [entity.nameEn]).map(normalizeForMatch);
      if (keywords.some((keyword) => text.includes(keyword))) {
        const key = `${item.id}:${entity.id}`;
        links.set(key, { trendItemId: item.id, entityId: entity.id });
        matchedItems.add(item.id);
      }
    }
  }

  return {
    links: [...links.values()],
    stats: {
      candidateItems: items.length,
      entities: entities.length,
      links: links.size,
      matchedItems: matchedItems.size,
    },
  };
}
