import { analyzeArticleClaude as defaultAnalyzeArticle } from "./analysis";
import { dedupeArticles } from "./dedupe";
import { buildEntityLinks } from "./entity-linking";
import { isLikelyNonSoccer } from "./filter";
import { fetchFeeds as defaultFetchFeeds } from "./rss";
import { toTrendItemInsert } from "./transform";
import {
  ANALYSIS_BATCH_SIZE,
  MAX_ARTICLES_TO_ANALYZE,
  type AIClient,
  type AnalyzeArticleFn,
  type AnalyzeArticleResult,
  type DailyDigestLogger,
  type DailyDigestRepository,
  type DailyDigestRunSummary,
  type RawArticle,
  type StepIssue,
  type StepStatus,
} from "./types";

interface RunDailyDigestOptions {
  aiClient: AIClient;
  repository: DailyDigestRepository;
  logger?: DailyDigestLogger;
  today?: Date;
  batchSize?: number;
  maxArticlesToAnalyze?: number;
  fetchFeeds?: (input: { since: Date; logger?: DailyDigestLogger }) => Promise<{
    status: StepStatus;
    articles: RawArticle[];
    issues: StepIssue[];
    stats: { fetched: number };
  }>;
  analyzeArticle?: AnalyzeArticleFn;
}

function getDateStart(date: Date): Date {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function combineStatuses(statuses: StepStatus[]): StepStatus {
  if (statuses.includes("failed") || statuses.includes("partial")) return "partial";
  return "ok";
}

function createConsoleLogger(): DailyDigestLogger {
  return {
    info(message, meta) {
      console.log(message, meta ?? "");
    },
    warn(message, meta) {
      console.warn(message, meta ?? "");
    },
    error(message, meta) {
      console.error(message, meta ?? "");
    },
  };
}

function logIssues(
  logger: DailyDigestLogger,
  level: "warn" | "error",
  issues: StepIssue[]
): void {
  for (const issue of issues) {
    logger[level](issue.message, issue.meta);
  }
}

export async function runDailyDigest({
  aiClient,
  repository,
  logger = createConsoleLogger(),
  today = new Date(),
  batchSize = ANALYSIS_BATCH_SIZE,
  maxArticlesToAnalyze = MAX_ARTICLES_TO_ANALYZE,
  fetchFeeds = defaultFetchFeeds,
  analyzeArticle = defaultAnalyzeArticle,
}: RunDailyDigestOptions): Promise<DailyDigestRunSummary> {
  const issues: StepIssue[] = [];
  const statuses: StepStatus[] = [];
  const start = getDateStart(today);
  const publishDateIso = start.toISOString();
  const dateSlug = publishDateIso.split("T")[0];

  const counters = {
    fetched: 0,
    filtered: 0,
    analyzed: 0,
    inserted: 0,
    linked: 0,
    skipped: 0,
    failed: 0,
  };

  logger.info("[daily-digest] Starting run", { date: dateSlug });

  const categoriesResult = await repository.loadCategories();
  if (categoriesResult.status === "failed") {
    issues.push(...categoriesResult.issues);
    logIssues(logger, "error", categoriesResult.issues);
    const summary = { status: "failed" as const, counters, issues };
    logger.error("[daily-digest] Aborting after category load failure", { summary });
    return summary;
  }

  const categoryMap = Object.fromEntries(
    categoriesResult.data.map((category) => [category.slug, category.id])
  ) as Record<string, string>;

  const existingUrlsResult = await repository.loadExistingUrls(publishDateIso);
  if (existingUrlsResult.status === "failed") {
    issues.push(...existingUrlsResult.issues);
    logIssues(logger, "error", existingUrlsResult.issues);
    const summary = { status: "failed" as const, counters, issues };
    logger.error("[daily-digest] Aborting after existing URL load failure", { summary });
    return summary;
  }

  const feedsResult = await fetchFeeds({ since: start, logger });
  statuses.push(feedsResult.status);
  issues.push(...feedsResult.issues);
  counters.fetched = feedsResult.articles.length;
  if (feedsResult.issues.length > 0) {
    logIssues(logger, feedsResult.status === "failed" ? "error" : "warn", feedsResult.issues);
  }

  const deduped = dedupeArticles(feedsResult.articles, existingUrlsResult.data);
  counters.skipped +=
    deduped.stats.skippedExisting +
    deduped.stats.skippedDuplicate +
    deduped.stats.skippedMissingUrl;

  const soccerArticles = deduped.articles.filter((article) => !isLikelyNonSoccer(article));
  counters.filtered = soccerArticles.length;
  counters.skipped += deduped.articles.length - soccerArticles.length;

  logger.info("[daily-digest] Feed stage complete", {
    fetched: counters.fetched,
    unique: deduped.stats.unique,
    filtered: counters.filtered,
    skipped: counters.skipped,
    feedStatus: feedsResult.status,
  });

  const articlesToAnalyze = soccerArticles.slice(0, maxArticlesToAnalyze);
  const toInsert = [];

  for (let index = 0; index < articlesToAnalyze.length; index += batchSize) {
    const batch = articlesToAnalyze.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map((article) => analyzeArticle(aiClient, article))
    );

    for (let offset = 0; offset < batch.length; offset += 1) {
      const result = results[offset];
      const article = batch[offset];

      if (result.status === "accepted" && result.analysis) {
        counters.analyzed += 1;
        toInsert.push(
          toTrendItemInsert({
            analysis: result.analysis,
            articleUrl: article.url,
            categoryId: categoryMap[result.analysis.category] ?? null,
            publishDateIso,
            dateSlug,
          })
        );
        continue;
      }

      if (result.status === "rejected") {
        counters.skipped += 1;
        if (result.issue) {
          issues.push(result.issue);
          logger.info("[daily-digest] Article rejected", result.issue.meta);
        }
        continue;
      }

      counters.failed += 1;
      if (result.issue) {
        issues.push(result.issue);
        logger.warn(result.issue.message, result.issue.meta);
      }
    }
  }

  statuses.push(counters.failed > 0 ? (counters.analyzed > 0 ? "partial" : "failed") : "ok");

  if (toInsert.length === 0) {
    logger.info("[daily-digest] No new items to insert", {
      attempted: articlesToAnalyze.length,
      accepted: counters.analyzed,
    });
  } else {
    const insertResult = await repository.upsertTrendItems(toInsert);
    statuses.push(insertResult.status);
    issues.push(...insertResult.issues);

    if (insertResult.status === "failed") {
      counters.failed += toInsert.length;
      logIssues(logger, "error", insertResult.issues);
      const summary = {
        status: "failed" as const,
        counters,
        issues,
      };
      logger.error("[daily-digest] Aborting after trend item upsert failure", { summary });
      return summary;
    }

    counters.inserted = insertResult.data.count;
    logger.info("[daily-digest] Trend items upserted", {
      count: insertResult.data.count,
    });
  }

  const linkingInputs = await repository.loadLinkingInputs(publishDateIso);
  statuses.push(linkingInputs.status);
  issues.push(...linkingInputs.issues);

  if (linkingInputs.status === "failed") {
    logIssues(logger, "error", linkingInputs.issues);
  } else {
    const linking = buildEntityLinks(linkingInputs.data.items, linkingInputs.data.entities);

    if (linking.links.length === 0) {
      logger.info("[daily-digest] No entity matches found", linking.stats);
    } else {
      const upsertLinksResult = await repository.upsertEntityLinks(linking.links);
      statuses.push(upsertLinksResult.status);
      issues.push(...upsertLinksResult.issues);

      if (upsertLinksResult.status === "failed") {
        counters.failed += linking.links.length;
        logIssues(logger, "error", upsertLinksResult.issues);
      } else {
        counters.linked = upsertLinksResult.data.count;
        logger.info("[daily-digest] Entity links upserted", linking.stats);
      }
    }
  }

  const summary = {
    status: combineStatuses(statuses),
    counters,
    issues,
  };

  logger.info("[daily-digest] Run summary", summary);
  return summary;
}
