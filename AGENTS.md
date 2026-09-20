# Setu

A QR code and short-link redirect platform. Scan lands on the real destination instantly, no ads, no forced branding, analytics kept by the link owner.

## Git Identity (Session Start, run before any commit)

```
git config user.name "mahtamun-hoque-fahim"
git config user.email "mahtamunhoquefahim@gmail.com"
```

Execute automatically at the start of every session, before the first commit. Never ask, never skip, never commit as Claude. Applies across every Claude account/session working this repo.

## Setup & Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Type check: `npm run typecheck`
- DB push (dev only): `npm run db:push`
- DB migrate (production): `npm run db:generate` then `npm run db:migrate`

## Conventions & Non-Negotiables

- No emojis anywhere in code, UI, or docs, lucide-react icons or inline SVG only
- No em dashes and no eyebrow-style header labels in any generated text (docs, copy, commit messages)
- The public redirect route (`src/app/[slug]/route.ts`) stays unauthenticated and fast; it must never gain a session check or a client-rendered page in the middle of the redirect
- Scan logging always runs through `after()`, never awaited before the redirect response is sent
- Auth: Better Auth, session checked server-side via `auth.api.getSession()`, never client-only
- New slugs are checked against `src/lib/reserved-slugs.ts` before being created
- Single deploy target for now: Vercel. Do not add Cloudflare Workers config unless asked; PLANNER.md's Notes & decisions explains why it was deferred

## Security Gotchas

- `.env.local` is never committed, if a secret leaks into git history or chat, rotate it immediately, don't just remove it going forward
- The GitHub PAT used to push this repo was session-only and was not stored anywhere; it should be rotated if it hasn't been already

## Session Log

(Newest first. No cap, entries are never dropped or trimmed. Three to four lines per entry, not a paragraph. Updates automatically at the end of any session with substantive work. Every entry names its author, the Claude instance or collaborator who did the work, per Fahim's instance registry.)

### 2026-09-21
Author: claude-vivaldi
- Did: Built the real sign-in/sign-up form at /login (single page, toggled mode, wired to Better Auth's client), added a sign-out button on the dashboard. Found and removed a redundant standalone /signup page that had been created in an earlier part of this session before context was trimmed, it duplicated what the new /login toggle already covers. Added the create-link form on the dashboard, wired to the existing POST /api/links, surfacing reserved and taken slug errors inline. Each link in the list now links through to its (still-stub) detail page.
- Decided: One page with a mode toggle instead of separate /login and /signup routes, less surface area, and Better Auth's client already gives signIn.email and signUp.email as parallel calls so there's no real cost to combining them.
- Next: Phase 2's checklist is now fully done except Vercel production env vars, which are deferred per Fahim. Phase 3 is next: real per-link analytics detail, mobile and accessibility passes, then the deferred deploy.

### 2026-09-20
Author: claude-vivaldi
- Did: Scaffolded v1, Next.js 16 App Router project, Drizzle schema (links, scans, Better Auth tables), the redirect route with after()-based scan logging, dashboard and login page stubs, proxy guarding /dashboard, PLANNER/DESIGN_GUIDE/README/AGENTS docs. Fixed a real Better Auth schema mismatch caught by the build (table names needed to be singular, several columns were missing on session/account/verification). Pushed the initial commit to this repo (eb03c78). Added a dev-only seed script (npm run db:seed) that creates one test user through Better Auth's own signup API and one sample link.
- Decided: Used a fresh first-pass palette (blue accent, near-black surfaces) rather than reusing an existing project's exact tokens, per the design-defaults rule that every project earns its own palette. Deferred the Cloudflare Workers mirror for v1, see PLANNER.md Notes. Seed script signs up through Better Auth's API rather than inserting a row directly, so the password hash stays one Better Auth can verify.
- Next: `npm run lint` currently fails on an ESLint 9 flat-config issue, unrelated to app code, needs a fix later. Still pending: provision Neon, set real env vars, wire up the sign-up/sign-in and create-link forms (see PLANNER.md Next Steps).
