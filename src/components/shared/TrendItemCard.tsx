import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Eye, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { TrendBadge } from "./TrendBadge";
import { CategoryBadge } from "./CategoryBadge";
import { Wc2026SimCTA, isWc2026Category } from "./Wc2026SimCTA";
import { cn } from "@/lib/utils";

interface TrendItemCardProps {
  item: {
    id: string;
    slug: string;
    titleEn: string;
    titleFr: string;
    shortSummaryEn: string;
    shortSummaryFr: string;
    whyItMattersEn?: string | null;
    whyItMattersFr?: string | null;
    sourceUrl?: string | null;
    mediaUrl?: string | null;
    trendScore: number;
    mustWatch: boolean;
    category?: { slug?: string | null; nameEn: string; nameFr: string; color?: string | null } | null;
  };
  locale: string;
  rank?: number;
  variant?: "default" | "compact" | "featured";
}

export function TrendItemCard({ item, locale, rank, variant = "default" }: TrendItemCardProps) {
  const t = useTranslations("item");
  const title = locale === "fr" ? item.titleFr : item.titleEn;
  const summary = locale === "fr" ? item.shortSummaryFr : item.shortSummaryEn;
  const whyItMatters = locale === "fr" ? item.whyItMattersFr : item.whyItMattersEn;

  if (variant === "compact") {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
        {rank !== undefined && (
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center">
            {rank}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{title}</h3>
            <TrendBadge score={item.trendScore} className="flex-shrink-0" />
          </div>
          <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{summary}</p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        "group relative rounded-xl border bg-zinc-900/60 hover:bg-zinc-900 transition-all duration-200",
        variant === "featured"
          ? "border-emerald-500/30 shadow-emerald-500/5 shadow-lg"
          : "border-zinc-800/60 hover:border-zinc-700"
      )}
    >
      {/* Rank badge */}
      {rank !== undefined && (
        <div className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-zinc-950 border-2 border-zinc-700 text-zinc-300 text-xs font-bold flex items-center justify-center z-10">
          {rank}
        </div>
      )}

      {/* Media */}
      {item.mediaUrl && (
        <div className="relative w-full h-40 rounded-t-xl overflow-hidden bg-zinc-800">
          <Image
            src={item.mediaUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
      )}

      <div className="p-4">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          {item.category && (
            <CategoryBadge
              nameEn={item.category.nameEn}
              nameFr={item.category.nameFr}
              color={item.category.color}
              locale={locale}
            />
          )}
          <TrendBadge score={item.trendScore} />
          {item.mustWatch && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Star className="w-3 h-3" />
              {t("must_watch")}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white leading-snug mb-2">{title}</h3>

        {/* Summary */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-3">{summary}</p>

        {/* Why it matters */}
        {whyItMatters && (
          <div className="mb-3 pl-3 border-l-2 border-emerald-500/40">
            <p className="text-xs text-zinc-500 font-medium mb-0.5">{t("why_it_matters")}</p>
            <p className="text-xs text-zinc-400">{whyItMatters}</p>
          </div>
        )}

        {/* Source link */}
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {t("see_source")}
          </a>
        )}

        {/* WC 2026 sim CTA — shown for national-teams and world-cup-2026 categories */}
        {isWc2026Category(item.category?.slug) && (
          <Wc2026SimCTA locale={locale} variant="card" />
        )}
      </div>
    </article>
  );
}
