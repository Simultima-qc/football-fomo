import { describe, expect, it } from "vitest";

import { buildEntityLinks } from "./entity-linking";

describe("buildEntityLinks", () => {
  it("matches known aliases and de-duplicates links", () => {
    const result = buildEntityLinks(
      [
        {
          id: "item-1",
          titleEn: "PSG expect Mbappe-sized response in Europe",
          shortSummaryEn: "Paris Saint-Germain lean on UCL experience in the tie.",
        },
      ],
      [
        { id: "entity-1", slug: "psg", nameEn: "Paris Saint-Germain" },
        { id: "entity-2", slug: "champions-league", nameEn: "UEFA Champions League" },
      ]
    );

    expect(result.links).toEqual([
      { trendItemId: "item-1", entityId: "entity-1" },
      { trendItemId: "item-1", entityId: "entity-2" },
    ]);
    expect(result.stats.matchedItems).toBe(1);
  });
});
