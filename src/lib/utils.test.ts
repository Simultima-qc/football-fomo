import { describe, expect, it } from "vitest";
import { getUtcDateString, isCurrentUtcDate } from "./utils";

describe("date helpers", () => {
  it("returns the UTC calendar date", () => {
    expect(getUtcDateString(new Date("2026-04-12T23:59:59-04:00"))).toBe("2026-04-13");
  });

  it("detects when a digest date is stale relative to today in UTC", () => {
    const now = new Date("2026-04-12T10:00:00Z");

    expect(isCurrentUtcDate("2026-04-12", now)).toBe(true);
    expect(isCurrentUtcDate("2026-04-11", now)).toBe(false);
  });
});
