import { describe, expect, it, vi } from "vitest";

import { analyzeArticleClaude, analyzeArticleGemini } from "./analysis";
import type { AIClient, DailyDigestLogger } from "./types";
import { selectDailyDigestAiProvider } from "../../../netlify/functions/daily-digest-background.mts";

function createLogger(): DailyDigestLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createEnv(values: Record<string, string | undefined>): (key: string) => string | undefined {
  return (key) => values[key];
}

function createAiClient(): AIClient {
  return {
    messages: {
      create: async () => ({ content: [] }),
    },
  };
}

describe("selectDailyDigestAiProvider", () => {
  it("defaults to Anthropic when AI_PROVIDER is not set", () => {
    const logger = createLogger();
    const aiClient = createAiClient();
    const createAnthropicClient = vi.fn(() => aiClient);
    const selection = selectDailyDigestAiProvider(
      createEnv({ ANTHROPIC_API_KEY: "anthropic-key" }),
      logger,
      { createAnthropicClient }
    );

    expect(selection.provider).toBe("anthropic");
    expect(selection.aiClient).toBe(aiClient);
    expect(selection.analyzeArticle).toBe(analyzeArticleClaude);
    expect(createAnthropicClient).toHaveBeenCalledWith("anthropic-key");
    expect(logger.info).toHaveBeenCalledWith("[daily-digest] Using Anthropic provider");
  });

  it("selects Gemini when AI_PROVIDER is gemini", () => {
    const logger = createLogger();
    const aiClient = createAiClient();
    const createGeminiClient = vi.fn(() => aiClient);
    const selection = selectDailyDigestAiProvider(
      createEnv({ AI_PROVIDER: "gemini", GEMINI_API_KEY: "gemini-key" }),
      logger,
      { createGeminiClient }
    );

    expect(selection.provider).toBe("gemini");
    expect(selection.aiClient).toBe(aiClient);
    expect(selection.analyzeArticle).toBe(analyzeArticleGemini);
    expect(createGeminiClient).toHaveBeenCalledWith("gemini-key");
    expect(logger.info).toHaveBeenCalledWith("[daily-digest] Using Gemini provider");
  });

  it("requires the Gemini API key for the Gemini provider", () => {
    expect(() =>
      selectDailyDigestAiProvider(createEnv({ AI_PROVIDER: "gemini" }), createLogger())
    ).toThrow("GEMINI_API_KEY is not set but AI_PROVIDER is gemini");
  });

  it("requires the Anthropic API key for the default provider", () => {
    expect(() => selectDailyDigestAiProvider(createEnv({}), createLogger())).toThrow(
      "ANTHROPIC_API_KEY is not set but AI_PROVIDER is anthropic"
    );
  });
});
