import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

function getUtcDayBounds(date: Date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

const handler = async () => {
  const supabase = createClient(
    Netlify.env.get("NEXT_PUBLIC_SUPABASE_URL")!,
    Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const { start, end } = getUtcDayBounds(now);
  const today = start.toISOString().split("T")[0];

  console.log(`[daily-digest-watchdog] Checking content freshness for ${today}`);

  const [
    { count: trendCount, error: trendError },
    { data: latestItem, error: latestError },
  ] = await Promise.all([
    supabase
      .from("trend_items")
      .select("id", { count: "exact", head: true })
      .gte("publishDate", start.toISOString())
      .lte("publishDate", end.toISOString()),
    supabase
      .from("trend_items")
      .select("publishDate")
      .order("publishDate", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (trendError) {
    console.error("[daily-digest-watchdog] Failed to count today's trend items:", trendError);
    throw trendError;
  }

  if (latestError) {
    console.error("[daily-digest-watchdog] Failed to load latest trend item date:", latestError);
    throw latestError;
  }

  const latestDate = latestItem?.publishDate?.split("T")[0] ?? "none";

  if (!trendCount) {
    const message =
      `[daily-digest-watchdog] No trend_items found for ${today}. ` +
      `Latest available date is ${latestDate}. Daily digest automation may have failed.`;
    console.error(message);
    throw new Error(message);
  }

  console.log(
    `[daily-digest-watchdog] OK: found ${trendCount} trend items for ${today} (latest=${latestDate})`
  );
};

export default handler;

export const config: Config = {
  schedule: "30 7 * * *", // Every day at 7:30 UTC, after the main digest cron
};
