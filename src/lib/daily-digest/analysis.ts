import { z } from "zod";

import { CATEGORY_SLUGS, type AnalyzeArticleResult, type AnthropicClientLike, type ParsedAnalysisResult, type RawArticle } from "./types";

const articleAnalysisSchema = z
  .object({
    isFootball: z.boolean(),
    slug: z.string().trim().min(1).max(60).regex(/^[a-z0-9-]+$/),
    titleEn: z.string().trim().min(1).max(80),
    titleFr: z.string().trim().min(1).max(80),
    shortSummaryEn: z.string().trim().min(1),
    shortSummaryFr: z.string().trim().min(1),
    whyItMattersEn: z.string().trim().min(1),
    whyItMattersFr: z.string().trim().min(1),
    category: z.enum(CATEGORY_SLUGS),
    trendScore: z.number().min(0).max(100),
    momentum: z.number().min(0).max(100),
    editorialPriority: z.number().min(0).max(100),
    sourceDiversity: z.number().min(0).max(100),
    eventWeight: z.number().min(0).max(100),
    mustWatch: z.boolean(),
    featured: z.boolean(),
  })
  .strict();

function stripMarkdownFence(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

function buildPrompt(article: RawArticle): string {
  return `Analyze this association football (soccer) news article. Return ONLY valid JSON, no markdown.

IMPORTANT: This digest covers ONLY association football (soccer). You MUST set "isFootball": false for any article about: American football (NFL, CFL, college football, Big Ten, NCAA football), basketball, baseball, ice hockey, rugby, or any sport other than association football/soccer. If an article mentions teams like Michigan, Big Ten, NFL teams, or college sports programs in a non-soccer context, set "isFootball": false immediately.

Title: ${article.title}
Summary: ${article.summary.slice(0, 500)}
Source: ${article.source}

Return this exact JSON structure:
{
  "isFootball": true/false,
  "slug": "kebab-case-max-60-chars",
  "titleEn": "catchy headline max 80 chars",
  "titleFr": "titre accrocheur max 80 chars",
  "shortSummaryEn": "2 sentences max, factual",
  "shortSummaryFr": "2 phrases max, factuel",
  "whyItMattersEn": "1-2 sentences why fans should care",
  "whyItMattersFr": "1-2 phrases pourquoi les fans devraient s'en soucier",
  "category": one of ${JSON.stringify(CATEGORY_SLUGS)},
  "trendScore": 0-100,
  "momentum": 0-100,
  "editorialPriority": 0-100,
  "sourceDiversity": 0-100,
  "eventWeight": 0-100,
  "mustWatch": true/false,
  "featured": true/false
}`;
}

export function parseArticleAnalysisResponse(raw: string): ParsedAnalysisResult {
  const normalized = stripMarkdownFence(raw);
  if (!normalized) {
    return {
      ok: false,
      issue: {
        code: "ai_empty_response",
        message: "AI provider returned an empty text payload.",
      },
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(normalized);
  } catch (error) {
    return {
      ok: false,
      issue: {
        code: "ai_invalid_json",
        message: "AI provider response was not valid JSON.",
        meta: {
          error: error instanceof Error ? error.message : String(error),
          preview: normalized.slice(0, 200),
        },
      },
    };
  }

  const result = articleAnalysisSchema.safeParse(parsedJson);
  if (!result.success) {
    return {
      ok: false,
      issue: {
        code: "ai_schema_validation_failed",
        message: "AI provider response did not match the expected schema.",
        meta: {
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
    };
  }

  return { ok: true, data: result.data };
}

export async function analyzeArticleClaude(
  client: AnthropicClientLike,
  article: RawArticle
): Promise<AnalyzeArticleResult> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(article) }],
    });

    const textBlock = response.content.find((block) => block.type === "text" && block.text);
    if (!textBlock?.text) {
      return {
        status: "failed",
        issue: {
          code: "anthropic_missing_text_block",
          message: "Anthropic response did not contain a text block.",
          meta: { title: article.title, source: article.source },
        },
      };
    }

    const parsed = parseArticleAnalysisResponse(textBlock.text);
    if (!parsed.ok) {
      return {
        status: "failed",
        issue: {
          ...parsed.issue,
          meta: {
            title: article.title,
            source: article.source,
            ...(parsed.issue.meta ?? {}),
          },
        },
      };
    }

    if (!parsed.data.isFootball) {
      return {
        status: "rejected",
        analysis: parsed.data,
        issue: {
          code: "ai_marked_non_football",
          message: "AI marked the article as non-football.",
          meta: { title: article.title, source: article.source },
        },
      };
    }

    return {
      status: "accepted",
      analysis: parsed.data,
    };
  } catch (error) {
    return {
      status: "failed",
      issue: {
        code: "anthropic_request_failed",
        message: "Anthropic analysis request failed.",
        meta: {
          title: article.title,
          source: article.source,
          error: error instanceof Error ? error.message : String(error),
        },
      },
    };
  }
}

export async function analyzeArticleGemini(
  client: GeminiClientLike,
  article: RawArticle
): Promise<AnalyzeArticleResult> {
  try {
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(buildPrompt(article));
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return {
        status: "failed",
        issue: {
          code: "gemini_empty_response",
          message: "Gemini response was empty.",
          meta: { title: article.title, source: article.source },
        },
      };
    }

    const parsed = parseArticleAnalysisResponse(text);
    if (!parsed.ok) {
      return {
        status: "failed",
        issue: {
          ...parsed.issue,
          meta: {
            title: article.title,
            source: article.source,
            ...(parsed.issue.meta ?? {}),
          },
        },
      };
    }

    if (!parsed.data.isFootball) {
      return {
        status: "rejected",
        analysis: parsed.data,
        issue: {
          code: "ai_marked_non_football",
          message: "AI marked the article as non-football.",
          meta: { title: article.title, source: article.source },
        },
      };
    }

    return {
      status: "accepted",
      analysis: parsed.data,
    };
  } catch (error) {
    return {
      status: "failed",
      issue: {
        code: "gemini_request_failed",
        message: "Gemini analysis request failed.",
        meta: {
          title: article.title,
          source: article.source,
          error: error instanceof Error ? error.message : String(error),
        },
      },
    };
  }
}
