import { describe, expect, it } from "vitest";

import { dedupeArticles } from "./dedupe";

describe("dedupeArticles", () => {
  it("drops existing and duplicate slugs/URLs before analysis", () => {
    const result = dedupeArticles(
      [
        { title: "A", summary: "", url: "https://example.com/a", source: "BBC" },
        { title: "A duplicate", summary: "", url: "https://example.com/a", source: "BBC" },
        { title: "B existing", summary: "", url: "https://example.com/b", source: "BBC" },
      ],
      new Set(["https://example.com/b"])
    );

    expect(result.articles).toHaveLength(1);
    expect(result.stats.skippedDuplicate).toBe(1);
    expect(result.stats.skippedExisting).toBe(1);
  });
});
