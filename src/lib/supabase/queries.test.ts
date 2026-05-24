import { describe, expect, it, vi, beforeEach, afterAll } from "vitest";
import {
  getTrendItemsByEntity,
  getTrendItemsByCategory,
  mergeAndDeduplicateItems,
  type TrendItemRecord,
} from "./queries";

// ─── Supabase mock helpers ────────────────────────────────────────────────────

/**
 * Builds a chainable Supabase query-builder mock.
 * All builder methods return `this` so the fluent chain works.
 * The object is also thenable so `await chain` resolves to `result`.
 */
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  let _result = result;

  const builder: Record<string, unknown> = {
    // Allow changing the resolved value after construction (handy for
    // chaining multiple distinct calls off the same mock client).
    _setResult(r: typeof result) { _result = r; },
    then(onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) {
      return Promise.resolve(_result).then(onFulfilled, onRejected);
    },
  };

  for (const method of ["select", "eq", "order", "limit", "maybeSingle", "gte", "lte"]) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  return builder;
}

/** Creates a mock Supabase client whose `.from()` always returns `builder`. */
function makeMockClient(builder: ReturnType<typeof makeQueryBuilder>) {
  return { from: vi.fn().mockReturnValue(builder) };
}

vi.mock("./server", () => ({
  createClient: vi.fn(),
}));

// Import after mock registration so the mock is in place.
import { createClient } from "./server";

const originalSupabaseBuildPlaceholder = process.env.SUPABASE_BUILD_PLACEHOLDER;

beforeEach(() => {
  process.env.SUPABASE_BUILD_PLACEHOLDER = "0";
});

afterAll(() => {
  if (originalSupabaseBuildPlaceholder === undefined) {
    delete process.env.SUPABASE_BUILD_PLACEHOLDER;
    return;
  }
  process.env.SUPABASE_BUILD_PLACEHOLDER = originalSupabaseBuildPlaceholder;
});

// ─── Fixture factory ──────────────────────────────────────────────────────────

function makeItem(overrides: Partial<TrendItemRecord> = {}): TrendItemRecord {
  return {
    id: "item-1",
    slug: "some-article",
    titleEn: "Title EN",
    titleFr: "Title FR",
    shortSummaryEn: "Summary EN",
    shortSummaryFr: "Summary FR",
    trendScore: 50,
    mustWatch: false,
    publishDate: "2026-04-30T10:00:00Z",
    ...overrides,
  };
}

function ids(items: TrendItemRecord[]): string[] {
  return items.map((item) => item.id);
}

function expectOrderBeforeLimit(builder: ReturnType<typeof makeQueryBuilder>) {
  const order = vi.mocked(builder.order as ReturnType<typeof vi.fn>);
  const limit = vi.mocked(builder.limit as ReturnType<typeof vi.fn>);
  expect(order.mock.invocationCallOrder[0]).toBeLessThan(limit.mock.invocationCallOrder[0]);
}

// ─── mergeAndDeduplicateItems ─────────────────────────────────────────────────

describe("mergeAndDeduplicateItems", () => {
  it("returns entity items when there are no category items", () => {
    const entityItems = [makeItem({ id: "a" }), makeItem({ id: "b" })];
    const result = mergeAndDeduplicateItems(entityItems, [], 50);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("appends category items that are not already in entity items", () => {
    const entityItems = [makeItem({ id: "a" })];
    const categoryItems = [makeItem({ id: "b" }), makeItem({ id: "c" })];
    const result = mergeAndDeduplicateItems(entityItems, categoryItems, 50);
    expect(result.map((i) => i.id)).toContain("b");
    expect(result.map((i) => i.id)).toContain("c");
    expect(result).toHaveLength(3);
  });

  it("deduplicates items that appear in both sources (entity wins)", () => {
    const shared = makeItem({ id: "dup", titleEn: "from entity" });
    const duplicate = makeItem({ id: "dup", titleEn: "from category" });
    const result = mergeAndDeduplicateItems([shared], [duplicate, makeItem({ id: "new" })], 50);
    expect(result.filter((i) => i.id === "dup")).toHaveLength(1);
    expect(result.find((i) => i.id === "dup")?.titleEn).toBe("from entity");
  });

  it("sorts the merged list by publishDate DESC", () => {
    const older = makeItem({ id: "old", publishDate: "2026-04-28T10:00:00Z" });
    const newer = makeItem({ id: "new", publishDate: "2026-04-30T10:00:00Z" });
    const middle = makeItem({ id: "mid", publishDate: "2026-04-29T10:00:00Z" });
    const result = mergeAndDeduplicateItems([older, newer], [middle], 50);
    expect(ids(result)).toEqual(["new", "mid", "old"]);
  });

  it("caps the result at displayLimit after merge and publishDate DESC sort", () => {
    const staleEntityItems = Array.from({ length: 5 }, (_, i) =>
      makeItem({ id: `old-entity-${i}`, publishDate: `2026-04-0${i + 1}T00:00:00Z` })
    );
    const recentCategoryItems = [
      makeItem({ id: "category-new-1", publishDate: "2026-05-04T00:00:00Z" }),
      makeItem({ id: "category-new-2", publishDate: "2026-05-03T00:00:00Z" }),
      makeItem({ id: "category-new-3", publishDate: "2026-05-02T00:00:00Z" }),
      makeItem({ id: "category-new-4", publishDate: "2026-05-01T00:00:00Z" }),
    ];

    const result = mergeAndDeduplicateItems(staleEntityItems, recentCategoryItems, 3);

    expect(ids(result)).toEqual(["category-new-1", "category-new-2", "category-new-3"]);
  });

  it("returns an empty array when both sources are empty", () => {
    expect(mergeAndDeduplicateItems([], [], 50)).toHaveLength(0);
  });

  it("deduplicates before applying the display cap", () => {
    const entityItems = [
      makeItem({ id: "shared", titleEn: "from entity", publishDate: "2026-05-04T00:00:00Z" }),
      makeItem({ id: "second", publishDate: "2026-05-03T00:00:00Z" }),
    ];
    const categoryItems = [
      makeItem({ id: "shared", titleEn: "from category", publishDate: "2026-05-05T00:00:00Z" }),
      makeItem({ id: "third", publishDate: "2026-05-02T00:00:00Z" }),
    ];

    const result = mergeAndDeduplicateItems(entityItems, categoryItems, 3);

    expect(ids(result)).toEqual(["shared", "second", "third"]);
    expect(result.find((item) => item.id === "shared")?.titleEn).toBe("from entity");
  });

  it("does not depend on either source being pre-sorted by the database", () => {
    const entityItems = [
      makeItem({ id: "entity-old", publishDate: "2026-05-01T00:00:00Z" }),
      makeItem({ id: "entity-new", publishDate: "2026-05-04T00:00:00Z" }),
    ];
    const categoryItems = [
      makeItem({ id: "category-old", publishDate: "2026-05-02T00:00:00Z" }),
      makeItem({ id: "category-new", publishDate: "2026-05-05T00:00:00Z" }),
      makeItem({ id: "category-mid", publishDate: "2026-05-03T00:00:00Z" }),
    ];

    const result = mergeAndDeduplicateItems(entityItems, categoryItems, 50);

    expect(ids(result)).toEqual(["category-new", "entity-new", "category-mid", "category-old", "entity-old"]);
  });
});

// ─── getTrendItemsByEntity ────────────────────────────────────────────────────

describe("getTrendItemsByEntity", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("returns items sorted by publishDate DESC after mapping join rows", async () => {
    const links = [
      { trendItem: makeItem({ id: "old", publishDate: "2026-04-28T10:00:00Z" }) },
      { trendItem: makeItem({ id: "new", publishDate: "2026-04-30T10:00:00Z" }) },
      { trendItem: makeItem({ id: "mid", publishDate: "2026-04-29T10:00:00Z" }) },
    ];
    const builder = makeQueryBuilder({ data: links, error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    const result = await getTrendItemsByEntity("entity-1");
    expect(ids(result)).toEqual(["new", "mid", "old"]);
  });

  it("orders the embedded trend_items relation by publishDate DESC before applying LIMIT", async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    await getTrendItemsByEntity("entity-1", 42);

    expect(vi.mocked(builder.order as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "publishDate",
      { referencedTable: "trend_items", ascending: false }
    );
    expectOrderBeforeLimit(builder);
    expect(vi.mocked(builder.limit as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(42);
  });

  it("handles trendItem returned as a single-element array (Supabase join shape)", async () => {
    const item = makeItem({ id: "wrapped" });
    const links = [{ trendItem: [item] }]; // array shape
    const builder = makeQueryBuilder({ data: links, error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    const result = await getTrendItemsByEntity("entity-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("wrapped");
  });

  it("filters out null trendItems", async () => {
    const links = [
      { trendItem: makeItem({ id: "ok" }) },
      { trendItem: null },
    ];
    const builder = makeQueryBuilder({ data: links, error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    const result = await getTrendItemsByEntity("entity-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ok");
  });

  it("returns an empty array and does not throw on Supabase error", async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: "DB error" } });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    const result = await getTrendItemsByEntity("entity-1");
    expect(result).toEqual([]);
  });

  it("returns an empty array when Supabase returns no rows", async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    const result = await getTrendItemsByEntity("entity-1");
    expect(result).toEqual([]);
  });

  it("passes the custom limit to the query builder", async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    await getTrendItemsByEntity("entity-1", 42);
    expect(vi.mocked(builder.limit as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(42);
  });
});

// ─── getTrendItemsByCategory ──────────────────────────────────────────────────

describe("getTrendItemsByCategory", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("returns items from the query", async () => {
    const items = [
      makeItem({ id: "a", publishDate: "2026-04-30T10:00:00Z" }),
      makeItem({ id: "b", publishDate: "2026-04-29T10:00:00Z" }),
    ];
    const builder = makeQueryBuilder({ data: items, error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    const result = await getTrendItemsByCategory("cat-1");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a");
  });

  it("orders category items by publishDate DESC before applying LIMIT", async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    await getTrendItemsByCategory("cat-1", 75);

    expect(vi.mocked(builder.order as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "publishDate",
      { ascending: false }
    );
    expectOrderBeforeLimit(builder);
    expect(vi.mocked(builder.limit as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(75);
  });

  it("returns an empty array and does not throw on Supabase error", async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: "DB error" } });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    const result = await getTrendItemsByCategory("cat-1");
    expect(result).toEqual([]);
  });

  it("returns an empty array when Supabase returns no rows", async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    const result = await getTrendItemsByCategory("cat-1");
    expect(result).toEqual([]);
  });

  it("passes the custom limit to the query builder", async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    await getTrendItemsByCategory("cat-1", 75);
    expect(vi.mocked(builder.limit as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(75);
  });

  it("filters by the correct categoryId", async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue(makeMockClient(builder) as never);

    await getTrendItemsByCategory("cat-xyz");
    expect(vi.mocked(builder.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith("categoryId", "cat-xyz");
  });
});
