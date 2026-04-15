import Parser from "rss-parser";

import { RSS_FEEDS, type DailyDigestLogger, type FeedFetchResult, type FeedParserLike, type FeedSource, type RawArticle, type StepIssue } from "./types";

interface FetchFeedsOptions {
  since: Date;
  feeds?: readonly FeedSource[];
  parser?: FeedParserLike;
  logger?: DailyDigestLogger;
  maxItemsPerFeed?: number;
}

export async function fetchFeeds({
  since,
  feeds = RSS_FEEDS,
  parser = new Parser({ timeout: 8000 }),
  logger,
  maxItemsPerFeed = 12,
}: FetchFeedsOptions): Promise<FeedFetchResult> {
  const issues: StepIssue[] = [];

  const results = await Promise.all(
    feeds.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        const articles = (parsed.items ?? [])
          .filter((item) => {
            const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
            return publishedAt >= since;
          })
          .slice(0, maxItemsPerFeed)
          .map<RawArticle>((item) => ({
            title: item.title ?? "",
            summary: item.contentSnippet ?? item.summary ?? "",
            url: item.link ?? "",
            source: feed.source,
          }));

        return { feed, articles };
      } catch (error) {
        const issue = {
          code: "feed_fetch_failed",
          message: `RSS fetch failed for ${feed.source}.`,
          meta: {
            feed: feed.source,
            url: feed.url,
            error: error instanceof Error ? error.message : String(error),
          },
        } satisfies StepIssue;
        issues.push(issue);
        logger?.warn(issue.message, issue.meta);
        return { feed, articles: [] as RawArticle[] };
      }
    })
  );

  const articles = results.flatMap((result) => result.articles);
  const failed = issues.length;
  const succeeded = feeds.length - failed;

  return {
    status: failed === 0 ? "ok" : failed === feeds.length ? "failed" : "partial",
    articles,
    stats: {
      requested: feeds.length,
      succeeded,
      failed,
      fetched: articles.length,
    },
    issues,
  };
}
