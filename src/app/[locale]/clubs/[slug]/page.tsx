import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TrendItemCard } from "@/components/shared/TrendItemCard";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { getEntityBySlug, getTrendItemsByEntity, getEntitiesByType } from "@/lib/supabase/queries";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const BASE_URL = "https://footballfomo.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) return {};
  const name = locale === "fr" ? (entity.nameFr ?? entity.nameEn) : entity.nameEn;
  return {
    title: `${name} News`,
    description:
      locale === "fr"
        ? `Dernières actualités sur ${name} — FootballFOMO`
        : `Latest news about ${name} — FootballFOMO`,
    alternates: {
      canonical: `${BASE_URL}/${locale}/clubs/${slug}`,
      languages: {
        en: `${BASE_URL}/en/clubs/${slug}`,
        fr: `${BASE_URL}/fr/clubs/${slug}`,
        "x-default": `${BASE_URL}/en/clubs/${slug}`,
      },
    },
  };
}

export async function generateStaticParams() {
  const entities = await getEntitiesByType("CLUB");
  return entities.map((e: { slug: string }) => ({ slug: e.slug }));
}

export default async function ClubPage({ params }: Props) {
  const { locale, slug } = await params;

  const entity = await getEntityBySlug(slug);
  if (!entity || entity.entityType !== "CLUB") notFound();

  const items = await getTrendItemsByEntity(entity.id);
  const name = locale === "fr" ? (entity.nameFr ?? entity.nameEn) : entity.nameEn;
  const description =
    locale === "fr"
      ? (entity.descriptionFr ?? entity.descriptionEn)
      : entity.descriptionEn;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: locale === "fr" ? "Accueil" : "Home", item: `${BASE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: locale === "fr" ? "Clubs" : "Clubs", item: `${BASE_URL}/${locale}/clubs` },
      { "@type": "ListItem", position: 3, name, item: `${BASE_URL}/${locale}/clubs/${slug}` },
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
            href={`/${locale}/clubs`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === "fr" ? "Clubs" : "Clubs"}
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h1 className="text-3xl font-extrabold">{name}</h1>
          </div>

          {description && (
            <p className="text-zinc-400 text-sm mb-8 max-w-2xl">{description}</p>
          )}

          {!description && <div className="mb-8" />}

          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item: any, i: number) => (
                <TrendItemCard key={item.id} item={item} locale={locale} rank={i + 1} variant="default" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Shield className="w-10 h-10 text-zinc-700 mb-4" />
              <p className="text-zinc-500">
                {locale === "fr"
                  ? "Aucune actualité pour ce club pour le moment."
                  : "No news for this club yet."}
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
