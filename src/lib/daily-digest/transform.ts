import type { ArticleAnalysis, TrendItemInsert } from "./types";

export function toTrendItemInsert(params: {
  analysis: ArticleAnalysis;
  articleUrl: string;
  categoryId: string | null;
  publishDateIso: string;
  dateSlug: string;
  updatedAtIso?: string;
}): TrendItemInsert {
  const { analysis, articleUrl, categoryId, publishDateIso, dateSlug, updatedAtIso } = params;

  return {
    id: crypto.randomUUID(),
    slug: `${analysis.slug}-${dateSlug}`.slice(0, 80),
    titleEn: analysis.titleEn,
    titleFr: analysis.titleFr,
    shortSummaryEn: analysis.shortSummaryEn,
    shortSummaryFr: analysis.shortSummaryFr,
    whyItMattersEn: analysis.whyItMattersEn,
    whyItMattersFr: analysis.whyItMattersFr,
    sourceUrl: articleUrl,
    trendScore: analysis.trendScore,
    momentum: analysis.momentum,
    editorialPriority: analysis.editorialPriority,
    sourceDiversity: analysis.sourceDiversity,
    eventWeight: analysis.eventWeight,
    mustWatch: analysis.mustWatch,
    featured: analysis.featured,
    categoryId,
    publishDate: publishDateIso,
    updatedAt: updatedAtIso ?? new Date().toISOString(),
  };
}
