import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const locale = useLocale();
  const t = useTranslations("nav");

  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div>
            <Link href={`/${locale}`}>
              <Image
                src="/logo.png"
                alt="Football FOMO"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mt-2 text-sm text-zinc-500 max-w-xs">
              {locale === "fr"
                ? "Tout ce que tu dois voir aujourd'hui dans le football — en 2 minutes."
                : "Everything you need to see in football today — in 2 minutes."}
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                {locale === "fr" ? "Navigation" : "Navigation"}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${locale}`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {t("home")}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/daily/${new Date().toISOString().split("T")[0]}`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {t("daily")}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/newsletter`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {t("newsletter")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                {locale === "fr" ? "Légal" : "Legal"}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href={`/${locale}/about`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {locale === "fr" ? "À propos" : "About"}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/about#methodology`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {locale === "fr" ? "Méthodologie" : "Methodology"}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/privacy`} className="text-sm text-zinc-400 hover:text-white transition-colors">
                    {locale === "fr" ? "Confidentialité" : "Privacy"}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Football FOMO. {locale === "fr" ? "Tous droits réservés." : "All rights reserved."}
          </p>
          <div className="flex gap-4">
            <Link href={`/${locale === "fr" ? "en" : "fr"}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              {locale === "fr" ? "English" : "Français"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
