<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guide

## Stack & structure
- Next.js 16.4.2 App Router, React 19, TypeScript strict, Tailwind v4 (Turbopack). Alias `@/*` -> `src/*`.
- Routes live in `src/app`. `(auth)/login` is public; everything under `(main)` is wrapped by `RouteGuard` and role rules in `src/constants/navigation.ts`. Add a new protected page there and register it in `MAIN_NAV_ITEMS` (the guard treats unlisted paths as allowed).
- Data access only through `src/services/*.ts`, which all call `src/services/api.ts`. Do not use raw `fetch` in components/pages.

## Commands
- `make check` = lint + typecheck. `make ci` = check + production build. There is no test runner or `test` script; do not invent one. Focused checks: `npx eslint <path>` and `npx tsc --noEmit`.
- `make dev` prompts for `NEXT_PUBLIC_API_URL` and rewrites `.env.local`. For non-interactive use run `npm run dev` (`.env.local` already exists). The URL is inlined at dev/build time, so restart after changing it.
- `make api-summary` regenerates `docs/api-summary.md` from `docs/swagger.json`.

## API conventions
- Response envelope: `{ code, message, data, meta, details }`; success is `code === 0`. `api.request` already throws `ApiError`, handles 401 silent refresh/retry, and drives the global loading overlay.
- `api.request` shows the blocking overlay by default. Background/polling/lookup requests must pass `silent: true` (constitution v1.5.1 requires this exception, e.g. token refresh, health checks).
- Mutations that create sales/stock/payment records need an `Idempotency-Key` from `src/utils/idempotency.ts`; follow `sales.service.ts` for the header pattern.
- Transaction amounts are integer satang in services/types. Use `src/utils/currencyHelper.ts` (`toSatang`, `toBaht`, `formatSatangToBaht`) instead of inline `* 100` math.
- `docs/api-contract-map.md` is the current API reference (refreshed 2026-10-28); `docs/swagger.json` is stale (missing 4 operations). Prefer the contract map for endpoint/DTO decisions.

## Next.js config quirks
- `cacheComponents` and `partialPrefetching` are enabled. Pages that must block on the server opt out with `export const instant = false` (see `src/app/page.tsx`, `src/app/(main)/dashboard/page.tsx`). Read the matching guide in `node_modules/next/dist/docs/` before using unfamiliar Next APIs.
- Tailwind is wired through the Turbopack CSS rule in `next.config.ts`, not a PostCSS config.
- Keep the auto-generated Next.js block at the top; `next dev` re-adds it.

## Workflow & conventions
- Thai-first: UI text, code comments, and project docs are Thai; keep identifiers, API fields, and technical names in English. `.specify/memory/constitution.md` is binding.
- Feature work uses spec-kit: feature folders `specs/NNN-name/{spec,plan,tasks}.md` plus `contracts/`; the active feature is in `.specify/feature.json`. Use the `speckit-*` skills/commands. During `/speckit-implement`, commit after each completed phase with a Thai summary.
- Commit style follows history: `<type>(<scope>): <Thai description>` (e.g. `feat(inventory): ...`, `docs: ...`).
- Never commit `.env.local` or other `.env*` files (only `.env.example` is tracked).
