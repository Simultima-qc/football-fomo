import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/daily/[date]": "/daily/[date]",
    "/players": "/players",
    "/players/[slug]": "/players/[slug]",
    "/clubs": "/clubs",
    "/clubs/[slug]": "/clubs/[slug]",
    "/national-teams": "/national-teams",
    "/national-teams/[slug]": "/national-teams/[slug]",
    "/competitions": "/competitions",
    "/competitions/[slug]": "/competitions/[slug]",
    "/topics/[slug]": "/topics/[slug]",
    "/stories/[slug]": "/stories/[slug]",
    "/newsletter": "/newsletter",
    "/about": "/about",
    "/privacy": "/privacy",
    "/admin": "/admin",
    "/admin/posts": "/admin/posts",
    "/admin/trend-items": "/admin/trend-items",
    "/admin/entities": "/admin/entities",
  },
});
