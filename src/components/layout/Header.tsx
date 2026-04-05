"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const otherLocale = locale === "fr" ? "en" : "fr";
  // Build alternate locale URL by replacing the locale prefix
  const altHref = pathname.replace(`/${locale}`, `/${otherLocale}`) || `/${otherLocale}`;

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/daily/${new Date().toISOString().split("T")[0]}`, label: t("daily") },
    { href: `/${locale}/topics/world-cup-2026`, label: "World Cup 2026" },
    // Note: also accessible via /topics/world-cup-2026 (category) or entity page
    { href: `/${locale}/newsletter`, label: t("newsletter") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              Football<span className="text-emerald-400">FOMO</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  pathname === link.href ? "text-white" : "text-zinc-400"
                )}
              >
                {link.label}
              </Link>
            ))}
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white py-1",
                  pathname === link.href ? "text-white" : "text-zinc-400"
                )}
              >
                {link.label}
              </Link>
            ))}
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
