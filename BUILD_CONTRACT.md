# Build contract

This project uses the same build contract locally, in GitHub Actions, and on Netlify.

## Runtime

- Node.js: `20.19.0` (`.nvmrc`, GitHub Actions, and Netlify)
- npm: `11.x`
- Dependency installation for CI/deploy: `npm ci`
- `package-lock.json` is authoritative and must be committed with every dependency change.

## Commands

- Local development: `npm run dev`
- Production build with real local env: `npm run build`
- CI/deploy build with non-secret placeholders: `npm run build:ci`
- Full validation gate: `npm run validate`

`npm run validate` runs Prisma schema validation, Prisma Client generation, ESLint, Vitest, and `next build` under the same non-secret build placeholders used by CI.

## Environment

The build must not require production secrets. `scripts/with-build-env.mjs` provides safe defaults for:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_DEFAULT_LOCALE`

When Supabase URL/key values are absent, the wrapper also sets `SUPABASE_BUILD_PLACEHOLDER=1`. Build-time Supabase queries then return empty fallback data instead of making network calls. Real environment variables still win when present, so Netlify production can use configured Supabase secrets without changing the build command.

Secrets are required only for runtime behavior that actually talks to Supabase or Postgres. Do not commit `.env*` files.
