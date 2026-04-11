import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  let cookieStore: Awaited<ReturnType<typeof cookies>> | undefined;
  try {
    cookieStore = await cookies();
  } catch {
    // generateStaticParams runs at build time without a request — no cookies available.
    return createServerClient(url, key, {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore!.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore!.set(name, value, options)
          );
        } catch {
          // Server component — ignore
        }
      },
    },
  });
}
