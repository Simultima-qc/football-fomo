import { createClient } from "./server";

// ─── TREND ITEMS ──────────────────────────────────────────────────────────────

export async function getTrendItemsForDate(date: Date) {
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

  if (error) { console.error("getTrendItemsForDate:", error); return []; }
  return data ?? [];
}

export async function getTop5Today() {
  const supabase = await createClient();
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(); end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("trend_items")
    .select(`*, category:categories(id, slug, nameEn, nameFr, color)`)
    .gte("publishDate", start.toISOString())
    .lte("publishDate", end.toISOString())
    .order("trendScore", { ascending: false })
    .limit(5);

  if (error) { console.error("getTop5Today:", error); return []; }
  return data ?? [];
}

export async function getExplodingToday() {
  const supabase = await createClient();
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(); end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("trend_items")
    .select(`*, category:categories(id, slug, nameEn, nameFr, color)`)
    .gte("publishDate", start.toISOString())
    .lte("publishDate", end.toISOString())
    .order("momentum", { ascending: false })
    .limit(6);

  if (error) { console.error("getExplodingToday:", error); return []; }
  return data ?? [];
}

export async function getMustWatchToday() {
  const supabase = await createClient();
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const end = new Date(); end.setUTCHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("trend_items")
    .select(`*, category:categories(id, slug, nameEn, nameFr, color)`)
    .eq("mustWatch", true)
    .gte("publishDate", start.toISOString())
    .lte("publishDate", end.toISOString())
    .order("trendScore", { ascending: false })
    .limit(3);

  if (error) { console.error("getMustWatchToday:", error); return []; }
  return data ?? [];
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
  return data;
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) { console.error("getCategoryBySlug:", error); return null; }
  return data;
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
  return data ?? [];
}

export async function getTrendItemsByEntity(entityId: string, limit = 20) {
  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("trend_item_entities")
    .select(`trendItem:trend_items(*, category:categories(id, slug, nameEn, nameFr, color))`)
    .eq("entityId", entityId)
    .limit(limit);

  if (error) { console.error("getTrendItemsByEntity:", error); return []; }
  return (links ?? []).map((l: any) => l.trendItem).filter(Boolean);
}

// ─── POSTS ────────────────────────────────────────────────────────────────────

export async function getDailyRecapPost(date: Date) {
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

  if (error) { console.error("getDailyRecapPost:", error); return null; }
  return data;
}

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────

export async function subscribeNewsletter(email: string, locale: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("newsletters")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (existing.status === "UNSUBSCRIBED") {
      await supabase.from("newsletters").update({ status: "ACTIVE", locale }).eq("email", email);
      return { ok: true };
    }
    return { ok: false, reason: "already_subscribed" };
  }

  const { error } = await supabase.from("newsletters").insert({ email, locale });
  if (error) return { ok: false, reason: "server_error" };
  return { ok: true };
}
