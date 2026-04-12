import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballfomo.com";
const locales = ["fr", "en"] as const;

function localizedAlternates(path: string) {
  return {
    languages: {
      ...Object.fromEntries(
        locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`])
      ),
      "x-default": `${BASE_URL}${path || ""}`,
    },
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
    .select("slug")
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
    {
      url: `${BASE_URL}/en/newsletter`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: localizedAlternates("/newsletter"),
    },
    {
      url: `${BASE_URL}/fr/newsletter`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: localizedAlternates("/newsletter"),
    },
    {
      url: `${BASE_URL}/en/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: localizedAlternates("/about"),
    },
    {
      url: `${BASE_URL}/fr/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: localizedAlternates("/about"),
    },
    {
      url: `${BASE_URL}/en/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
      alternates: localizedAlternates("/privacy"),
    },
    {
      url: `${BASE_URL}/fr/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
      alternates: localizedAlternates("/privacy"),
    },
  ];

  const topicRoutes: MetadataRoute.Sitemap = (categories ?? []).map((cat) => ({
    url: `${BASE_URL}/fr/topics/${cat.slug}`,
    lastModified: new Date(),
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
