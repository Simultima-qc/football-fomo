import type { Metadata } from "next";
import { Mail, CheckCircle2, Newspaper, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

interface Props {
  params: Promise<{ locale: string }>;
}

const BASE_URL = "https://footballfomo.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";

  return {
    title: isFr ? "Newsletter Football" : "Football Newsletter",
    description: isFr
      ? "Recois le digest football quotidien avec les sujets, clips et tendances a ne pas manquer."
      : "Get the daily football digest with the stories, clips, and trends worth your attention.",
    alternates: {
      canonical: `${BASE_URL}/${locale}/newsletter`,
      languages: {
        en: `${BASE_URL}/en/newsletter`,
        fr: `${BASE_URL}/fr/newsletter`,
        "x-default": `${BASE_URL}/en/newsletter`,
      },
    },
  };
}

export default async function NewsletterPage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

  const points = isFr
    ? [
        "Le top du jour en lecture rapide.",
        "Les moments viraux et clips a voir.",
        "Une boite mail propre: pas de bruit, juste l'essentiel.",
      ]
    : [
        "A fast read with the top football stories of the day.",
        "Viral moments and clips worth watching.",
        "A cleaner inbox: no noise, just the essentials.",
      ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-zinc-950 text-white">
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 md:py-20">
            <Link
              href={`/${locale}`}
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {isFr ? "Retour a l'accueil" : "Back home"}
            </Link>

            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <Newspaper className="h-3.5 w-3.5" />
                  {isFr ? "Digest quotidien" : "Daily digest"}
                </div>
                <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
                  {isFr
                    ? "Le recap football qui va droit au but."
                    : "The football recap that gets straight to the point."}
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400">
                  {isFr
                    ? "Rejoins la newsletter FootballFOMO pour recevoir chaque jour l'essentiel: sujets chauds, tendances et contenus a voir."
                    : "Join the FootballFOMO newsletter to get the essentials every day: hot stories, trends, and watch-list content."}
                </p>

                <div className="mt-8 grid gap-3">
                  {points.map((point) => (
                    <div
                      key={point}
                      className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      <p className="text-sm text-zinc-300">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {isFr ? "Inscription rapide" : "Quick signup"}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {isFr ? "Une adresse email, et c'est parti." : "One email address and you're in."}
                    </p>
                  </div>
                </div>

                <NewsletterForm variant="section" className="border-0 bg-transparent p-0" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
