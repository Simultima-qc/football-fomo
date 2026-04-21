import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ExternalLink, Flame } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GaLink } from "@/components/shared/GaLink";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { getTop5Today, getExplodingToday, getLatestAvailableDate } from "@/lib/supabase/queries";
import { formatDate, isCurrentUtcDate } from "@/lib/utils";
import type { TrendItemRecord } from "@/lib/supabase/queries";

const BASE_URL = "https://footballfomo.com";

const LEAGUES = [
  { name: "Premier League", slug: "premier-league" },
  { name: "Liga", slug: "la-liga" },
  { name: "Serie A", slug: "serie-a" },
  { name: "MLS", slug: "mls" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "Football News Today | FootballFOMO"
      : "Actualités football aujourd'hui | FootballFOMO",
    description: isEn
      ? "Daily football news, trends and highlights. Everything you need to see in football today."
      : "Actualités, tendances et moments clés du football. Tout ce que vous devez voir aujourd'hui.",
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        en: `${BASE_URL}/en`,
        fr: `${BASE_URL}/fr`,
        "x-default": BASE_URL,
      },
    },
  };
}

async function getHomepageData() {
  const latestDate = await getLatestAvailableDate();
  const date = new Date(latestDate + "T12:00:00Z");
  const [top5, exploding] = await Promise.all([
    getTop5Today(date),
    getExplodingToday(date),
  ]);
  return { top5, exploding, latestDate };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const { top5, exploding, latestDate: todayDate } = await getHomepageData();

  const isFreshDigest = isCurrentUtcDate(todayDate);
  const displayDate = formatDate(`${todayDate}T12:00:00Z`, locale);
  const statusLabel = isFreshDigest
    ? locale === "fr"
      ? "Mis à jour · Aujourd'hui"
      : "Updated · Today"
    : locale === "fr"
      ? `Dernière mise à jour · ${displayDate}`
      : `Last updated · ${displayDate}`;

  return (
    <>
      <Header />
      <main className="flex-1 bg-zinc-950 text-white">

        {/* 1. HERO */}
        <section className="border-b border-zinc-800 bg-gradient-to-b from-emerald-950/30 to-zinc-950">
          <div className="mx-auto max-w-2xl px-4 py-12 md:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-5">
              <Flame className="w-3 h-3" />
              {statusLabel}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-3">
              {t("hero_title")}
            </h1>
            <p className="text-base md:text-lg text-zinc-400 mb-3 max-w-sm mx-auto">
              {t("hero_subtitle")}
            </p>
            <p className="text-sm text-zinc-500 mb-8">{t("hero_proof")}</p>
            <GaLink
              href={`/${locale}/daily/${todayDate}`}
              gaEvent="hero_cta"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-colors"
            >
              {t("hero_cta")} <ArrowRight className="w-5 h-5" />
            </GaLink>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-12">

          {/* 2. TOP NEWS */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">
              {t("top_news_title")}
            </h2>
            {top5.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {top5.slice(0, 3).map((item, i) => (
                  <TopNewsCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    rank={i}
                    dailyHref={`/${locale}/daily/${todayDate}`}
                    isTop={i === 0}
                  />
                ))}
              </div>
            ) : (
              <EmptyState locale={locale} />
            )}
          </section>

          {/* 3. DIGEST COMPLET */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
              {t("digest_title")}
            </h2>
            {exploding.length > 0 ? (
              <div className="divide-y divide-zinc-800/60">
                {exploding.map((item) => (
                  <DigestItem key={item.id} item={item} locale={locale} />
                ))}
              </div>
            ) : (
              <EmptyState locale={locale} />
            )}
          </section>

          {/* 4. CTA RETENTION */}
          <section className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-8 text-center">
            <p className="text-xl font-bold text-white mb-5">
              {t("retention_text")}
            </p>
            <GaLink
              href={`/${locale}/newsletter`}
              gaEvent="newsletter_cta"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base transition-colors"
            >
              {t("retention_cta")} <ArrowRight className="w-4 h-4" />
            </GaLink>
            <p className="mt-3 text-sm text-zinc-500">{t("retention_tagline")}</p>
          </section>

          {/* 5. SECTIONS LIGUES */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
              {t("leagues_title")}
            </h2>
            <div className="flex flex-wrap gap-3">
              {LEAGUES.map((league) => (
                <GaLink
                  key={league.slug}
                  href={`/${locale}/topics/${league.slug}`}
                  gaEvent="league_click"
                  gaParams={{ league: league.name }}
                  className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-sm font-medium text-zinc-300 hover:border-emerald-500/50 hover:text-white transition-colors"
                >
                  {league.name}
                </GaLink>
              ))}
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}

function TopNewsCard({
  item,
  locale,
  rank,
  dailyHref,
  isTop = false,
}: {
  item: TrendItemRecord;
  locale: string;
  rank: number;
  dailyHref: string;
  isTop?: boolean;
}) {
  const title = locale === "fr" ? item.titleFr : item.titleEn;
  const summary = locale === "fr" ? item.shortSummaryFr : item.shortSummaryEn;

  return (
    <GaLink
      href={dailyHref}
      gaEvent="top_news_click"
      gaParams={{ item_id: item.id, rank: rank + 1 }}
      className={`block rounded-xl border bg-zinc-900/60 hover:bg-zinc-900 transition-all ${
        isTop
          ? "border-emerald-500/30 hover:border-emerald-500/50 p-5 sm:row-span-2"
          : "border-zinc-800 hover:border-zinc-700 p-4"
      }`}
    >
      {isTop && (
        <div className="mb-2 text-xs font-semibold text-orange-400">🔥 Top story</div>
      )}
      {item.category && (
        <CategoryBadge
          nameEn={item.category.nameEn}
          nameFr={item.category.nameFr}
          color={item.category.color}
          locale={locale}
        />
      )}
      <h3 className={`mt-2 font-bold text-white leading-snug line-clamp-3 ${isTop ? "text-xl" : "text-sm"}`}>
        {title}
      </h3>
      <p className={`mt-1.5 text-zinc-400 line-clamp-2 ${isTop ? "text-sm" : "text-xs"}`}>
        {summary}
      </p>
    </GaLink>
  );
}

function DigestItem({ item, locale }: { item: TrendItemRecord; locale: string }) {
  const title = locale === "fr" ? item.titleFr : item.titleEn;
  const summary = locale === "fr" ? item.shortSummaryFr : item.shortSummaryEn;
  const source = item.sourceUrl
    ? new URL(item.sourceUrl).hostname.replace("www.", "")
    : null;

  return (
    <div className="py-3.5 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white leading-snug">{title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{summary}</p>
        {source && (
          <a
            href={item.sourceUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-emerald-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {source}
          </a>
        )}
      </div>
    </div>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-zinc-800 text-zinc-600 text-sm">
      {locale === "fr" ? "Aucun contenu pour le moment." : "No content yet."}
    </div>
  );
}
