"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface LatestDailyLinkProps {
  locale: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

export function LatestDailyLink({
  locale,
  className,
  children,
  onClick,
}: LatestDailyLinkProps) {
  const [date, setDate] = useState(getTodayDate);

  useEffect(() => {
    let active = true;

    async function loadLatestDate() {
      try {
        const response = await fetch("/api/daily/latest-date", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { date?: string };
        if (active && payload.date) {
          setDate(payload.date);
        }
      } catch {
        // Keep the current date fallback if the latest digest endpoint is unavailable.
      }
    }

    void loadLatestDate();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Link href={`/${locale}/daily/${date}`} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
