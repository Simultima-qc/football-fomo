import type { Config } from "@netlify/functions";

import { submitSitemapToIndexNow } from "../../src/lib/indexnow";

const handler = async () => {
  const result = await submitSitemapToIndexNow((key) => Netlify.env.get(key));

  if (!result.accepted) {
    throw new Error(
      `IndexNow submission failed with ${result.status} ${result.statusText}`
    );
  }

  console.log(
    `[indexnow] Submitted ${result.submittedUrls.length} sitemap URLs with status ${result.status}`
  );
};

export default handler;

export const config: Config = {
  schedule: "0 8 * * *", // Every day at 8:00 UTC, after the daily digest jobs.
};
