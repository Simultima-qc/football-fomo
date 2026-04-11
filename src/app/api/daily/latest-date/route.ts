import { NextResponse } from "next/server";
import { getLatestAvailableDate } from "@/lib/supabase/queries";

export async function GET() {
  const date = await getLatestAvailableDate();
  return NextResponse.json({ date });
}
