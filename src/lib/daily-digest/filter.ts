import { NON_SOCCER_KEYWORDS, type RawArticle } from "./types";

export function isLikelyNonSoccer(article: RawArticle): boolean {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  return NON_SOCCER_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
}
