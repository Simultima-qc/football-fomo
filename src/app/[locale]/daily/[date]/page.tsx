import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrendItemCard } from "@/components/shared/TrendItemCard";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { getTrendItemsForDate, getDailyRecapPost, getLatestAvailableDate } from "@/lib/supabase/queries";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ locale: string; date: string }>;
}

function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(d.getTime())) return null;
  return d;
}

async function getDailyRecap(date: Date) {
  const [post, trendItems] = await Promise.all([
    getDailyRecapPost(date, { throwOnError: true }),
    getTrendItemsForDate(date, { throwOnError: true }),
  ]);
  return { post, trendItems };
}

const BASE_URL = "https://footballfomo.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, date } = await params;
  const label = locale === "fr" ? `Recap football du ${date}` : `Football recap ${date}`;

  return {
    title: label,
    description:
      locale === "fr"
        ? `Top sujets, moments viraux et tendances football du ${date}.`
        : `Top stories, viral moments and football trends from ${date}.`,
    alternates: {
      canonical: `${BASE_URL}/${locale}/daily/${date}`,
      languages: {
        en: `${BASE_URL}/en/daily/${date}`,
        fr: `${BASE_URL}/fr/daily/${date}`,
        "x-default": `${BASE_URL}/en/daily/${date}`,
      },
    },
  };
}

export default async function DailyRecapPage({ params }: Props) {
  const { locale, date } = await params;
  const t = await getTranslations({ locale, namespace: "daily" });

  const parsedDate = parseDate(date);
  if (!parsedDate) notFound();

  const prevDate = new Date(parsedDate);
  prevDate.setUTCDate(prevDate.getUTCDate() - 1);
  const nextDate = new Date(parsedDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const latestAvailableDate = parseDate(await getLatestAvailableDate());
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const isFuture = parsedDate > today;
  const canGoNext = latestAvailableDate ? nextDate <= latestAvailableDate : nextDate <= today;

  if (isFuture) notFound();

  const data = await getDailyRecap(parsedDate);

  const { post, trendItems } = data;
  const formattedDate = formatDate(parsedDate, locale);

  // Merge: post trend items take priority, fall back to standalone items
  const items = trendItems;

  const itemListJsonLd = items.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: locale === "fr" ? `Recap football du ${date}` : `Football recap ${date}`,
        url: `${BASE_URL}/${locale}/daily/${date}`,
        numberOfItems: items.length,
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: locale === "fr" ? item.titleFr : item.titleEn,
          url: item.sourceUrl ?? `${BASE_URL}/${locale}/daily/${date}`,
        })),
      }
    : null;

  return (
    <>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <Header />
      <main className="flex-1 bg-zinc-950 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          {/* Date nav */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href={`/${locale}/daily/${prevDate.toISOString().split("T")[0]}`}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {locale === "fr" ? "Veille" : "Previous"}
            </Link>

            <div className="flex items-center gap-2 text-zinc-500">
              <Calendar className="w-4 h-4" />
              <span className="text-sm capitalize">{formattedDate}</span>
            </div>

            {canGoNext && (
              <Link
                href={`/${locale}/daily/${nextDate.toISOString().split("T")[0]}`}
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {locale === "fr" ? "Suivant" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {!canGoNext && <div className="w-16" />}
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              {t("title", { date: formattedDate })}
            </h1>
            {post && (
              <div className="text-zinc-400 leading-relaxed">
                {locale === "fr" ? post.summaryFr : post.summaryEn}
              </div>
            )}
          </div>

          {/* Top 10 */}
          {items.length > 0 ? (
            <section className="mb-12">
              <h2 className="text-xl font-bold mb-6">{t("top10_title")}</h2>
              <div className="space-y-4">
                {items.map((item, i) => (
                  <TrendItemCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    rank={i + 1}
                    variant="default"
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-zinc-600 text-lg mb-2">
                {locale === "fr" ? "Aucun contenu pour cette date." : "No content for this date."}
              </p>
              <Link
                href={`/${locale}`}
                className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {locale === "fr" ? "← Retour à l'accueil" : "← Back to home"}
              </Link>
            </div>
          )}

          {/* Post body if exists */}
          {post?.bodyFr && locale === "fr" && (
            <section className="mb-12 prose prose-invert prose-zinc max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.bodyFr }} />
            </section>
          )}
          {post?.bodyEn && locale === "en" && (
            <section className="mb-12 prose prose-invert prose-zinc max-w-none">
              <div dangerouslySetInnerHTML={{ __html: post.bodyEn }} />
            </section>
          )}

          {/* Newsletter */}
          <NewsletterForm variant="section" />
        </div>
      </main>
      <Footer />
    </>
  );
}
