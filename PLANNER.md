# Setu, Planner

> One-line description: A QR code and short-link redirect platform that lands the scanner on the real destination instantly, with no ads, no forced branding, and analytics kept by the link owner.

## Project Overview

**Purpose.** Free QR generators route scans through their own site (an ad, a logo screen) before finally redirecting to the destination the user actually wanted. Setu keeps the same convenience (branded slugs, scan analytics) without the detour.

**Target user.** Anyone putting a QR code or short link on something physical (an ID card, a poster, packaging) who wants a direct, branded landing and to see who scanned it.

**Key value.** One request in, one redirect out. Nothing rendered in between, and the analytics belong to the person who made the link, not to whoever hosted the generator.

**Current phase.** Building (v1 skeleton scaffolded).

---

## Architecture

**Stack:**
- Framework: Next.js 16 App Router
- Language: TypeScript (strict)
- Styling: Tailwind CSS v4
- Database: Neon PostgreSQL
- ORM: Drizzle
- Auth: Better Auth
- Deployment: Vercel (v1). Cloudflare Workers mirror deferred until there's a reason to need it.

**Deployment topology:**
- `main` to Vercel production
- pull requests to Vercel preview

**Folder structure (summary):** see README for the top-level tree.

---

## User Flows

### Flow 1: Someone scans a Setu link
1. Phone camera or scanner app reads the QR code, which encodes `setu.app/[slug]`
2. Request hits `app/[slug]/route.ts`
3. Slug is looked up in the `links` table
4. If found, the response redirects (302) to `destinationUrl` immediately
5. After the redirect has been sent, the scan is logged (user agent, country, referrer, timestamp) via `after()`, so logging never delays the redirect

### Flow 2: Owner creates a branded link
1. Owner signs in at `/login` (Better Auth, email and password)
2. Lands on `/dashboard`, submits a slug and destination URL
3. `POST /api/links` checks the slug isn't reserved and isn't already taken
4. Link is created, owned by that user, and appears in the dashboard list with a live scan count

---

## DB Schema

Drizzle schema lives in `src/lib/db/schema.ts`.

### user, session, account, verification
Standard Better Auth tables (Drizzle adapter, Postgres provider). Table names are singular, matching Better Auth's default expectations.

### links
| column | type | notes |
|---|---|---|
| id | text PK | crypto.randomUUID() |
| slug | text, unique | the branded path, e.g. `mahtamun` |
| destinationUrl | text | where the scan lands |
| ownerId | text, FK to users.id | cascade delete |
| createdAt | timestamp | defaultNow |

### scans
| column | type | notes |
|---|---|---|
| id | text PK | crypto.randomUUID() |
| linkId | text, FK to links.id | cascade delete |
| scannedAt | timestamp | defaultNow |
| userAgent | text, nullable | raw header, parse client-side for device and browser |
| country | text, nullable | from `x-vercel-ip-country` header on Vercel |
| referrer | text, nullable | raw `referer` header |

---

## API Routes

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | /[slug] | none | — | 302 redirect, or 404 |
| GET | /api/links | session | — | Link[] (owner's links) |
| POST | /api/links | session | `{ slug, destinationUrl }` | Link, 201 |
| ALL | /api/auth/[...all] | n/a | Better Auth internal routes | Better Auth |

---

## Env Vars

| Name | Required | Description | Example |
|---|---|---|---|
| DATABASE_URL | yes | Neon pooled connection | postgresql://...?sslmode=require |
| DATABASE_URL_UNPOOLED | yes | Neon direct connection, used by drizzle-kit | postgresql://...?sslmode=require |
| BETTER_AUTH_SECRET | yes | Session signing secret, 32+ chars | (openssl rand -base64 32) |
| BETTER_AUTH_URL | yes | Public app URL | https://setu.app |
| NEXT_PUBLIC_APP_URL | yes | Same as above, client-readable | https://setu.app |

---

## Timeline / Phases

### Phase 1, Foundation
Status: `[x]` done

- [x] Repo scaffolded (Next.js 16, TypeScript, Tailwind v4)
- [x] Drizzle schema for links, scans, and Better Auth tables
- [x] Better Auth wired up (email and password)
- [x] Proxy guarding `/dashboard`
- [x] Redirect route with after()-based scan logging
- [x] Dev-only seed script (test user plus one sample link)

### Phase 2, Core flows
Status: `[ ]` pending

- [x] Neon project provisioned, local env vars set, schema pushed and seeded
- [ ] Production env vars set on Vercel (deferred for now, deploy currently fails on this)
- [x] Sign up and sign in forms actually wired to Better Auth client
- [x] Create-link form on the dashboard (currently only the API exists)
- [x] Reserved-slug check surfaced in the UI, not just the API
- [ ] `npm run lint` currently fails, ESLint 9's flat config crashes resolving eslint-config-next's plugin set (circular structure error), needs a config fix or a version bump once upstream resolves it. `npx tsc --noEmit` and `npm run build` both pass clean and were verified before this push.

### Phase 3, Polish
Status: `[ ]` pending

- [x] Per-link analytics detail (device, country, referrer breakdown)
- [x] Mobile responsiveness audit (reviewed every page; already handled via existing sm: breakpoints and the table's overflow-x-auto wrapper, no changes needed)
- [x] Accessibility pass (WCAG 2.2 AA)
- [ ] Production deploy verification

---

## Next Steps

In order:
1. Provision the Neon database and set real env vars locally and on Vercel
2. Run `npm run db:push` against the fresh database
3. Build the sign-up/sign-in forms and the create-link form on the dashboard
4. Deploy to Vercel and verify the redirect route end to end with a real QR code

---

## Notes & decisions

**2026-09-20.** Chose branded slugs (`setu.app/[slug]`) over random short codes from the start, since the whole point is a link that looks like it belongs to the person using it.

**2026-09-20.** Used Next's `after()` for scan logging instead of awaiting the insert before redirecting, so analytics can never add latency to the person scanning.

**2026-09-20.** Deferred Cloudflare Workers mirror for v1. The stack default is dual-deploy, but a single-region redirect service doesn't need it yet, and it adds `wrangler.jsonc`/`open-next.config.ts` overhead this project doesn't benefit from at this size.
