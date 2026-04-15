import { describe, expect, it } from "vitest";

import { fetchFeeds } from "./rss";
import type { FeedParserLike } from "./types";

describe("fetchFeeds", () => {
  it("returns failed when every feed errors", async () => {
    const parser: FeedParserLike = {
      async parseURL() {
        throw new Error("boom");
      },
    };

    const result = await fetchFeeds({
      since: new Date("2026-04-13T00:00:00.000Z"),
      feeds: [
        { source: "One", url: "https://one.test/rss" },
        { source: "Two", url: "https://two.test/rss" },
      ],
      parser,
    });

    expect(result.status).toBe("failed");
    expect(result.articles).toHaveLength(0);
    expect(result.issues).toHaveLength(2);
  });

  it("returns partial when only some feeds fail", async () => {
    const parser: FeedParserLike = {
      async parseURL(url) {
        if (url.includes("bad")) {
          throw new Error("timeout");
        }
        return {
          items: [
            {
              title: "Late winner sends club top",
              contentSnippet: "A big soccer result.",
              link: "https://good.test/article",
              pubDate: "2026-04-13T06:00:00.000Z",
            },
          ],
        };
      },
    };

    const result = await fetchFeeds({
      since: new Date("2026-04-13T00:00:00.000Z"),
      feeds: [
        { source: "Good", url: "https://good.test/rss" },
        { source: "Bad", url: "https://bad.test/rss" },
      ],
      parser,
    });

    expect(result.status).toBe("partial");
    expect(result.articles).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
  });
});
