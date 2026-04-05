import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, Flame, TrendingUp, Play, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrendItemCard } from "@/components/shared/TrendItemCard";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { getTop5Today, getExplodingToday, getMustWatchToday } from "@/lib/supabase/queries";

async function getHomepageData() {
  const [top5, exploding, mustWatch] = await Promise.all([
    getTop5Today(),
    getExplodingToday(),
    getMustWatchToday(),
  ]);
  return { top5, exploding, mustWatch };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const todayDate = new Date().toISOString().split("T")[0];

  const data = await getHomepageData();

  const { top5, exploding, mustWatch } = data;

  return (
    <>
      <Header />
      <main className="flex-1 bg-zinc-950 text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
                <Flame className="w-3 h-3" />
                {locale === "fr" ? "Mis à jour · Aujourd'hui" : "Updated · Today"}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
                {t("hero_title")}
              </h1>
              <p className="text-lg text-zinc-400 mb-8">
                {t("hero_subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/${locale}/daily/${todayDate}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-colors"
                >
                  {t("hero_cta")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/${locale}/newsletter`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors"
                >
                  {locale === "fr" ? "Recevoir le digest" : "Get the digest"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* TOP 5 */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-bold">{t("top5_title")}</h2>
              </div>
              <Link
                href={`/${locale}/daily/${todayDate}`}
                className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
              >
                {t("recap_cta")} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {top5.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {top5.slice(0, 3).map((item, i) => (
                  <TrendItemCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    rank={i + 1}
                    variant={i === 0 ? "featured" : "default"}
                  />
                ))}
              </div>
            ) : (
              <EmptyState locale={locale} />
            )}
          </section>

          {/* WHAT'S EXPLODING */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold">{t("exploding_title")}</h2>
            </div>
            {exploding.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {exploding.map((item, i) => (
                  <TrendItemCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    rank={i + 1}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <EmptyState locale={locale} />
            )}
          </section>

          {/* MUST WATCH */}
          {mustWatch.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-5 h-5 text-violet-400" />
                <h2 className="text-xl font-bold">{t("mustwatch_title")}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mustWatch.map((item) => (
                  <TrendItemCard
                    key={item.id}
                    item={item}
                    locale={locale}
                    variant="default"
                  />
                ))}
              </div>
            </section>
          )}

          {/* NEWSLETTER */}
          <section>
            <NewsletterForm variant="section" />
          </section>

          {/* DAILY RECAP CTA */}
          <section className="flex items-center justify-between p-5 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-zinc-500" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {locale === "fr" ? "Recap complet d'aujourd'hui" : "Today's full recap"}
                </p>
                <p className="text-xs text-zinc-500">{todayDate}</p>
              </div>
            </div>
            <Link
              href={`/${locale}/daily/${todayDate}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white transition-colors"
            >
              {t("recap_cta")} <ArrowRight className="w-3 h-3" />
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="flex items-center justify-center h-32 rounded-xl border border-dashed border-zinc-800 text-zinc-600 text-sm">
      {locale === "fr" ? "Aucun contenu pour le moment." : "No content yet."}
    </div>
  );
}
