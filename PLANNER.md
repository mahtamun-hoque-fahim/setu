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
4. If found, the response redirects (302, `Cache-Control: no-store`) to `destinationUrl` immediately. If not found, it redirects (302) to `/link-not-found`, a small page that renders the branded 404 with a real 404 status, because a route handler cannot render a page itself
5. After the redirect has been sent, the scan is logged (user agent, country, referrer, timestamp, and the destination it was sent to) via `after()`, so logging never delays the redirect

### Flow 2: Owner creates a branded link
1. Owner signs in at `/login` (Better Auth, email and password)
2. Lands on `/dashboard`, submits a slug and destination URL
3. `POST /api/links` checks the slug isn't reserved and isn't already taken
4. Link is created, owned by that user, and appears in the dashboard list with a live scan count

### Flow 4: Someone gets access (invite-only)
1. A visitor opens `/request-access` and sends a name, an email and an optional note. A hidden honeypot field catches bots, there is one pending request per email, and the queue closes at 50 pending. The answer is always "Request received", so the form never reveals who is already known
2. The admin opens `/admin`, reads the request, and approves or rejects it
3. Approving issues an invite bound to that email: 16 random characters, valid 7 days, single use, stored only as a SHA-256 hash. The admin copies a join link and sends it themselves. The email and code sit in the URL fragment, so no server or log ever sees them
4. The person opens the link, `/join` prefills the fields and wipes the fragment from the address bar, they choose a password, and Better Auth creates the account
5. Account creation is locked inside Better Auth itself (`databaseHooks.user.create.before`): no code, a wrong code, a code for another email, an expired, revoked or spent code all mean no account, even for a direct POST to `/api/auth/sign-up/email`. One atomic UPDATE both checks and spends the code
6. Existing accounts keep signing in as before, the lock only applies to new accounts

### Flow 5: A destination is checked and a link can be switched off
1. On create and on edit, a destination must pass the format rules (http or https, no username or password in the URL, no IP address or local host, no link shorteners, not Setu itself), then the admin's blocklist, then Google Safe Browsing when a key is set
2. Safe Browsing fails open: if Google is unreachable the link is saved as `unchecked`. It only knows sites already reported, so it backs up invite-only access and the kill switch, it does not replace them
3. The admin can disable any link, or block a whole website, which disables every active link already pointing there. A disabled link redirects to `/link-disabled` and never reveals its destination
4. The admin can also delete an account, which removes its links, scans, history, sessions, invite request and invites

### Flow 3: Owner edits where a link points
1. Owner opens a link's detail page at `/dashboard/[linkId]`
2. Changes the destination URL in the edit form and saves, which sends `PATCH /api/links/[linkId]` with `{ destinationUrl }`
3. The URL is validated (http or https only, not a Setu address), then updated only if the link belongs to the signed-in user. The old and new URL are recorded in `link_edits` in the same transaction
4. The slug and the QR code do not change. Codes already printed or scanned keep working and land on the new destination from the next scan on

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
| destinationUrl | text, nullable | where this scan was sent, snapshotted at scan time because the owner can edit the destination later. Null on scans recorded before this column existed |

### link_edits
One row per real destination change. Saving the same URL again writes nothing.

| column | type | notes |
|---|---|---|
| id | text PK | crypto.randomUUID() |
| linkId | text, FK to links.id | cascade delete |
| editedBy | text, FK to user.id | cascade delete |
| previousUrl | text | destination before the edit |
| newUrl | text | destination after the edit |
| editedAt | timestamp | defaultNow |

Index: `link_edits_link_id_edited_at_idx` on (linkId, editedAt).

### links (additions)
| column | type | notes |
|---|---|---|
| status | text, default 'active' | 'active' or 'disabled' |
| disabledReason | text, nullable | shown to the owner |
| disabledAt | timestamp, nullable | |
| urlCheck | text, default 'unchecked' | 'clean', 'flagged' or 'unchecked' at the last save |

### invite_requests
| column | type | notes |
|---|---|---|
| id | text PK | |
| name, email, note | text | email stored lowercase, note nullable |
| status | text, default 'pending' | 'pending', 'approved', 'rejected' |
| createdAt, reviewedAt | timestamp | |

Unique partial index `invite_requests_pending_email_idx` on (email) where status is pending.

### invites
| column | type | notes |
|---|---|---|
| id | text PK | |
| requestId | text, nullable FK to invite_requests.id | set null on delete |
| email | text | the only email this invite works for |
| codeHash | text | SHA-256 of the code, the code is never stored |
| createdAt, expiresAt | timestamp | 7 day lifetime |
| usedAt, revokedAt | timestamp, nullable | |
| usedBy | text, nullable FK to user.id | set null on delete |

Index: `invites_email_idx` on (email).

### blocked_hosts
| column | type | notes |
|---|---|---|
| host | text PK | lowercase, subdomains are blocked too |
| reason | text, nullable | |
| createdAt | timestamp | |

Manual SQL for each schema change lives in `sql/`, because no migration history is committed.

---

## API Routes

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | /[slug] | none | none | 302 to the destination, or 302 to /link-not-found (404 page) |
| GET | /api/links | session | none | Link[] (owner's links) |
| POST | /api/links | session | `{ slug, destinationUrl }` | Link, 201 |
| PATCH | /api/links/[linkId] | session, owner only | `{ destinationUrl }` | Link, or 400 (invalid URL), 404 (not found or not yours) |
| POST | /api/access-requests | none | `{ name, email, note, website }` | 200 always for a valid request, 400 invalid, 413 too large, 503 queue full |
| ALL | /api/auth/[...all] | n/a | Better Auth internal routes. Sign-up needs `inviteCode` | Better Auth, 403 without a valid invite |

Admin actions are Server Actions in `src/app/admin/actions.ts`, each one calls `requireAdmin()` first because a Server Action is a public endpoint.

---

## Pages

| Path | Auth | Purpose |
|---|---|---|
| / | public | Landing |
| /about | public | The story of Setu and who built it |
| /login | public | Sign in |
| /request-access | public | Ask for an invite |
| /join | public | Create an account with an invite code |
| /privacy | public | What is stored, why, who sees it, how to delete it |
| /admin | admin only (404 for everyone else) | Requests, invites, accounts, links, blocked websites |
| /link-disabled | public | Notice shown for a disabled link |
| /dashboard | session | List of links, create form |
| /dashboard/[linkId] | session, owner only | Edit destination, QR code, edit history, scans |
| /link-not-found | public | Branded 404 for an unknown slug (404 status) |
| any unmatched path | public | Branded 404 (`app/not-found.tsx`) |

---

## Env Vars

| Name | Required | Description | Example |
|---|---|---|---|
| DATABASE_URL | yes | Neon pooled connection | postgresql://...?sslmode=require |
| DATABASE_URL_UNPOOLED | yes | Neon direct connection, used by drizzle-kit | postgresql://...?sslmode=require |
| BETTER_AUTH_SECRET | yes | Session signing secret, 32+ chars | (openssl rand -base64 32) |
| BETTER_AUTH_URL | yes | Public app URL | https://setu.app |
| NEXT_PUBLIC_APP_URL | yes | Same as above, client-readable | https://setu.app |
| ADMIN_EMAIL | yes | The one admin. Whoever signs in with this email can open /admin | you@example.com |
| SAFE_BROWSING_API_KEY | no | Google Safe Browsing key. Without it destinations are saved as unchecked | (Google Cloud console) |

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
Status: `[x]` done

- [x] Per-link analytics detail (device, country, referrer breakdown)
- [x] Mobile responsiveness audit (reviewed every page; already handled via existing sm: breakpoints and the table's overflow-x-auto wrapper, no changes needed)
- [x] Accessibility pass (WCAG 2.2 AA)

### Phase 4, Launch and verify
Status: `[ ]` pending

- [x] Production env vars set on Vercel
- [ ] Fix BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL to use https, not http, then redeploy
- [ ] Confirm the redeploy actually succeeds
- [ ] Sign in on the live production URL (not localhost) and create the real link, real slug, real Facebook page as the destination
- [ ] Scan the live link with an actual phone, confirm it redirects instantly with no ad and no logo, this is the entire reason the project exists
- [ ] Confirm that scan shows up in the dashboard with device, country, and referrer, not just that the redirect worked
- [x] Generate the actual QR code pointing at the live link (built directly into the dashboard instead of relying on an external generator, client-side, no ads, no third party, matching the entire point of the product)

### Phase 5, Post-launch features
Status: `[x]` done

- [x] Edit the destination of an existing link (slug and QR code stay the same)
- [x] Destination validation shared by create and edit (http or https only, no links back to Setu)
- [x] Edit history (old destination, new destination, who, when) in `link_edits`, shown on the link detail page
- [x] Destination snapshotted on each scan row, shown as a "Sent to" column in the scan table
- [x] Schema change applied to Neon (October 2026)

### Phase 6, UI redesign (Brutalist White)
Status: `[ ]` in review

- [x] Design tokens rewritten to the standard token names, contrast checked with a script
- [x] Fonts: Space Grotesk, JetBrains Mono, Hind Siliguri (Bengali subset) via @fontsource, Syne and Onest removed
- [x] Landing, sign in and create account, dashboard, link detail rebuilt from the Stitch designs
- [x] About page, branded 404 page, unknown slugs sent to the 404 page
- [x] Stale parts of the Stitch export dropped, see DESIGN_GUIDE.md
- [x] QR exports include the quiet zone and can be downloaded as PNG or SVG
- [x] Dashboard uses a grouped count query, link detail shows a real scan total with the latest 50 rows
- [x] ESLint config fixed for Next.js 16, lint now runs
- [ ] Review the About page copy (written from the project notes, the voice is Fahim's to adjust)
- [ ] Merge, then redeploy

### Phase 7, Invite-only access and abuse controls
Status: `[ ]` in review

- [x] Request-an-invite page, admin approval, invite codes bound to an email, hashed, single use, 7 days
- [x] Sign-up locked inside Better Auth, so a direct POST cannot bypass it
- [x] Admin dashboard: requests, invites, accounts, links, blocked websites. No per-scan data
- [x] Destination checks: format rules, blocklist, Google Safe Browsing (fails open)
- [x] Disable a link, block a website, delete an account
- [x] Server-side slug rules (letters, numbers, hyphens, 64 characters)
- [x] Privacy page written from the real data map, with sample-data mockups (a WARDEN-DRAFT until confirmed)
- [x] Vitest suite against an in-process Postgres (PGlite), written first
- [ ] Run `sql/002-invite-only-and-abuse-controls.sql` in Neon BEFORE deploying this branch
- [ ] Set `ADMIN_EMAIL` in Vercel, and optionally `SAFE_BROWSING_API_KEY`
- [ ] Confirm the CONFIRM notes in `src/content/legal.ts`, then delete the WARDEN-DRAFT line in `src/app/privacy/page.tsx`
- [x] Accessibility: axe (WCAG 2.2 A and AA plus best practices) found no violations on any page at 1280px and 375px. Automated checks catch only part of it, a keyboard and screen reader pass is still worth doing
- [x] Sentinel pass: upgraded Next.js 16.3.5 to 16.4.0 (production audit had a critical and a high finding, neither feature was used), added security headers, capped the name length
- [x] Warden scan: PASS, with 3 MEDIUM items that are decisions for Fahim (privacy draft review, CONFIRM notes, whether to add a terms page)
- [ ] Decide on rate limiting: Better Auth's default limiter is per server instance, so it is weak on serverless. Options: a database-backed limiter (new table) or Vercel Firewall rate-limit rules on `/api/access-requests` and `/api/auth/*`
- [ ] Valley-of-death (spec against code), Humanizer on the About and privacy copy, light Airborne (robots and meta tags), Council POST, ticket-checker

---

## Next Steps

In order:
1. Fix BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL on Vercel to use https, redeploy
2. Confirm the redeploy succeeds
3. Sign in on the live URL, create the real link with the real Facebook destination
4. Scan it with an actual phone, confirm instant redirect, no ad, no logo
5. Confirm the scan appears in the dashboard
6. Generate the actual QR code pointing at the live link

---

## Notes & decisions

**2026-09-20.** Chose branded slugs (`setu.app/[slug]`) over random short codes from the start, since the whole point is a link that looks like it belongs to the person using it.

**2026-09-20.** Used Next's `after()` for scan logging instead of awaiting the insert before redirecting, so analytics can never add latency to the person scanning.

**2026-09-20.** Deferred Cloudflare Workers mirror for v1. The stack default is dual-deploy, but a single-region redirect service doesn't need it yet, and it adds `wrangler.jsonc`/`open-next.config.ts` overhead this project doesn't benefit from at this size.

**2026-10-09.** Link editing changes the destination only, never the slug. The QR code encodes the slug URL, so a renamed slug would break every code already printed.

**2026-10-09.** The redirect route now builds its 302 by hand with `Cache-Control: no-store` instead of `Response.redirect`, because destinations are editable and a cached redirect would keep sending scanners to the old place. A 302 is already not cached by default, this makes it explicit and covers proxies and CDNs.

**2026-10-09.** Destination validation lives in one helper (`src/lib/validate-destination.ts`) used by both create and edit. It allows only http and https and rejects Setu's own host. Link creation previously accepted any string, so this also closes that gap. A hand-written helper instead of Zod, since this is one field and it avoids a new dependency.

**2026-10-09.** Edit history and per-scan destination snapshots were added. Editing needs a schema change after all: a new `link_edits` table and a nullable `scans.destination_url` column. Both are additive, so old code keeps working against the new schema, which means the SQL can be applied to Neon before the deploy. Deploying first would make the scan insert fail inside `after()`, silently losing analytics, so the order matters.

**2026-10-09.** The history row and the link update run through `db.batch()`, one transaction, because the neon-http driver has no interactive transactions. Existing scans were backfilled with each link's current destination, which is accurate only because no link had been edited yet. Scans recorded before the column existed and not backfilled show "Not recorded".

**2026-10-10.** The UI direction is Brutalist White, chosen after trying a minimal Material look in Google Stitch. Tokens use the standard shadcn-style names so the other skills (chameleon, aria, refinery) work unchanged. Fonts stay on @fontsource instead of next/font/google so builds do not depend on reaching Google Fonts.

**2026-10-10.** Parts of the Stitch export were left out because they claimed things Setu does not do or have: "HTTP 301" (the redirect is a 302 on purpose, a 301 is cached by browsers and would break editable destinations), Forgot password, an Analytics page, a docs page, a status page, the throughput sparkline. DESIGN_GUIDE.md has the full list.

**2026-10-10.** Unknown slugs redirect (302, no-store) to `/link-not-found` instead of returning a plain 404 body. Route handlers cannot render the branded page: `notFound()` returns an empty 404 and `NextResponse.rewrite` fails there with a 500. This only affects the failure path, the hot redirect path is unchanged. `link-not-found` and `about` are reserved slugs.

**2026-10-10.** Presentation was split from data fetching for the dashboard and link detail (`DashboardView`, `LinkDetailView`). Pages keep auth and queries, views take plain props, which let the screens be rendered with fixture data and screenshotted at 375px and 1280px during the redesign.

**2026-10-13.** Setu is invite-only. The lock is a Better Auth database hook, not a hidden form, because the sign-up endpoint is public and `disableSignUp` also blocks server-side sign-ups, so it cannot be used for a gated flow. The hook claims the invite with one atomic UPDATE. If the claim fails for any reason, including a database error, no account is created.

**2026-10-13.** Invites are delivered by the admin copying a link, not by email. Resend cannot verify a vercel.app domain, so email delivery waits for a custom domain. The code and email are in the URL fragment so they never reach a server log.

**2026-10-13.** The admin is whoever signs in with `ADMIN_EMAIL`. There is no role column to tamper with. The first account on a fresh database is created with `npm run invite -- <admin email>`, so nobody can register the admin's email first. Admin pages return a plain 404 to everyone else and every admin Server Action re-checks, because Server Actions are public endpoints.

**2026-10-13.** The admin sees counts, never individual scans, by construction: no admin query returns a scan row, and a test asserts it. The privacy page says so, so that promise is backed by the code.

**2026-10-13.** Better Auth stores the IP address and user agent of each login session. The privacy page says so. Scans, by contrast, store no IP address, only the country the host derives from the connection.

**2026-10-13.** Retention gaps, written down instead of hidden: invite requests and expired session rows are not deleted automatically, and the privacy page says "until you ask me to delete it". Account deletion is admin-side only, on request by email, not self-service.

**2026-10-13.** Tests run against PGlite, an in-process Postgres, with the real Drizzle schema pushed in. That is why constraints, the partial unique index and the atomic UPDATE are tested for real. They need no database on the machine and no network.
