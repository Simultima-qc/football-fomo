import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getIndexNowConfig,
  getSitemapUrls,
  submitIndexNowUrls,
} from "@/lib/indexnow";

const schema = z.object({
  urls: z.array(z.string().url()).max(10000).optional(),
});

function isAuthorized(request: NextRequest) {
  const adminToken = process.env.INDEXNOW_ADMIN_TOKEN;

  if (!adminToken) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${adminToken}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const config = getIndexNowConfig();

  if (!config) {
    return NextResponse.json({ error: "indexnow_not_configured" }, { status: 501 });
  }

  try {
    const body = schema.parse(await request.json().catch(() => ({})));
    const result = await submitIndexNowUrls({
      ...config,
      urls: body.urls ?? (await getSitemapUrls()),
    });

    return NextResponse.json(result, { status: result.accepted ? 200 : 502 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    console.error("IndexNow submission error:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
