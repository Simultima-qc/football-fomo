import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrendItemCard } from "@/components/shared/TrendItemCard";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { getCategoryBySlug, getTrendItemsByCategory } from "@/lib/supabase/queries";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const BASE_URL = "https://footballfomo.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const name = locale === "fr" ? category.nameFr : category.nameEn;
  return {
    title: name,
    description: locale === "fr"
      ? `Les derniers sujets football : ${name}`
      : `Latest football topics: ${name}`,
    alternates: {
      canonical: `${BASE_URL}/${locale}/topics/${slug}`,
      languages: {
        en: `${BASE_URL}/en/topics/${slug}`,
        fr: `${BASE_URL}/fr/topics/${slug}`,
        "x-default": `${BASE_URL}/en/topics/${slug}`,
      },
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { locale, slug } = await params;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const items = await getTrendItemsByCategory(category.id);
  const name = locale === "fr" ? category.nameFr : category.nameEn;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "fr" ? "Accueil" : "Home",
        item: `${BASE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "fr" ? "Sujets" : "Topics",
        item: `${BASE_URL}/${locale}/topics`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: `${BASE_URL}/${locale}/topics/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main className="flex-1 bg-zinc-950 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === "fr" ? "Accueil" : "Home"}
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color ?? "#10b981" }}
            />
            <h1 className="text-3xl font-extrabold">{name}</h1>
          </div>

          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item: any, i: number) => (
                <TrendItemCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  rank={i + 1}
                  variant="default"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Tag className="w-10 h-10 text-zinc-700 mb-4" />
              <p className="text-zinc-500">
                {locale === "fr"
                  ? "Aucun contenu pour ce sujet pour le moment."
                  : "No content for this topic yet."}
              </p>
            </div>
          )}

          <div className="mt-12">
            <NewsletterForm variant="section" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
