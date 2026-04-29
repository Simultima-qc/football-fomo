import sitemap from "@/app/sitemap";

const DEFAULT_INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow";
const DEFAULT_SITE_URL = "https://footballfomo.com";

type EnvReader = (key: string) => string | undefined;

interface IndexNowConfig {
  endpoint: string;
  key: string;
  keyLocation: string;
  siteUrl: URL;
}

interface SubmitIndexNowUrlsOptions extends IndexNowConfig {
  fetchImpl?: typeof fetch;
  urls: string[];
}

export interface IndexNowSubmissionResult {
  accepted: boolean;
  status: number;
  statusText: string;
  submittedUrls: string[];
}

export function isValidIndexNowKey(key: string) {
  return /^[A-Za-z0-9-]{8,128}$/.test(key);
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function envReaderFromProcess(key: string) {
  return process.env[key];
}

export function getIndexNowConfig(
  getEnv: EnvReader = envReaderFromProcess
): IndexNowConfig | null {
  const key = getEnv("INDEXNOW_KEY")?.trim();

  if (!key) {
    return null;
  }

  if (!isValidIndexNowKey(key)) {
    throw new Error(
      "INDEXNOW_KEY must be 8 to 128 characters and contain only letters, numbers, or hyphens."
    );
  }

  const siteUrl = new URL(
    stripTrailingSlash(getEnv("NEXT_PUBLIC_SITE_URL") ?? DEFAULT_SITE_URL)
  );
  const endpoint = getEnv("INDEXNOW_ENDPOINT") ?? DEFAULT_INDEXNOW_ENDPOINT;

  return {
    endpoint,
    key,
    keyLocation: `${siteUrl.origin}/indexnow-key.txt`,
    siteUrl,
  };
}

export async function getSitemapUrls() {
  const entries = await sitemap();
  return entries.map((entry) => entry.url);
}

function dedupeUrls(urls: string[]) {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
}

export async function submitIndexNowUrls({
  endpoint,
  fetchImpl = fetch,
  key,
  keyLocation,
  siteUrl,
  urls,
}: SubmitIndexNowUrlsOptions): Promise<IndexNowSubmissionResult> {
  const submittedUrls = dedupeUrls(urls);
  const host = siteUrl.hostname;

  if (submittedUrls.length === 0) {
    throw new Error("No URLs provided for IndexNow submission.");
  }

  if (submittedUrls.length > 10000) {
    throw new Error("IndexNow supports a maximum of 10,000 URLs per request.");
  }

  for (const url of submittedUrls) {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname !== host) {
      throw new Error(`IndexNow URL host mismatch: ${url}`);
    }
  }

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList: submittedUrls,
    }),
  });

  return {
    accepted: response.status === 200 || response.status === 202,
    status: response.status,
    statusText: response.statusText,
    submittedUrls,
  };
}

export async function submitSitemapToIndexNow(getEnv?: EnvReader) {
  const config = getIndexNowConfig(getEnv);

  if (!config) {
    throw new Error("INDEXNOW_KEY is not set.");
  }

  return submitIndexNowUrls({
    ...config,
    urls: await getSitemapUrls(),
  });
}
