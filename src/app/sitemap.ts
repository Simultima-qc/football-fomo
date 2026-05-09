import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footballfomo.com";
const locales = ["fr", "en"] as const;
const defaultLocale = "en";
const entityRouteByType = {
  CLUB: "clubs",
  PLAYER: "players",
  NATIONAL_TEAM: "national-teams",
  COMPETITION: "competitions",
} as const;

function localizedAlternates(path: string) {
  return {
    languages: {
      ...Object.fromEntries(
        locales.map((locale) => [locale, `${BASE_URL}/${locale}${path}`])
      ),
      "x-default": `${BASE_URL}/${defaultLocale}${path}`,
    },
  };
}

function localizedRoute(
  path: string,
  options: {
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
    lastModified?: Date;
  }
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}/fr${path}`,
    lastModified: options.lastModified ?? new Date(),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: localizedAlternates(path),
  };
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getLastThirtyDays() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - index);
    return date;
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    localizedRoute("/players", {
      changeFrequency: "daily",
      priority: 0.7,
    }),
    localizedRoute("/clubs", {
      changeFrequency: "daily",
      priority: 0.7,
    }),
    localizedRoute("/national-teams", {
      changeFrequency: "daily",
      priority: 0.7,
    }),
    localizedRoute("/competitions", {
      changeFrequency: "daily",
      priority: 0.7,
    }),
  ];

  const dailyRoutes: MetadataRoute.Sitemap = getLastThirtyDays().map((date) =>
    localizedRoute(`/daily/${formatDate(date)}`, {
      lastModified: date,
      changeFrequency: "daily",
      priority: 0.8,
    })
  );

  if (process.env.SUPABASE_BUILD_PLACEHOLDER === "1") {
    return [...staticRoutes, ...dailyRoutes];
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [categoriesResult, entitiesResult] = await Promise.all([
    supabase.from("categories").select("slug").order("slug"),
    supabase
      .from("entities")
      .select("slug, entityType")
      .in("entityType", Object.keys(entityRouteByType))
      .eq("active", true)
      .order("slug"),
  ]);

  const topicRoutes: MetadataRoute.Sitemap = (categoriesResult.data ?? []).map(
    (cat) =>
      localizedRoute(`/topics/${cat.slug}`, {
        changeFrequency: "daily",
        priority: 0.8,
      })
  );

  const entityRoutes: MetadataRoute.Sitemap = (entitiesResult.data ?? []).map(
    (entity) =>
      localizedRoute(
        `/${entityRouteByType[entity.entityType as keyof typeof entityRouteByType]}/${entity.slug}`,
        {
          changeFrequency: "daily",
          priority: 0.8,
        }
      )
  );

  return [...staticRoutes, ...dailyRoutes, ...topicRoutes, ...entityRoutes];
}
