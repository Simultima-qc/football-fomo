export const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" },
  { url: "https://www.theguardian.com/football/rss", source: "The Guardian" },
  { url: "https://www.skysports.com/rss/12040", source: "Sky Sports" },
  { url: "https://www.espn.com/espn/rss/soccer/news", source: "ESPN FC" },
  { url: "https://www.lequipe.fr/rss/actu_rss_Football.xml", source: "L'Equipe" },
  { url: "https://rmcsport.bfmtv.com/rss/football/", source: "RMC Sport" },
  { url: "https://www.transfermarkt.com/rss/news", source: "Transfermarkt" },
  { url: "https://theathletic.com/rss-feed/", source: "The Athletic" },
] as const;

export const CATEGORY_SLUGS = [
  "transfers",
  "viral-moments",
  "matches",
  "national-teams",
  "club-football",
  "world-cup-2026",
  "controversies",
  "injuries",
  "social-buzz",
] as const;

export const NON_SOCCER_KEYWORDS = [
  "Big Ten",
  "NCAA",
  "NFL",
  "CFL",
  "college football",
  "national championship basketball",
  "March Madness",
  "Super Bowl",
  "NBA",
  "MLB",
  "NHL",
] as const;

export const ENTITY_VARIANTS: Record<string, string[]> = {
  psg: ["Paris Saint-Germain", "PSG"],
  "vinicius-jr": ["Vinicius Jr", "Vinicius"],
  "kylian-mbappe": ["Kylian Mbappe", "Mbappe"],
  "champions-league": ["UEFA Champions League", "Champions League", "UCL"],
};

export const ANALYSIS_BATCH_SIZE = 5;
export const MAX_ARTICLES_TO_ANALYZE = 40;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
export type StepStatus = "ok" | "partial" | "failed";

export interface FeedSource {
  url: string;
  source: string;
}

export interface RawArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
}

export interface ArticleAnalysis {
  isFootball: boolean;
  slug: string;
  titleEn: string;
  titleFr: string;
  shortSummaryEn: string;
  shortSummaryFr: string;
  whyItMattersEn: string;
  whyItMattersFr: string;
  category: CategorySlug;
  trendScore: number;
  momentum: number;
  editorialPriority: number;
  sourceDiversity: number;
  eventWeight: number;
  mustWatch: boolean;
  featured: boolean;
}

export interface StepIssue {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface DailyDigestLogger {
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, meta?: object): void;
}

export interface FeedFetchStats {
  requested: number;
  succeeded: number;
  failed: number;
  fetched: number;
}

export interface DeduplicationStats {
  incoming: number;
  unique: number;
  skippedExisting: number;
  skippedDuplicate: number;
  skippedMissingUrl: number;
}

export interface AnalysisStats {
  attempted: number;
  accepted: number;
  rejected: number;
  failed: number;
}

export interface LinkingStats {
  candidateItems: number;
  entities: number;
  links: number;
  matchedItems: number;
}

export interface TrendItemInsert {
  id: string;
  slug: string;
  titleEn: string;
  titleFr: string;
  shortSummaryEn: string;
  shortSummaryFr: string;
  whyItMattersEn: string;
  whyItMattersFr: string;
  sourceUrl: string;
  trendScore: number;
  momentum: number;
  editorialPriority: number;
  sourceDiversity: number;
  eventWeight: number;
  mustWatch: boolean;
  featured: boolean;
  categoryId: string | null;
  publishDate: string;
  updatedAt: string;
}

export interface CategoryRow {
  id: string;
  slug: string;
}

export interface TrendItemForLinking {
  id: string;
  titleEn: string;
  shortSummaryEn: string;
}

export interface EntityRow {
  id: string;
  slug: string;
  nameEn: string;
}

export interface TrendItemEntityLink {
  trendItemId: string;
  entityId: string;
}

export interface FeedParserLike {
  parseURL(url: string): Promise<{
    items?: Array<{
      title?: string;
      contentSnippet?: string;
      summary?: string;
      link?: string;
      pubDate?: string;
    }>;
  }>;
}

export interface AnthropicMessageBlock {
  type: string;
  text?: string;
}

export interface AnthropicClientLike {
  messages: {
    create(input: {
      model: string;
      max_tokens: number;
      messages: Array<{ role: "user"; content: string }>;
    }): Promise<{ content: AnthropicMessageBlock[] }>;
  };
}

export interface GeminiClientLike {
  getGenerativeModel(input: { model: string }): {
    generateContent(input: string | { contents: Array<{ role: string; parts: Array<{ text: string }> }> }): Promise<{
      response: {
        text(): string;
      };
    }>;
  };
}

export type AIClient = AnthropicClientLike | GeminiClientLike;

export interface FeedFetchResult {
  status: StepStatus;
  articles: RawArticle[];
  stats: FeedFetchStats;
  issues: StepIssue[];
}

export interface AnalyzeArticleResult {
  status: "accepted" | "rejected" | "failed";
  analysis?: ArticleAnalysis;
  issue?: StepIssue;
}

export type AnalyzeArticleFn = (
  client: any,
  article: RawArticle
) => Promise<AnalyzeArticleResult>;

export interface ParsedAnalysisSuccess {
  ok: true;
  data: ArticleAnalysis;
}

export interface ParsedAnalysisFailure {
  ok: false;
  issue: StepIssue;
}

export type ParsedAnalysisResult = ParsedAnalysisSuccess | ParsedAnalysisFailure;

export interface DeduplicationResult {
  articles: RawArticle[];
  stats: DeduplicationStats;
}

export interface LinkEntitiesResult {
  links: TrendItemEntityLink[];
  stats: LinkingStats;
}

export interface RepositoryResult<T> {
  status: StepStatus;
  data: T;
  issues: StepIssue[];
}

export interface DailyDigestRepository {
  loadCategories(): Promise<RepositoryResult<CategoryRow[]>>;
  loadExistingUrls(sinceIso: string): Promise<RepositoryResult<Set<string>>>;
  upsertTrendItems(items: TrendItemInsert[]): Promise<RepositoryResult<{ count: number }>>;
  loadLinkingInputs(sinceIso: string): Promise<
    RepositoryResult<{ items: TrendItemForLinking[]; entities: EntityRow[] }>
  >;
  upsertEntityLinks(
    links: TrendItemEntityLink[]
  ): Promise<RepositoryResult<{ count: number }>>;
}

export interface DailyDigestRunSummary {
  status: StepStatus;
  counters: {
    fetched: number;
    filtered: number;
    analyzed: number;
    inserted: number;
    linked: number;
    skipped: number;
    failed: number;
  };
  issues: StepIssue[];
}
