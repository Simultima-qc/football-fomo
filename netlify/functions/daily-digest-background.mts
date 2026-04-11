import type { Config } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

// ─── Sources ──────────────────────────────────────────────────────────────────

const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" },
  { url: "https://www.theguardian.com/football/rss", source: "The Guardian" },
  { url: "https://www.skysports.com/rss/12040", source: "Sky Sports" },
  { url: "https://www.espn.com/espn/rss/soccer/news", source: "ESPN FC" },
  { url: "https://www.lequipe.fr/rss/actu_rss_Football.xml", source: "L'Équipe" },
  { url: "https://rmcsport.bfmtv.com/rss/football/", source: "RMC Sport" },
  { url: "https://www.transfermarkt.com/rss/news", source: "Transfermarkt" },
  { url: "https://theathletic.com/rss-feed/", source: "The Athletic" },
];

const CATEGORY_SLUGS = [
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

type CategorySlug = (typeof CATEGORY_SLUGS)[number];

interface ArticleAnalysis {
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

interface RawArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
}

// ─── Non-soccer pre-filter ────────────────────────────────────────────────────

const NON_SOCCER_KEYWORDS = [
  "Big Ten", "NCAA", "NFL", "CFL", "college football",
  "national championship basketball", "March Madness",
  "Super Bowl", "NBA", "MLB", "NHL",
];

function isLikelyNonSoccer(article: RawArticle): boolean {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  return NON_SOCCER_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

// ─── RSS Fetching ─────────────────────────────────────────────────────────────

async function fetchFeeds(since: Date): Promise<RawArticle[]> {
  const parser = new Parser({ timeout: 8000 });
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items
        .filter((item) => {
          const pub = item.pubDate ? new Date(item.pubDate) : new Date();
          return pub >= since;
        })
        .slice(0, 12)
        .map((item) => ({
          title: item.title ?? "",
          summary: item.contentSnippet ?? item.summary ?? "",
          url: item.link ?? "",
          source: feed.source,
        }));
    })
  );

  return results.flatMap((r) => {
    if (r.status === "fulfilled") return r.value;
    console.warn("Feed fetch failed:", r.reason?.message ?? r.reason);
    return [];
  });
}

// ─── Claude Analysis ──────────────────────────────────────────────────────────

async function analyzeArticle(
  client: Anthropic,
  article: RawArticle
): Promise<ArticleAnalysis | null> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this association football (soccer) news article. Return ONLY valid JSON, no markdown.

IMPORTANT: This digest covers ONLY association football (soccer). You MUST set "isFootball": false for any article about: American football (NFL, CFL, college football, Big Ten, NCAA football), basketball, baseball, ice hockey, rugby, or any sport other than association football/soccer. If an article mentions teams like Michigan, Big Ten, NFL teams, or college sports programs in a non-soccer context, set "isFootball": false immediately.

Title: ${article.title}
Summary: ${article.summary.slice(0, 500)}
Source: ${article.source}

Return this exact JSON structure:
{
  "isFootball": true/false,
  "slug": "kebab-case-max-60-chars",
  "titleEn": "catchy headline max 80 chars",
  "titleFr": "titre accrocheur max 80 chars",
  "shortSummaryEn": "2 sentences max, factual",
  "shortSummaryFr": "2 phrases max, factuel",
  "whyItMattersEn": "1-2 sentences why fans should care",
  "whyItMattersFr": "1-2 phrases pourquoi les fans devraient s'en soucier",
  "category": one of ${JSON.stringify(CATEGORY_SLUGS)},
  "trendScore": 0-100,
  "momentum": 0-100,
  "editorialPriority": 0-100,
  "sourceDiversity": 0-100,
  "eventWeight": 0-100,
  "mustWatch": true/false,
  "featured": true/false
}`,
        },
      ],
    });

    const raw =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";
    // Strip markdown code blocks if Haiku wraps the response
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(text) as ArticleAnalysis;
  } catch (e) {
    console.error(`Analysis failed for "${article.title}":`, (e as Error).message);
    return null;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async () => {
  const anthropic = new Anthropic({
    apiKey: Netlify.env.get("ANTHROPIC_API_KEY"),
  });

  const supabase = createClient(
    Netlify.env.get("NEXT_PUBLIC_SUPABASE_URL")!,
    Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  console.log(`[daily-digest] Starting for ${today.toISOString().split("T")[0]}`);

  // 1. Fetch categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, slug");
  if (catError) {
    console.error("Failed to fetch categories:", catError);
    return;
  }
  const categoryMap = Object.fromEntries(
    (categories ?? []).map((c: { id: string; slug: string }) => [c.slug, c.id])
  );

  // 2. Fetch already-processed URLs today (avoid duplicates)
  const { data: existing } = await supabase
    .from("trend_items")
    .select("sourceUrl")
    .gte("publishDate", today.toISOString());
  const existingUrls = new Set(
    (existing ?? []).map((i: { sourceUrl: string | null }) => i.sourceUrl).filter(Boolean)
  );

  // 3. Fetch RSS feeds
  const allArticles = await fetchFeeds(today);
  console.log(`[daily-digest] ${allArticles.length} articles fetched`);

  // 4. Deduplicate
  const seen = new Set<string>();
  const uniqueArticles = allArticles.filter((a) => {
    if (!a.url || seen.has(a.url) || existingUrls.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
  console.log(`[daily-digest] ${uniqueArticles.length} new articles to analyze`);

  // 4b. Pre-filter obvious non-soccer articles before sending to Haiku
  const soccerArticles = uniqueArticles.filter((a) => !isLikelyNonSoccer(a));
  const skipped = uniqueArticles.length - soccerArticles.length;
  if (skipped > 0) console.log(`[daily-digest] ${skipped} non-soccer articles skipped by keyword filter`);

  // 5. Analyze in parallel batches of 5
  const BATCH_SIZE = 5;
  const toInsert: object[] = [];
  const dateStr = today.toISOString().split("T")[0];

  for (let i = 0; i < Math.min(soccerArticles.length, 40); i += BATCH_SIZE) {
    const batch = soccerArticles.slice(i, i + BATCH_SIZE);
    const analyses = await Promise.all(
      batch.map((article) => analyzeArticle(anthropic, article))
    );

    for (let j = 0; j < batch.length; j++) {
      const analysis = analyses[j];
      const article = batch[j];
      if (!analysis || !analysis.isFootball) continue;

      toInsert.push({
        id: crypto.randomUUID(),
        slug: `${analysis.slug}-${dateStr}`.slice(0, 80),
        titleEn: analysis.titleEn,
        titleFr: analysis.titleFr,
        shortSummaryEn: analysis.shortSummaryEn,
        shortSummaryFr: analysis.shortSummaryFr,
        whyItMattersEn: analysis.whyItMattersEn,
        whyItMattersFr: analysis.whyItMattersFr,
        sourceUrl: article.url,
        trendScore: analysis.trendScore,
        momentum: analysis.momentum,
        editorialPriority: analysis.editorialPriority,
        sourceDiversity: analysis.sourceDiversity,
        eventWeight: analysis.eventWeight,
        mustWatch: analysis.mustWatch,
        featured: analysis.featured,
        categoryId: categoryMap[analysis.category] ?? null,
        publishDate: today.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // 6. Insert new items (skipped if nothing new this run)
  if (toInsert.length === 0) {
    console.log("[daily-digest] No new items to insert");
  } else {
    const { error: insertError } = await supabase
      .from("trend_items")
      .upsert(toInsert, { onConflict: "slug" });

    if (insertError) {
      console.error("[daily-digest] Insert error:", insertError);
      return;
    }
    console.log(`[daily-digest] ✓ Inserted/updated ${toInsert.length} trend items`);
  }

  // 7. Entity detection — runs on ALL today's items regardless of toInsert,
  // so re-runs are idempotent and a toInsert=0 run still populates entities.
  console.log(`[daily-digest] Step 7 start — querying today's items for entity matching`);

  const [
    { data: realItems, error: realItemsError },
    { data: entities,  error: entitiesError  },
  ] = await Promise.all([
    supabase
      .from("trend_items")
      .select("id, titleEn, shortSummaryEn")
      .gte("publishDate", today.toISOString()),
    supabase
      .from("entities")
      .select("id, slug, nameEn")
      .eq("active", true),
  ]);

  if (realItemsError) console.error("[daily-digest] Step 7 realItems query error:", realItemsError);
  if (entitiesError)  console.error("[daily-digest] Step 7 entities query error:", entitiesError);
  console.log(`[daily-digest] Step 7 — realItems: ${realItems?.length ?? 0}, entities: ${entities?.length ?? 0}`);

  if (!entities || entities.length === 0 || !realItems || realItems.length === 0) {
    console.log("[daily-digest] Step 7 — skipping entity linking (no items or no entities)");
    return;
  }

  // Extra keyword variants for entities whose display name differs from nameEn
  const ENTITY_VARIANTS: Record<string, string[]> = {
    "psg":              ["Paris Saint-Germain", "PSG"],
    "vinicius-jr":      ["Vinicius Jr", "Vinícius", "Vinicius"],
    "kylian-mbappe":    ["Kylian Mbappé", "Mbappé", "Mbappe", "Kylian Mbappe"],
    "champions-league": ["UEFA Champions League", "Champions League", "UCL"],
  };

  type UpsertedItem = { id: string; titleEn: string; shortSummaryEn: string };
  type EntityRow    = { id: string; slug: string; nameEn: string };

  const entityLinks: { trendItemId: string; entityId: string }[] = [];

  for (const item of realItems as UpsertedItem[]) {
    const text = `${item.titleEn} ${item.shortSummaryEn}`.toLowerCase();
    for (const entity of entities as EntityRow[]) {
      const keywords = ENTITY_VARIANTS[entity.slug] ?? [entity.nameEn];
      if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
        entityLinks.push({ trendItemId: item.id, entityId: entity.id });
      }
    }
  }

  if (entityLinks.length === 0) {
    console.log("[daily-digest] No entity matches found in new items");
    return;
  }

  const { error: linkError } = await supabase
    .from("trend_item_entities")
    .upsert(entityLinks, { onConflict: "trendItemId,entityId" });

  if (linkError) {
    console.error("[daily-digest] Entity link error:", linkError);
  } else {
    console.log(`[daily-digest] ✓ Linked ${entityLinks.length} entity relationships`);
  }
};

export const config: Config = {
  schedule: "0 6 * * *", // Every day at 6:00 UTC
};
