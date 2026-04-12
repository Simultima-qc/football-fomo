import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Radar, ShieldCheck, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Props {
  params: Promise<{ locale: string }>;
}

const BASE_URL = "https://footballfomo.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === "fr";

  return {
    title: isFr ? "A propos de Football FOMO" : "About Football FOMO",
    description: isFr
      ? "Comprendre comment FootballFOMO selectionne, structure et priorise les sujets football du jour."
      : "Learn how FootballFOMO selects, structures, and prioritizes the football stories worth your attention.",
    alternates: {
      canonical: `${BASE_URL}/${locale}/about`,
      languages: {
        en: `${BASE_URL}/en/about`,
        fr: `${BASE_URL}/fr/about`,
        "x-default": `${BASE_URL}/en/about`,
      },
    },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

  const principles = isFr
    ? [
        "On vise la clarte: un tri severe pour faire ressortir ce qui compte vraiment.",
        "On privilegie le signal: sujets chauds, moments viraux, dynamique reelle, contexte utile.",
        "On pense lecteur: rapide a lire, facile a scanner, utile meme si tu n'as que deux minutes.",
      ]
    : [
        "We optimize for clarity: aggressive filtering so the truly relevant stories rise to the top.",
        "We prioritize signal: hot topics, viral moments, real momentum, and useful context.",
        "We design for readers: fast to scan, easy to understand, still useful in two minutes or less.",
      ];

  const methodology = isFr
    ? [
        {
          title: "Collecter",
          text: "Nous agregons des sources football et suivons les sujets emergents au fil de la journee.",
        },
        {
          title: "Qualifier",
          text: "Chaque sujet est evalue selon sa traction, son importance editoriale et son interet fan.",
        },
        {
          title: "Rendre lisible",
          text: "Nous transformons le bruit en recap: titres nets, contexte court, liens source, hierarchie claire.",
        },
      ]
    : [
        {
          title: "Collect",
          text: "We aggregate football sources and track the stories gaining traction during the day.",
        },
        {
          title: "Qualify",
          text: "Each item is evaluated for momentum, editorial importance, and real fan relevance.",
        },
        {
          title: "Make it readable",
          text: "We turn noise into a recap: sharp headlines, short context, source links, and clear hierarchy.",
        },
      ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-zinc-950 text-white">
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_24%)]" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 md:py-20">
            <Link
              href={`/${locale}`}
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {isFr ? "Retour a l'accueil" : "Back home"}
            </Link>

            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {isFr ? "Manifesto editorial" : "Editorial manifesto"}
                </div>
                <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
                  {isFr
                    ? "FootballFOMO est concu pour reduire le bruit, pas pour en ajouter."
                    : "FootballFOMO is built to reduce noise, not add to it."}
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-400">
                  {isFr
                    ? "Le football produit un flux permanent d'alertes, de rumeurs, de clips et de reactions. Notre travail consiste a transformer ce volume en un digest net, rapide et utile."
                    : "Football creates a constant stream of alerts, rumors, clips, and reactions. Our job is to turn that volume into a digest that feels clear, fast, and useful."}
                </p>
              </div>

              <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                    <Radar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {isFr ? "Ce qu'on optimise" : "What we optimize for"}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {isFr ? "Clarte, vitesse, contexte." : "Clarity, speed, context."}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {principles.map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      <p className="text-sm leading-relaxed text-zinc-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="methodology" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              {isFr ? "Methodologie" : "Methodology"}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              {isFr ? "Une lecture editoriale en trois temps." : "A three-step editorial flow."}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {methodology.map((item, index) => (
              <article
                key={item.title}
                className="relative overflow-hidden rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-6"
              >
                <div className="absolute right-5 top-5 text-5xl font-black leading-none text-zinc-800">
                  0{index + 1}
                </div>
                <h3 className="relative text-xl font-bold text-white">{item.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-zinc-800 bg-[linear-gradient(135deg,rgba(24,24,27,0.96),rgba(39,39,42,0.8))] p-8 md:p-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {isFr ? "Transparence" : "Transparency"}
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {isFr
                    ? "Pas de promesse magique, juste une meilleure facon de suivre l'actualite."
                    : "No magic promise, just a better way to follow the daily football cycle."}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {isFr
                    ? "FootballFOMO ne remplace ni les medias ni les analyses longues. Il sert de couche de tri: ce qu'il faut voir, pourquoi cela compte, et ou aller plus loin."
                    : "FootballFOMO does not replace full reporting or long-form analysis. It acts as a filtering layer: what to see, why it matters, and where to go deeper."}
                </p>
              </div>

              <Link
                href={`/${locale}/newsletter`}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-400"
              >
                {isFr ? "Recevoir le digest" : "Get the digest"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
