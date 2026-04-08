import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/daily/[date]": "/daily/[date]",
    "/players/[slug]": "/players/[slug]",
    "/clubs/[slug]": "/clubs/[slug]",
    "/national-teams/[slug]": "/national-teams/[slug]",
    "/topics/[slug]": "/topics/[slug]",
    "/stories/[slug]": "/stories/[slug]",
    "/newsletter": "/newsletter",
    "/about": "/about",
    "/admin": "/admin",
    "/admin/posts": "/admin/posts",
    "/admin/trend-items": "/admin/trend-items",
    "/admin/entities": "/admin/entities",
  },
});
