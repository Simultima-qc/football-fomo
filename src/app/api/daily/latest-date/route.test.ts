import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/supabase/queries", () => ({
  getLatestAvailableDate: vi.fn(),
}));

import { getLatestAvailableDate } from "@/lib/supabase/queries";

describe("GET /api/daily/latest-date", () => {
  it("returns the latest available date payload", async () => {
    vi.mocked(getLatestAvailableDate).mockResolvedValue("2026-04-11");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ date: "2026-04-11" });
  });
});
