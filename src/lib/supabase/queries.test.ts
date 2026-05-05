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
    expect(result.map((i) => i.id)).toEqual(["new", "mid", "old"]);
  });

  it("caps the result at displayLimit", () => {
    const entityItems = Array.from({ length: 30 }, (_, i) =>
      makeItem({ id: `e${i}`, publishDate: `2026-04-${String(i + 1).padStart(2, "0")}T00:00:00Z` })
    );
    const categoryItems = Array.from({ length: 30 }, (_, i) =>
      makeItem({ id: `c${i}`, publishDate: `2026-03-${String(i + 1).padStart(2, "0")}T00:00:00Z` })
    );
    const result = mergeAndDeduplicateItems(entityItems, categoryItems, 25);
    expect(result).toHaveLength(25);
  });

  it("returns an empty array when both sources are empty", () => {
    expect(mergeAndDeduplicateItems([], [], 50)).toHaveLength(0);
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
    expect(result.map((i) => i.id)).toEqual(["new", "mid", "old"]);
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
