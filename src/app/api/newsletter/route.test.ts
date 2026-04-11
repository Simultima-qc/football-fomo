import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/supabase/queries", () => ({
  subscribeNewsletter: vi.fn(),
}));

import { subscribeNewsletter } from "@/lib/supabase/queries";

function buildRequest(body: unknown) {
  return new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("POST /api/newsletter", () => {
  it("returns 201 when the subscription succeeds", async () => {
    vi.mocked(subscribeNewsletter).mockResolvedValue({ ok: true });

    const response = await POST(buildRequest({ email: "fan@example.com", locale: "fr" }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(subscribeNewsletter).toHaveBeenCalledWith("fan@example.com", "fr");
  });

  it("returns 409 when the email is already subscribed", async () => {
    vi.mocked(subscribeNewsletter).mockResolvedValue({ ok: false, reason: "already_subscribed" });

    const response = await POST(buildRequest({ email: "fan@example.com", locale: "en" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "already_subscribed" });
  });

  it("returns 400 when the payload is invalid", async () => {
    const response = await POST(buildRequest({ email: "not-an-email" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "invalid_input" });
    expect(subscribeNewsletter).not.toHaveBeenCalled();
  });
});
