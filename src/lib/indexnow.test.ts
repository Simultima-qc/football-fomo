import { describe, expect, it, vi } from "vitest";

import { getIndexNowConfig, isValidIndexNowKey, submitIndexNowUrls } from "./indexnow";

describe("IndexNow helpers", () => {
  it("validates IndexNow keys", () => {
    expect(isValidIndexNowKey("abcd-1234")).toBe(true);
    expect(isValidIndexNowKey("short")).toBe(false);
    expect(isValidIndexNowKey("invalid_key")).toBe(false);
  });

  it("builds config from environment", () => {
    const config = getIndexNowConfig((key) => {
      const env: Record<string, string> = {
        INDEXNOW_KEY: "abcd-1234",
        NEXT_PUBLIC_SITE_URL: "https://footballfomo.com/",
      };

      return env[key];
    });

    expect(config).toMatchObject({
      endpoint: "https://www.bing.com/indexnow",
      key: "abcd-1234",
      keyLocation: "https://footballfomo.com/indexnow-key.txt",
    });
  });

  it("submits deduped URLs to Bing IndexNow", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 202,
      statusText: "Accepted",
    });

    const result = await submitIndexNowUrls({
      endpoint: "https://www.bing.com/indexnow",
      fetchImpl,
      key: "abcd-1234",
      keyLocation: "https://footballfomo.com/abcd-1234.txt",
      siteUrl: new URL("https://footballfomo.com"),
      urls: ["https://footballfomo.com/fr", "https://footballfomo.com/fr"],
    });

    expect(result).toMatchObject({
      accepted: true,
      status: 202,
      submittedUrls: ["https://footballfomo.com/fr"],
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://www.bing.com/indexnow",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          host: "footballfomo.com",
          key: "abcd-1234",
          keyLocation: "https://footballfomo.com/abcd-1234.txt",
          urlList: ["https://footballfomo.com/fr"],
        }),
      })
    );
  });

  it("rejects URLs from another host", async () => {
    await expect(
      submitIndexNowUrls({
        endpoint: "https://www.bing.com/indexnow",
        fetchImpl: vi.fn(),
        key: "abcd-1234",
        keyLocation: "https://footballfomo.com/abcd-1234.txt",
        siteUrl: new URL("https://footballfomo.com"),
        urls: ["https://example.com/fr"],
      })
    ).rejects.toThrow("IndexNow URL host mismatch");
  });
});
