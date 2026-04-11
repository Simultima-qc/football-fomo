import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LatestDailyLink } from "./LatestDailyLink";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("LatestDailyLink", () => {
  it("updates the href when the latest date endpoint responds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ date: "2026-04-11" }),
      })
    );

    render(<LatestDailyLink locale="en">Daily</LatestDailyLink>);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Daily" }).getAttribute("href")).toBe(
        "/en/daily/2026-04-11"
      );
    });
  });

  it("keeps a fallback href when the endpoint fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    render(<LatestDailyLink locale="fr">Daily</LatestDailyLink>);

    const href = screen.getByRole("link", { name: "Daily" }).getAttribute("href");
    expect(href).toMatch(/^\/fr\/daily\/\d{4}-\d{2}-\d{2}$/);
  });
});
