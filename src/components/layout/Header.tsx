"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LatestDailyLink } from "@/components/shared/LatestDailyLink";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  const exploreLinks = [
    { href: `/${locale}/players`, label: t("players") },
    { href: `/${locale}/clubs`, label: t("clubs") },
    { href: `/${locale}/national-teams`, label: t("national_teams") },
    { href: `/${locale}/competitions`, label: t("competitions") },
  ];

  const isExplorePath = exploreLinks.some((l) => pathname.startsWith(l.href));

  const otherLocale = locale === "fr" ? "en" : "fr";
  // Build alternate locale URL by replacing the locale prefix
  const altHref = pathname.replace(`/${locale}`, `/${otherLocale}`) || `/${otherLocale}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <Image
              src="/logo-header.png"
              alt="Football FOMO"
              width={885}
              height={230}
              className="block h-9 object-contain md:h-11"
              style={{ width: "auto" }}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white",
                pathname === `/${locale}` ? "text-white" : "text-zinc-400"
              )}
            >
              {t("home")}
            </Link>
            <LatestDailyLink
              locale={locale}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white",
                pathname.includes(`/${locale}/daily/`) ? "text-white" : "text-zinc-400"
              )}
            >
              {t("daily")}
            </LatestDailyLink>
            <Link
              href={`/${locale}/topics/world-cup-2026`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white",
                pathname === `/${locale}/topics/world-cup-2026` ? "text-white" : "text-zinc-400"
              )}
            >
              World Cup 2026
            </Link>
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setExploreOpen(false);
              }}
            >
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors hover:text-white",
                  isExplorePath ? "text-white" : "text-zinc-400"
                )}
              >
                {t("explore")}
                <ChevronDown className={cn("w-3 h-3 transition-transform", exploreOpen && "rotate-180")} />
              </button>
              {exploreOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-zinc-800 bg-zinc-900 py-1 shadow-xl z-50">
                  {exploreLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setExploreOpen(false)}
                      className={cn(
                        "block px-4 py-2 text-sm transition-colors hover:text-white hover:bg-zinc-800",
                        pathname.startsWith(item.href) ? "text-white" : "text-zinc-400"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              href={`/${locale}/newsletter`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white",
                pathname === `/${locale}/newsletter` ? "text-white" : "text-zinc-400"
              )}
            >
              {t("newsletter")}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Locale toggle */}
            <Link
              href={altHref}
              className="hidden md:inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              {otherLocale.toUpperCase()}
            </Link>

            {/* Newsletter CTA */}
            <Link
              href={`/${locale}/newsletter`}
              className="hidden md:inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
            >
              {locale === "fr" ? "Newsletter" : "Subscribe"}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white"
              aria-label="Menu"
            >
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <nav className="flex flex-col px-4 py-3 gap-3">
            <Link
              href={`/${locale}`}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white py-1",
                pathname === `/${locale}` ? "text-white" : "text-zinc-400"
              )}
            >
              {t("home")}
            </Link>
            <LatestDailyLink
              locale={locale}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white py-1",
                pathname.includes(`/${locale}/daily/`) ? "text-white" : "text-zinc-400"
              )}
            >
              {t("daily")}
            </LatestDailyLink>
            <Link
              href={`/${locale}/topics/world-cup-2026`}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white py-1",
                pathname === `/${locale}/topics/world-cup-2026` ? "text-white" : "text-zinc-400"
              )}
            >
              World Cup 2026
            </Link>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600 pt-2 pb-1">
                {t("explore")}
              </div>
              {exploreLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block text-sm font-medium transition-colors hover:text-white py-1 pl-3",
                    pathname.startsWith(item.href) ? "text-white" : "text-zinc-400"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href={`/${locale}/newsletter`}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white py-1",
                pathname === `/${locale}/newsletter` ? "text-white" : "text-zinc-400"
              )}
            >
              {t("newsletter")}
            </Link>
            <Link
              href={altHref}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-zinc-400 hover:text-white py-1"
            >
              {otherLocale === "fr" ? "Français" : "English"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
