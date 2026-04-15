import { describe, expect, it, vi } from "vitest";

import { runDailyDigest } from "./pipeline";
import type {
  AnalyzeArticleResult,
  AnthropicClientLike,
  DailyDigestLogger,
  DailyDigestRepository,
  RawArticle,
  RepositoryResult,
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
    expect(upsertTrendItems).not.toHaveBeenCalled();
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
});
