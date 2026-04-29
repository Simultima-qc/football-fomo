import { getIndexNowConfig } from "@/lib/indexnow";

export async function GET() {
  const config = getIndexNowConfig();

  if (!config) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(config.key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
