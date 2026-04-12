import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, Mail, Shield, EyeOff } from "lucide-react";
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
    title: isFr ? "Confidentialite" : "Privacy",
    description: isFr
      ? "Comment FootballFOMO traite les donnees minimales necessaires au fonctionnement du site et de la newsletter."
      : "How FootballFOMO handles the minimum data needed to run the site and newsletter.",
    alternates: {
      canonical: `${BASE_URL}/${locale}/privacy`,
      languages: {
        en: `${BASE_URL}/en/privacy`,
        fr: `${BASE_URL}/fr/privacy`,
        "x-default": `${BASE_URL}/en/privacy`,
      },
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

  const sections = isFr
    ? [
        {
          icon: Mail,
          title: "Newsletter",
          body: "Si tu t'abonnes, nous stockons ton adresse email et ta langue preferee pour envoyer le digest et gerer ton inscription.",
        },
        {
          icon: Shield,
          title: "Usage limite",
          body: "Nous n'utilisons ces donnees que pour faire fonctionner le service, suivre l'etat de l'abonnement et ameliorer l'experience produit.",
        },
        {
          icon: EyeOff,
          title: "Partage",
          body: "Nous ne vendons pas tes donnees personnelles. Les donnees peuvent transiter par nos prestataires techniques lorsqu'elles sont necessaires au service.",
        },
      ]
    : [
        {
          icon: Mail,
          title: "Newsletter data",
          body: "If you subscribe, we store your email address and preferred language so we can deliver the digest and manage your subscription state.",
        },
        {
          icon: Shield,
          title: "Limited use",
          body: "We use that data only to operate the service, track subscription status, and improve the product experience.",
        },
        {
          icon: EyeOff,
          title: "Sharing",
          body: "We do not sell your personal data. Information may pass through technical providers only when required to run the service.",
        },
      ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-zinc-950 text-white">
        <section className="relative overflow-hidden border-b border-zinc-800">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_24%)]" />
          <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 md:py-20">
            <Link
              href={`/${locale}`}
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {isFr ? "Retour a l'accueil" : "Back home"}
            </Link>

            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
                <Lock className="h-3.5 w-3.5" />
                {isFr ? "Vie privee" : "Privacy"}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                {isFr
                  ? "Une politique simple: collecter peu, expliquer clairement."
                  : "A simple policy: collect little, explain clearly."}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-zinc-400">
                {isFr
                  ? "FootballFOMO a besoin de peu d'informations pour fonctionner. Cette page resume ce que nous conservons, pourquoi, et comment demander une suppression ou une mise a jour."
                  : "FootballFOMO needs very little information to operate. This page summarizes what we store, why we store it, and how to request an update or deletion."}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <article key={section.title} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-6">
                  <div className="mb-4 inline-flex rounded-2xl bg-zinc-800 p-3 text-zinc-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">{section.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-8 md:p-10">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {isFr ? "Ce que nous stockons" : "What we store"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {isFr
                    ? "Principalement les donnees necessaires a la newsletter: email, langue et statut d'abonnement. Des donnees techniques standard peuvent aussi etre generees par l'hebergement, la securite et l'analyse de trafic."
                    : "Primarily the data required for the newsletter: email address, language, and subscription status. Standard technical data may also be generated by hosting, security, and traffic analysis."}
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {isFr ? "Tes demandes" : "Your requests"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {isFr
                    ? "Si tu veux corriger, supprimer ou desactiver tes informations, passe par le lien de desinscription lorsqu'il est disponible ou contacte l'equipe produit a l'adresse prevue a cet effet."
                    : "If you want to correct, delete, or deactivate your information, use the unsubscribe flow when available or contact the product team through the designated support channel."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
