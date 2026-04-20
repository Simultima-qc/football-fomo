import type { Config } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

import { analyzeArticleClaude, analyzeArticleGemini } from "../../src/lib/daily-digest/analysis";
import { runDailyDigest } from "../../src/lib/daily-digest/pipeline";
import { createDailyDigestRepository } from "../../src/lib/daily-digest/repository";
import type {
  AIClient,
  AnalyzeArticleFn,
  DailyDigestLogger,
} from "../../src/lib/daily-digest/types";

const logger: DailyDigestLogger = {
  info(message, meta) {
    console.log(message, meta ?? "");
  },
  warn(message, meta) {
    console.warn(message, meta ?? "");
  },
  error(message, meta) {
    console.error(message, meta ?? "");
  },
};

type DailyDigestAiProvider = "anthropic" | "gemini";

interface DailyDigestAiSelection {
  aiClient: AIClient;
  analyzeArticle: AnalyzeArticleFn;
  provider: DailyDigestAiProvider;
}

interface DailyDigestAiFactories {
  createAnthropicClient?: (apiKey: string) => AIClient;
  createGeminiClient?: (apiKey: string) => AIClient;
}

export function selectDailyDigestAiProvider(
  getEnv: (key: string) => string | undefined = (key) => Netlify.env.get(key),
  log: DailyDigestLogger = logger,
  factories: DailyDigestAiFactories = {}
): DailyDigestAiSelection {
  const aiProvider = getEnv("AI_PROVIDER") || "anthropic";

  if (aiProvider === "gemini") {
    const apiKey = getEnv("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set but AI_PROVIDER is gemini");
    }

    log.info("[daily-digest] Using Gemini provider");
    return {
      aiClient:
        factories.createGeminiClient?.(apiKey) ??
        (new GoogleGenerativeAI(apiKey) as AIClient),
      analyzeArticle: analyzeArticleGemini as AnalyzeArticleFn,
      provider: "gemini",
    };
  }

  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set but AI_PROVIDER is anthropic");
  }

  log.info("[daily-digest] Using Anthropic provider");
  return {
    aiClient:
      factories.createAnthropicClient?.(apiKey) ??
      (new Anthropic({ apiKey }) as AIClient),
    analyzeArticle: analyzeArticleClaude as AnalyzeArticleFn,
    provider: "anthropic",
  };
}

const handler = async () => {
  const { aiClient, analyzeArticle } = selectDailyDigestAiProvider();

  const supabase = createClient(
    Netlify.env.get("NEXT_PUBLIC_SUPABASE_URL")!,
    Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await runDailyDigest({
    aiClient,
    analyzeArticle,
    repository: createDailyDigestRepository(supabase),
    logger,
  });
};

export default handler;

export const config: Config = {
  schedule: "0 6 * * *", // Every day at 6:00 UTC
};
