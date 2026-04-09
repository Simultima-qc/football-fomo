import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const WC2026_URL = "https://wc2026sim.com";

/** Category slugs that qualify for the WC 2026 sim CTA */
export const WC2026_CATEGORY_SLUGS = ["national-teams", "world-cup-2026"] as const;

export function isWc2026Category(slug?: string | null): boolean {
  return WC2026_CATEGORY_SLUGS.includes(slug as (typeof WC2026_CATEGORY_SLUGS)[number]);
}

interface Wc2026SimCTAProps {
  locale: string;
  /** "card" — compact strip inside a TrendItemCard; "section" — standalone block */
  variant?: "card" | "section";
  className?: string;
}

export function Wc2026SimCTA({ locale, variant = "card", className }: Wc2026SimCTAProps) {
  const isFr = locale === "fr";

  if (variant === "section") {
    return (
      <div
        className={cn(
          "rounded-2xl bg-gradient-to-br from-blue-950/60 to-zinc-900 border border-blue-800/40 p-6 md:p-8",
          className
        )}
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl select-none" aria-hidden="true">
            🏆
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              {isFr ? "Coupe du Monde 2026" : "World Cup 2026"}
            </p>
            <h3 className="text-lg font-bold text-white mb-1">
              {isFr
                ? "Simule la Coupe du Monde 2026"
                : "Simulate the 2026 World Cup"}
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              {isFr
                ? "Crée ton propre scénario, choisis tes groupes et vois qui soulève le trophée."
                : "Build your own bracket, pick your groups, and see who lifts the trophy."}
            </p>
            <a
              href={WC2026_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              {isFr ? "Lancer la simulation" : "Start simulating"}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // card variant — compact strip
  return (
    <a
      href={WC2026_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-3 flex items-center justify-between gap-2 rounded-lg",
        "bg-blue-950/40 border border-blue-800/30 px-3 py-2",
        "hover:border-blue-600/50 hover:bg-blue-950/60 transition-colors group",
        className
      )}
    >
      <span className="text-xs text-blue-300 font-medium leading-snug">
        {isFr ? "🏆 Simule la Coupe du Monde 2026" : "🏆 Simulate the 2026 World Cup"}
      </span>
      <span className="flex-shrink-0 text-xs text-blue-400 font-semibold group-hover:text-blue-300 transition-colors inline-flex items-center gap-1">
        wc2026sim.com
        <ExternalLink className="w-3 h-3" />
      </span>
    </a>
  );
}
