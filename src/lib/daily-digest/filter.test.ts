import { describe, expect, it } from "vitest";

import { isLikelyNonSoccer } from "./filter";

describe("isLikelyNonSoccer", () => {
  it("filters obvious non-football articles before AI analysis", () => {
    expect(
      isLikelyNonSoccer({
        title: "Big Ten title game draws record audience",
        summary: "College football playoff implications dominate the discussion.",
        url: "https://example.com/big-ten",
        source: "Example",
      })
    ).toBe(true);
  });
});
