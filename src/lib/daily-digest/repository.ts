import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CategoryRow,
  DailyDigestRepository,
  EntityRow,
  RepositoryResult,
  TrendItemEntityLink,
  TrendItemForLinking,
  TrendItemInsert,
} from "./types";

function ok<T>(data: T): RepositoryResult<T> {
  return { status: "ok", data, issues: [] };
}

function failed<T>(data: T, code: string, message: string, error: unknown): RepositoryResult<T> {
  return {
    status: "failed",
    data,
    issues: [
      {
        code,
        message,
        meta: {
          error:
            error && typeof error === "object" && "message" in error
              ? String((error as { message: unknown }).message)
              : String(error),
        },
      },
    ],
  };
}

export function createDailyDigestRepository(
  supabase: SupabaseClient
): DailyDigestRepository {
  return {
    async loadCategories() {
      const { data, error } = await supabase.from("categories").select("id, slug");
      if (error) {
        return failed<CategoryRow[]>(
          [],
          "categories_query_failed",
          "Failed to fetch categories.",
          error
        );
      }
      return ok((data ?? []) as CategoryRow[]);
    },

    async loadExistingUrls(sinceIso) {
      const { data, error } = await supabase
        .from("trend_items")
        .select("sourceUrl")
        .gte("publishDate", sinceIso);

      if (error) {
        return failed<Set<string>>(
          new Set<string>(),
          "existing_urls_query_failed",
          "Failed to fetch existing trend item URLs.",
          error
        );
      }

      return ok(
        new Set(
          (data ?? [])
            .map((item: { sourceUrl: string | null }) => item.sourceUrl)
            .filter((value): value is string => Boolean(value))
        )
      );
    },

    async upsertTrendItems(items: TrendItemInsert[]) {
      const { error } = await supabase.from("trend_items").upsert(items, { onConflict: "slug" });
      if (error) {
        return failed<{ count: number }>(
          { count: 0 },
          "trend_items_upsert_failed",
          "Failed to upsert trend items.",
          error
        );
      }
      return ok({ count: items.length });
    },

    async loadLinkingInputs(sinceIso) {
      const [
        { data: items, error: itemsError },
        { data: entities, error: entitiesError },
      ] = await Promise.all([
        supabase
          .from("trend_items")
          .select("id, titleEn, shortSummaryEn")
          .gte("publishDate", sinceIso),
        supabase.from("entities").select("id, slug, nameEn").eq("active", true),
      ]);

      if (itemsError || entitiesError) {
        return {
          status: "failed" as const,
          data: {
            items: (items ?? []) as TrendItemForLinking[],
            entities: (entities ?? []) as EntityRow[],
          },
          issues: [
            ...(itemsError
              ? [
                  {
                    code: "trend_items_linking_query_failed",
                    message: "Failed to fetch trend items for entity linking.",
                    meta: { error: itemsError.message },
                  },
                ]
              : []),
            ...(entitiesError
              ? [
                  {
                    code: "entities_query_failed",
                    message: "Failed to fetch entities for linking.",
                    meta: { error: entitiesError.message },
                  },
                ]
              : []),
          ],
        };
      }

      return ok({
        items: (items ?? []) as TrendItemForLinking[],
        entities: (entities ?? []) as EntityRow[],
      });
    },

    async upsertEntityLinks(links: TrendItemEntityLink[]) {
      const { error } = await supabase
        .from("trend_item_entities")
        .upsert(links, { onConflict: "trendItemId,entityId" });

      if (error) {
        return failed<{ count: number }>(
          { count: 0 },
          "entity_links_upsert_failed",
          "Failed to upsert trend item entity links.",
          error
        );
      }

      return ok({ count: links.length });
    },
  };
}
