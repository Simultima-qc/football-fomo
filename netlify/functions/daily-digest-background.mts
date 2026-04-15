import type { Config } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

import { analyzeArticleClaude, analyzeArticleGemini } from "../../src/lib/daily-digest/analysis";
import { runDailyDigest } from "../../src/lib/daily-digest/pipeline";
import { createDailyDigestRepository } from "../../src/lib/daily-digest/repository";
import type { DailyDigestLogger } from "../../src/lib/daily-digest/types";

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

const handler = async () => {
  const aiProvider = Netlify.env.get("AI_PROVIDER") || "anthropic";
  let aiClient: any;
  let analyzeArticle: any;

  if (aiProvider === "gemini") {
    const apiKey = Netlify.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set but AI_PROVIDER is gemini");
    }
    aiClient = new GoogleGenerativeAI(apiKey);
    analyzeArticle = analyzeArticleGemini;
    logger.info("[daily-digest] Using Gemini provider");
  } else {
    const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set but AI_PROVIDER is anthropic");
    }
    aiClient = new Anthropic({ apiKey });
    analyzeArticle = analyzeArticleClaude;
    logger.info("[daily-digest] Using Anthropic provider");
  }

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
