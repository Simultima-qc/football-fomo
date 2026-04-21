"use client";
import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  gaEvent: string;
  gaParams?: Record<string, string | number>;
};

export function GaLink({ gaEvent, gaParams, onClick, href, ...props }: Props) {
  function track() {
    if (typeof window !== "undefined" && "gtag" in window) {
      (window as any).gtag("event", gaEvent, gaParams ?? {});
    }
  }

  return (
    <Link
      href={href}
      onClick={(e) => {
        track();
        onClick?.(e);
      }}
      {...props}
    />
  );
}
