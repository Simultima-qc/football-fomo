import type { DeduplicationResult, RawArticle } from "./types";

export function dedupeArticles(
  articles: RawArticle[],
  existingUrls: ReadonlySet<string>
): DeduplicationResult {
  const seen = new Set<string>();
  const deduped: RawArticle[] = [];
  let skippedExisting = 0;
  let skippedDuplicate = 0;
  let skippedMissingUrl = 0;

  for (const article of articles) {
    if (!article.url) {
      skippedMissingUrl += 1;
      continue;
    }

    if (existingUrls.has(article.url)) {
      skippedExisting += 1;
      continue;
    }

    if (seen.has(article.url)) {
      skippedDuplicate += 1;
      continue;
    }

    seen.add(article.url);
    deduped.push(article);
  }

  return {
    articles: deduped,
    stats: {
      incoming: articles.length,
      unique: deduped.length,
      skippedExisting,
      skippedDuplicate,
      skippedMissingUrl,
    },
  };
}
