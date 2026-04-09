import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getEntitiesByType } from "@/lib/supabase/queries";

interface Props {
  params: Promise<{ locale: string }>;
}

const BASE_URL = "https://footballfomo.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "fr" ? "Joueurs" : "Players",
    description:
      locale === "fr"
        ? "Suivez l'actualité de vos joueurs préférés sur FootballFOMO."
        : "Follow the latest news about your favourite players on FootballFOMO.",
    alternates: {
      canonical: `${BASE_URL}/${locale}/players`,
      languages: {
        en: `${BASE_URL}/en/players`,
        fr: `${BASE_URL}/fr/players`,
        "x-default": `${BASE_URL}/en/players`,
      },
    },
  };
}

export default async function PlayersIndexPage({ params }: Props) {
  const { locale } = await params;
  const entities = await getEntitiesByType("PLAYER");

  return (
    <>
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
            <User className="w-5 h-5 text-emerald-400" />
            <h1 className="text-3xl font-extrabold">
              {locale === "fr" ? "Joueurs" : "Players"}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {entities.map((entity: any) => {
              const name = locale === "fr" ? (entity.nameFr ?? entity.nameEn) : entity.nameEn;
              return (
                <Link
                  key={entity.id}
                  href={`/${locale}/players/${entity.slug}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{name}</p>
                    {entity.country && (
                      <p className="text-xs text-zinc-500">{entity.country}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
