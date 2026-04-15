import { describe, expect, it, vi } from "vitest";

import { analyzeArticleGemini, parseArticleAnalysisResponse } from "./analysis";
import { type RawArticle } from "./types";

function buildValidPayload() {
  return {
    isFootball: true,
    slug: "arsenal-transfer-update",
    titleEn: "Arsenal close in on deal",
    titleFr: "Arsenal se rapproche d'un accord",
    shortSummaryEn: "Arsenal are progressing in talks. The move could be completed soon.",
    shortSummaryFr: "Arsenal avance dans les discussions. Le transfert pourrait aboutir vite.",
    whyItMattersEn: "It strengthens a contender before a key stretch.",
    whyItMattersFr: "Cela renforce un candidat avant une periode cle.",
    category: "transfers",
    trendScore: 81,
    momentum: 72,
    editorialPriority: 78,
    sourceDiversity: 54,
    eventWeight: 76,
    mustWatch: true,
    featured: false,
  };
}

describe("analyzeArticleGemini", () => {
  const mockArticle: RawArticle = {
    title: "Arsenal news",
    summary: "Arsenal are doing things.",
    url: "https://bbc.com/sport/1",
    source: "BBC Sport",
  };

  it("handles successful Gemini response", async () => {
    const mockResponse = {
      response: {
        text: () => JSON.stringify(buildValidPayload()),
      },
    };
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue(mockResponse),
    };
    const mockClient = {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    };

    const result = await analyzeArticleGemini(mockClient as any, mockArticle);

    expect(result.status).toBe("accepted");
    expect(result.analysis?.slug).toBe("arsenal-transfer-update");
    expect(mockClient.getGenerativeModel).toHaveBeenCalledWith({ model: "gemini-2.0-flash" });
  });

  it("handles Gemini rejection for non-football content", async () => {
    const mockResponse = {
      response: {
        text: () => JSON.stringify({ ...buildValidPayload(), isFootball: false }),
      },
    };
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue(mockResponse),
    };
    const mockClient = {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    };

    const result = await analyzeArticleGemini(mockClient as any, mockArticle);

    expect(result.status).toBe("rejected");
    expect(result.issue?.code).toBe("ai_marked_non_football");
  });

  it("handles Gemini request failure", async () => {
    const mockModel = {
      generateContent: vi.fn().mockRejectedValue(new Error("API Error")),
    };
    const mockClient = {
      getGenerativeModel: vi.fn().mockReturnValue(mockModel),
    };

    const result = await analyzeArticleGemini(mockClient as any, mockArticle);

    expect(result.status).toBe("failed");
    expect(result.issue?.code).toBe("gemini_request_failed");
  });
});

describe("parseArticleAnalysisResponse", () => {
  it("rejects non-JSON payloads", () => {
    const result = parseArticleAnalysisResponse("not json at all");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issue.code).toBe("ai_invalid_json");
  });

  it("rejects JSON that does not satisfy the schema", () => {
    const payload = JSON.stringify({
      ...buildValidPayload(),
      category: "breaking-news",
      trendScore: 120,
    });

    const result = parseArticleAnalysisResponse(payload);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issue.code).toBe("ai_schema_validation_failed");
  });

  it("accepts fenced valid JSON", () => {
    const payload = `\`\`\`json\n${JSON.stringify(buildValidPayload())}\n\`\`\``;

    const result = parseArticleAnalysisResponse(payload);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.slug).toBe("arsenal-transfer-update");
  });
});
