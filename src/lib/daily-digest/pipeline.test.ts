import { describe, expect, it, vi } from "vitest";

import { runDailyDigest } from "./pipeline";
import type {
  AnalyzeArticleResult,
  AnthropicClientLike,
  DailyDigestLogger,
  DailyDigestRepository,
  RawArticle,
  RepositoryResult,
  TrendItemEntityLink,
  TrendItemForLinking,
  TrendItemInsert,
} from "./types";

function createLogger(): DailyDigestLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function ok<T>(data: T): RepositoryResult<T> {
  return { status: "ok", data, issues: [] };
}

function failed<T>(data: T, code: string): RepositoryResult<T> {
  return {
    status: "failed",
    data,
    issues: [{ code, message: code }],
  };
}

function createRepository(overrides: Partial<DailyDigestRepository> = {}): DailyDigestRepository {
  return {
    loadCategories: async () => ok([{ id: "cat-1", slug: "transfers" }]),
    loadExistingUrls: async () => ok(new Set<string>()),
    upsertTrendItems: async (items) => ok({ count: items.length }),
    loadLinkingInputs: async () => ok({ items: [], entities: [] }),
    upsertEntityLinks: async (links) => ok({ count: links.length }),
    ...overrides,
  };
}

const anthropic: AnthropicClientLike = {
  messages: {
    create: async () => ({ content: [] }),
  },
};

const article: RawArticle = {
  title: "Transfer race heats up",
  summary: "A major football transfer is close.",
  url: "https://example.com/transfer",
  source: "BBC Sport",
};

function createArticle(index: number): RawArticle {
  return {
    title: `Transfer race heats up ${index}`,
    summary: "A major football transfer is close.",
    url: `https://example.com/transfer-${index}`,
    source: "BBC Sport",
  };
}

function acceptedAnalysis(): AnalyzeArticleResult {
  return {
    status: "accepted",
    analysis: {
      isFootball: true,
      slug: "transfer-race-heats-up",
      titleEn: "Transfer race heats up",
      titleFr: "La course au transfert s'accelere",
      shortSummaryEn: "Talks are accelerating. A deal may be close.",
      shortSummaryFr: "Les discussions s'accelerent. Un accord se rapproche.",
      whyItMattersEn: "Fans are watching a major squad decision.",
      whyItMattersFr: "Les fans suivent un choix majeur d'effectif.",
      category: "transfers",
      trendScore: 88,
      momentum: 75,
      editorialPriority: 82,
      sourceDiversity: 60,
      eventWeight: 79,
      mustWatch: true,
      featured: true,
    },
  };
}

describe("runDailyDigest", () => {
  it("aborts when categories cannot be loaded", async () => {
    const loadExistingUrls = vi.fn(async () => ok(new Set<string>()));
    const fetchFeeds = vi.fn(async () => ({
      status: "ok" as const,
      articles: [article],
      issues: [],
      stats: { fetched: 1 },
    }));

    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository({
        loadCategories: async () => failed([], "categories_query_failed"),
        loadExistingUrls,
      }),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      fetchFeeds,
      analyzeArticle: async () => acceptedAnalysis(),
    });

    expect(summary.status).toBe("failed");
    expect(summary.issues).toEqual([{ code: "categories_query_failed", message: "categories_query_failed" }]);
    expect(loadExistingUrls).not.toHaveBeenCalled();
    expect(fetchFeeds).not.toHaveBeenCalled();
  });

  it("aborts when existing URLs cannot be loaded", async () => {
    const fetchFeeds = vi.fn(async () => ({
      status: "ok" as const,
      articles: [article],
      issues: [],
      stats: { fetched: 1 },
    }));

    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository({
        loadExistingUrls: async () => failed(new Set<string>(), "existing_urls_query_failed"),
      }),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      fetchFeeds,
      analyzeArticle: async () => acceptedAnalysis(),
    });

    expect(summary.status).toBe("failed");
    expect(summary.issues.some((issue) => issue.code === "existing_urls_query_failed")).toBe(true);
    expect(fetchFeeds).not.toHaveBeenCalled();
  });

  it("skips inserts cleanly when nothing survives analysis", async () => {
    const upsertTrendItems = vi.fn(async () => ok({ count: 0 }));
    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository({ upsertTrendItems }),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      fetchFeeds: async () => ({ status: "ok", articles: [article], issues: [], stats: { fetched: 1 } }),
      analyzeArticle: async () => ({ status: "rejected", issue: { code: "non_football", message: "non_football" } }),
    });

    expect(summary.status).toBe("ok");
    expect(summary.counters.inserted).toBe(0);
    expect(summary.counters.skipped).toBe(1);
    expect(summary.counters.failed).toBe(0);
    expect(upsertTrendItems).not.toHaveBeenCalled();
  });

  it("runs entity linking even when there are no new articles to insert", async () => {
    const existingItem: TrendItemForLinking = {
      id: "item-1",
      titleEn: "PSG push on",
      shortSummaryEn: "Paris Saint-Germain chase Europe.",
    };
    const loadLinkingInputs = vi.fn(async () =>
      ok({
        items: [existingItem],
        entities: [{ id: "entity-1", slug: "psg", nameEn: "Paris Saint-Germain" }],
      })
    );
    const upsertEntityLinks = vi.fn(async (links: TrendItemEntityLink[]) => ok({ count: links.length }));
    const upsertTrendItems = vi.fn(async (items: TrendItemInsert[]) => ok({ count: items.length }));

    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository({
        loadExistingUrls: async () => ok(new Set([article.url])),
        loadLinkingInputs,
        upsertEntityLinks,
        upsertTrendItems,
      }),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      fetchFeeds: async () => ({ status: "ok", articles: [article], issues: [], stats: { fetched: 1 } }),
      analyzeArticle: async () => acceptedAnalysis(),
    });

    expect(summary.status).toBe("ok");
    expect(summary.counters.inserted).toBe(0);
    expect(summary.counters.linked).toBe(1);
    expect(upsertTrendItems).not.toHaveBeenCalled();
    expect(loadLinkingInputs).toHaveBeenCalledWith("2026-04-13T00:00:00.000Z");
    expect(upsertEntityLinks).toHaveBeenCalledWith([{ trendItemId: "item-1", entityId: "entity-1" }]);
  });

  it("surfaces trend item upsert failures as failed runs", async () => {
    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository({
        upsertTrendItems: async () => failed({ count: 0 }, "trend_items_upsert_failed"),
      }),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      fetchFeeds: async () => ({ status: "ok", articles: [article], issues: [], stats: { fetched: 1 } }),
      analyzeArticle: async () => acceptedAnalysis(),
    });

    expect(summary.status).toBe("failed");
    expect(summary.issues.some((issue) => issue.code === "trend_items_upsert_failed")).toBe(true);
    expect(summary.counters.failed).toBe(1);
  });

  it("keeps the run partial when loading linking inputs fails", async () => {
    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository({
        loadLinkingInputs: async () =>
          failed({ items: [], entities: [] }, "trend_items_linking_query_failed"),
      }),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      fetchFeeds: async () => ({ status: "ok", articles: [article], issues: [], stats: { fetched: 1 } }),
      analyzeArticle: async () => acceptedAnalysis(),
    });

    expect(summary.status).toBe("partial");
    expect(summary.counters.inserted).toBe(1);
    expect(summary.counters.linked).toBe(0);
    expect(summary.issues.some((issue) => issue.code === "trend_items_linking_query_failed")).toBe(true);
  });

  it("keeps the run partial when entity link upsert fails after inserts", async () => {
    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository({
        loadLinkingInputs: async () =>
          ok({
            items: [{ id: "item-1", titleEn: "PSG push on", shortSummaryEn: "Paris Saint-Germain chase Europe." }],
            entities: [{ id: "entity-1", slug: "psg", nameEn: "Paris Saint-Germain" }],
          }),
        upsertEntityLinks: async () => failed({ count: 0 }, "entity_links_upsert_failed"),
      }),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      fetchFeeds: async () => ({ status: "ok", articles: [article], issues: [], stats: { fetched: 1 } }),
      analyzeArticle: async () => acceptedAnalysis(),
    });

    expect(summary.status).toBe("partial");
    expect(summary.counters.inserted).toBe(1);
    expect(summary.issues.some((issue) => issue.code === "entity_links_upsert_failed")).toBe(true);
  });

  it("counts rejected AI articles as skipped but failed AI articles as failures", async () => {
    const articles = [createArticle(1), createArticle(2), createArticle(3)];
    const analyzeArticle = vi
      .fn()
      .mockResolvedValueOnce(acceptedAnalysis())
      .mockResolvedValueOnce({
        status: "rejected",
        issue: { code: "ai_marked_non_football", message: "AI marked the article as non-football." },
      } satisfies AnalyzeArticleResult)
      .mockResolvedValueOnce({
        status: "failed",
        issue: { code: "anthropic_request_failed", message: "Anthropic analysis request failed." },
      } satisfies AnalyzeArticleResult);

    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository(),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      fetchFeeds: async () => ({ status: "ok", articles, issues: [], stats: { fetched: articles.length } }),
      analyzeArticle,
    });

    expect(summary.status).toBe("partial");
    expect(summary.counters.analyzed).toBe(1);
    expect(summary.counters.inserted).toBe(1);
    expect(summary.counters.skipped).toBe(1);
    expect(summary.counters.failed).toBe(1);
    expect(summary.issues.map((issue) => issue.code)).toEqual([
      "ai_marked_non_football",
      "anthropic_request_failed",
    ]);
  });

  it("uses the UTC day start for existing URLs, inserts, and linking", async () => {
    const loadExistingUrls = vi.fn(async () => ok(new Set<string>()));
    const upsertTrendItems = vi.fn(async (items: TrendItemInsert[]) => ok({ count: items.length }));
    const loadLinkingInputs = vi.fn(async () => ok({ items: [], entities: [] }));

    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository({
        loadExistingUrls,
        upsertTrendItems,
        loadLinkingInputs,
      }),
      logger: createLogger(),
      today: new Date("2026-04-13T23:45:00-04:00"),
      fetchFeeds: async () => ({ status: "ok", articles: [article], issues: [], stats: { fetched: 1 } }),
      analyzeArticle: async () => acceptedAnalysis(),
    });

    expect(summary.status).toBe("ok");
    expect(loadExistingUrls).toHaveBeenCalledWith("2026-04-14T00:00:00.000Z");
    expect(loadLinkingInputs).toHaveBeenCalledWith("2026-04-14T00:00:00.000Z");
    expect(upsertTrendItems).toHaveBeenCalledTimes(1);
    const inserted = upsertTrendItems.mock.calls[0][0][0];
    expect(inserted.publishDate).toBe("2026-04-14T00:00:00.000Z");
    expect(inserted.slug).toBe("transfer-race-heats-up-2026-04-14");
  });

  it("honors maxArticlesToAnalyze and analyzes in configured batches", async () => {
    const articles = Array.from({ length: 7 }, (_, index) => createArticle(index + 1));
    let activeAnalyses = 0;
    let maxConcurrentAnalyses = 0;
    const analyzeArticle = vi.fn(async () => {
      activeAnalyses += 1;
      maxConcurrentAnalyses = Math.max(maxConcurrentAnalyses, activeAnalyses);
      await new Promise((resolve) => setTimeout(resolve, 0));
      activeAnalyses -= 1;
      return acceptedAnalysis();
    });

    const summary = await runDailyDigest({
      aiClient: anthropic,
      repository: createRepository(),
      logger: createLogger(),
      today: new Date("2026-04-13T10:00:00.000Z"),
      batchSize: 2,
      maxArticlesToAnalyze: 5,
      fetchFeeds: async () => ({ status: "ok", articles, issues: [], stats: { fetched: articles.length } }),
      analyzeArticle,
    });

    expect(summary.status).toBe("ok");
    expect(summary.counters.fetched).toBe(7);
    expect(summary.counters.filtered).toBe(7);
    expect(summary.counters.analyzed).toBe(5);
    expect(summary.counters.inserted).toBe(5);
    expect(analyzeArticle).toHaveBeenCalledTimes(5);
    expect(maxConcurrentAnalyses).toBe(2);
  });
});
