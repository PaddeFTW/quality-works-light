# AGENTS

This repository is the shared foundation for future applications built on this template. AI agents and contributors should preserve that intent.

## Base44 Dev Environment

- **Run:** `docker compose -f docker-compose.base44.yml up -d` (Next.js 16 dev server with Turbopack on port 3000, source bind-mounted from the repo root).
- The app uses Supabase Auth. The root page `/` is public; everything under `/app/*` is auth-gated by `proxy.ts` (Next.js middleware). Unauthenticated visitors are redirected to `/auth/login`.
- `proxy.ts` constructs a Supabase client on every request, so `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be present or the middleware errors. Placeholder defaults in `.env.base44-defaults` let the app boot; real values come from `/run/base44/app.env` (platform secrets, last in the `env_file` list so they win).
- `next.config.ts` sets `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can load dev assets/HMR.
- `SUPABASE_SERVICE_ROLE_KEY` is only needed by the `/api/auth/delete-account` route.

## Core Rules

1. Do not turn this repository into a product-specific application.
2. Do not add business workflows, domain models, or feature logic that only belongs to one product.
3. Prefer reusable architecture, neutral naming, and composable UI.
4. Update documentation whenever shared structure or conventions change.
5. Keep additions aligned with the design token system and layout strategy.

## Preferred Contribution Shape

- improve shared primitives
- improve shared layouts
- refine design tokens
- improve accessibility
- improve documentation
- improve developer experience for future app teams

## Avoid

- feature-specific pages
- business-specific tables or forms
- mock domain entities presented as real platform concepts
- hardcoded brand decisions that cannot be themed later

## When Adding New Shared Code

Ask:

- will more than one future product benefit from this?
- is the naming neutral?
- does this belong in `ui`, `common`, `layout`, or product code?
- does the documentation still match the implementation?

If the answer is not clearly shared platform value, it likely does not belong in this template.
