"use client";
import Link from "next/link";
import type { ComponentProps } from "react";

type GtagEventParams = Record<string, string | number>;
type Gtag = (command: "event", eventName: string, params: GtagEventParams) => void;

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

type Props = ComponentProps<typeof Link> & {
  gaEvent: string;
  gaParams?: GtagEventParams;
};

export function GaLink({ gaEvent, gaParams, onClick, href, ...props }: Props) {
  function track() {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", gaEvent, gaParams ?? {});
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
