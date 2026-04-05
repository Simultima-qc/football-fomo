import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { subscribeNewsletter } from "@/lib/supabase/queries";

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale } = schema.parse(body);

    const result = await subscribeNewsletter(email, locale);

    if (!result.ok) {
      if (result.reason === "already_subscribed") {
        return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
      }
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    console.error("Newsletter error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
