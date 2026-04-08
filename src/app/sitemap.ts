import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballfomo.com";
const locales = ["fr", "en"] as const;

function localizedAlternates(path: string) {
  return {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`])
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch category slugs
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, updatedAt")
    .order("slug");

  // Fetch published daily digest dates
  const { data: posts } = await supabase
    .from("posts")
    .select("publishDate")
    .eq("type", "DAILY_RECAP")
    .eq("status", "PUBLISHED")
    .order("publishDate", { ascending: false })
    .limit(90);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: localizedAlternates(""),
    },
    {
      url: `${BASE_URL}/fr`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: localizedAlternates(""),
    },
  ];

  const topicRoutes: MetadataRoute.Sitemap = (categories ?? []).map((cat) => ({
    url: `${BASE_URL}/fr/topics/${cat.slug}`,
    lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
    alternates: localizedAlternates(`/topics/${cat.slug}`),
  }));

  const dailyRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => {
    const date = post.publishDate.slice(0, 10);
    return {
      url: `${BASE_URL}/fr/daily/${date}`,
      lastModified: new Date(post.publishDate),
      changeFrequency: "never" as const,
      priority: 0.6,
      alternates: localizedAlternates(`/daily/${date}`),
    };
  });

  return [...staticRoutes, ...topicRoutes, ...dailyRoutes];
}
