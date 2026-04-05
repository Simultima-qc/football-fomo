"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface NewsletterFormProps {
  variant?: "inline" | "section";
  className?: string;
}

export function NewsletterForm({ variant = "inline", className }: NewsletterFormProps) {
  const t = useTranslations("home");
  const nt = useTranslations("newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setStatus("duplicate");
      } else if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className={cn("text-sm font-medium text-emerald-400", className)}>
        ✓ {nt("success")}
      </p>
    );
  }

  if (variant === "section") {
    return (
      <div className={cn("rounded-2xl bg-zinc-900 border border-zinc-800 p-6 md:p-8", className)}>
        <h2 className="text-xl font-bold text-white mb-1">{t("newsletter_title")}</h2>
        <p className="text-zinc-400 text-sm mb-5">{t("newsletter_subtitle")}</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter_placeholder")}
            required
            className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {status === "loading" ? "..." : t("newsletter_cta")}
          </button>
        </form>
        {(status === "error" || status === "duplicate") && (
          <p className="mt-2 text-xs text-red-400">
            {status === "duplicate" ? nt("already_subscribed") : nt("error")}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("newsletter_placeholder")}
        required
        className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {status === "loading" ? "..." : t("newsletter_cta")}
      </button>
    </form>
  );
}
