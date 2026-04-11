import { createClient } from "./server";

interface QueryOptions {
  throwOnError?: boolean;
}

export interface TrendItemCategory {
  slug?: string | null;
  nameEn: string;
  nameFr: string;
  color?: string | null;
}

export interface CategoryRecord extends TrendItemCategory {
  id: string;
}

export interface TrendItemRecord {
  id: string;
  slug: string;
  titleEn: string;
  titleFr: string;
  shortSummaryEn: string;
  shortSummaryFr: string;
  whyItMattersEn?: string | null;
  whyItMattersFr?: string | null;
  sourceUrl?: string | null;
  mediaUrl?: string | null;
  trendScore: number;
  momentum?: number;
  mustWatch: boolean;
  publishDate: string;
  category?: TrendItemCategory | null;
}

export interface EntitySummary {
  id: string;
  slug: string;
  nameEn: string;
  nameFr?: string | null;
  imageUrl?: string | null;
  country?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
}

export interface EntityRecord extends EntitySummary {
  entityType: string;
  active: boolean;
}

interface TrendItemEntityLink {
  trendItem: TrendItemRecord | TrendItemRecord[] | null;
}

// ─── TREND ITEMS ──────────────────────────────────────────────────────────────

export async function getTrendItemsForDate(date: Date, options: QueryOptions = {}) {
  const supabase = await createClient();
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("trend_items")
    .select(`*, category:categories(id, slug, nameEn, nameFr, color)`)
    .gte("publishDate", start.toISOString())
    .lte("publishDate", end.toISOString())
    .order("trendScore", { ascending: false });

  if (error) {
    console.error("getTrendItemsForDate:", error);
    if (options.throwOnError) throw error;
    return [];
  }
  return (data ?? []) as TrendItemRecord[];
}

export async function getLatestAvailableDate(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trend_items")
    .select("publishDate")
    .order("publishDate", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return new Date().toISOString().split("T")[0];
  return data.publishDate.split("T")[0];
}

export async function getTop5Today(date?: Date) {
  const supabase = await createClient();
  const base = date ?? new Date();
  const start = new Date(base); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(base); end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("trend_items")
    .select(`*, category:categories(id, slug, nameEn, nameFr, color)`)
    .gte("publishDate", start.toISOString())
    .lte("publishDate", end.toISOString())
    .order("trendScore", { ascending: false })
    .limit(5);

  if (error) { console.error("getTop5Today:", error); return []; }
  return (data ?? []) as TrendItemRecord[];
}

export async function getExplodingToday(date?: Date) {
  const supabase = await createClient();
  const base = date ?? new Date();
  const start = new Date(base); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(base); end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("trend_items")
    .select(`*, category:categories(id, slug, nameEn, nameFr, color)`)
    .gte("publishDate", start.toISOString())
    .lte("publishDate", end.toISOString())
    .order("momentum", { ascending: false })
    .limit(6);

  if (error) { console.error("getExplodingToday:", error); return []; }
  return (data ?? []) as TrendItemRecord[];
}

export async function getMustWatchToday(date?: Date) {
  const supabase = await createClient();
  const base = date ?? new Date();
  const start = new Date(base); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(base); end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("trend_items")
    .select(`*, category:categories(id, slug, nameEn, nameFr, color)`)
    .eq("mustWatch", true)
    .gte("publishDate", start.toISOString())
    .lte("publishDate", end.toISOString())
    .order("trendScore", { ascending: false })
    .limit(3);

  if (error) { console.error("getMustWatchToday:", error); return []; }
  return (data ?? []) as TrendItemRecord[];
}

// ─── ENTITY PAGES ─────────────────────────────────────────────────────────────

export async function getEntityBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) { console.error("getEntityBySlug:", error); return null; }
  return data as EntityRecord | null;
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) { console.error("getCategoryBySlug:", error); return null; }
  return data as CategoryRecord | null;
}

export async function getTrendItemsByCategory(categoryId: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trend_items")
    .select(`*, category:categories(id, slug, nameEn, nameFr, color)`)
    .eq("categoryId", categoryId)
    .order("trendScore", { ascending: false })
    .limit(limit);

  if (error) { console.error("getTrendItemsByCategory:", error); return []; }
  return (data ?? []) as TrendItemRecord[];
}

export async function getTrendItemsByEntity(entityId: string, limit = 20) {
  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("trend_item_entities")
    .select(`trendItem:trend_items(*, category:categories(id, slug, nameEn, nameFr, color))`)
    .eq("entityId", entityId)
    .limit(limit);

  if (error) { console.error("getTrendItemsByEntity:", error); return []; }
  return ((links ?? []) as unknown as TrendItemEntityLink[])
    .map((link) => Array.isArray(link.trendItem) ? link.trendItem[0] : link.trendItem)
    .filter((item): item is TrendItemRecord => Boolean(item))
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
}

export async function getEntitiesByType(entityType: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entities")
    .select("id, slug, nameEn, nameFr, imageUrl, country, descriptionEn, descriptionFr")
    .eq("entityType", entityType)
    .eq("active", true)
    .order("nameEn");

  if (error) { console.error("getEntitiesByType:", error); return []; }
  return (data ?? []) as EntitySummary[];
}

// ─── POSTS ────────────────────────────────────────────────────────────────────

export async function getDailyRecapPost(date: Date, options: QueryOptions = {}) {
  const supabase = await createClient();
  const start = new Date(date); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date); end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("type", "DAILY_RECAP")
    .eq("status", "PUBLISHED")
    .gte("publishDate", start.toISOString())
    .lte("publishDate", end.toISOString())
    .maybeSingle();

  if (error) {
    console.error("getDailyRecapPost:", error);
    if (options.throwOnError) throw error;
    return null;
  }
  return data;
}

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────

export async function subscribeNewsletter(email: string, locale: string) {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("newsletters")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existingError) return { ok: false, reason: "server_error" } as const;

  if (existing) {
    if (existing.status === "UNSUBSCRIBED") {
      const { error: updateError } = await supabase
        .from("newsletters")
        .update({ status: "ACTIVE", locale })
        .eq("email", email);

      if (updateError) return { ok: false, reason: "server_error" } as const;
      return { ok: true };
    }
    return { ok: false, reason: "already_subscribed" } as const;
  }

  const { error } = await supabase.from("newsletters").insert({ email, locale });
  if (error) return { ok: false, reason: "server_error" } as const;
  return { ok: true };
}
