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

### 2026-09-21 (motion and visual pass)
Author: claude-vivaldi
- Did: Fahim called the UI generic and flat, fair critique. Ran a real motion audit (grepped every hover/transition/focus/active class across the codebase rather than guessing) and found: feature cards on the landing page had zero hover state, several text links had a hover color with no transition so it snapped instantly, no button anywhere had a press state, inputs had no focus glow despite the --shadow-glow token existing unused since day one, and nothing on any page had an entrance animation. Fixed all of it: added --ease-out/--ease-in-out/--ease-subtle tokens, fade-up and scale-in keyframes, a hero-glow radial gradient utility, staggered entrance on the landing hero, dashboard list, and scan table, active:scale press feedback on every button, focus rings on every input, and a real lift+shadow hover on cards instead of a flat color swap. Verified the actual compiled CSS output, not just the source, to confirm every new utility and token really generated.
- Decided: CSS-only, no Framer Motion. Nothing in Setu right now needs gesture handling or exit-on-unmount animation (no modals, drawers, or toasts exist yet), so a JS animation library would be dependency weight without matching benefit. Revisit if that changes.
- Next: This was a design-quality request, not a plan item, Phase 4 (launch and verify) is still what's actually open.

### 2026-09-21 (launch phase added)
Author: claude-vivaldi
- Did: Fahim asked why phase status wasn't being tracked consistently, and it was a fair catch: Phases 1 through 3 were tracked in PLANNER.md all along, but the launch and verification steps, redeploy, live test, real scan, dashboard confirmation, actual QR generation, had only ever been said in chat, never written into the plan as a real phase. Added Phase 4 to PLANNER.md now with those concrete steps, and rewrote the stale Next Steps list, which still referenced work finished days ago.
- Decided: Status updates should state current phase and what's left as a matter of course going forward, not only when a phase closes out.
- Next: Phase 4's actual items, starting with fixing the http to https env var mistake and redeploying.

### 2026-09-21 (accessibility pass)
Author: claude-vivaldi
- Did: Ran real WCAG contrast math on every color token pairing instead of assuming the palette was fine, found three genuine failures: text-faint was 2.6 to 3.0:1 against surface colors (needs 4.5:1 for normal text), border was 1.3:1 against bg (needs 3:1 for interactive UI boundaries like input outlines), and accent-hover dropped button-label contrast to 3.72:1 on hover. Fixed all three (text-faint to #868b9c, border to #545d80, accent-hover to a lighter #7291fb instead of a darker one). Fixed a heading-level skip on the landing page (h1 straight to h3, now h1 to h2). Marked purely decorative icons aria-hidden across the login form, create-link form, sign-out button, and landing page. Added a screen-reader caption and proper column scope to the scan-history table. Reviewed every page for mobile layout, already handled correctly from the initial build via sm: breakpoints and the table's overflow-x-auto wrapper, nothing needed changing there.
- Decided: accent-hover got lighter rather than darker specifically to keep the button text readable, a darkened hover state is the more common convention but it was the actual cause of the contrast failure.
- Next: Phase 3 is done. Only remaining item project-wide is the deferred Vercel production env vars.

### 2026-09-21
Author: claude-vivaldi
- Did: Built the real sign-in/sign-up form at /login (single page, toggled mode, wired to Better Auth's client), added a sign-out button on the dashboard. Found and removed a redundant standalone /signup page that had been created in an earlier part of this session before context was trimmed, it duplicated what the new /login toggle already covers. Added the create-link form on the dashboard, wired to the existing POST /api/links, surfacing reserved and taken slug errors inline. Each link in the list now links through to its (still-stub) detail page. Built the real per-link analytics detail page: scan history table with a lightweight user-agent parser for device and browser, country, referrer, timestamp, ordered newest first.
- Decided: One page with a mode toggle instead of separate /login and /signup routes, less surface area, and Better Auth's client already gives signIn.email and signUp.email as parallel calls so there's no real cost to combining them. Scoped the detail-page query to id AND ownerId together, not just id, since the earlier stub had no ownership check at all, any signed-in user could have viewed another user's link stats by guessing the linkId in the URL.
- Next: Phase 3 remaining: mobile responsiveness audit, accessibility pass, then the deferred Vercel deploy.

### 2026-09-20
Author: claude-vivaldi
- Did: Scaffolded v1, Next.js 16 App Router project, Drizzle schema (links, scans, Better Auth tables), the redirect route with after()-based scan logging, dashboard and login page stubs, proxy guarding /dashboard, PLANNER/DESIGN_GUIDE/README/AGENTS docs. Fixed a real Better Auth schema mismatch caught by the build (table names needed to be singular, several columns were missing on session/account/verification). Pushed the initial commit to this repo (eb03c78). Added a dev-only seed script (npm run db:seed) that creates one test user through Better Auth's own signup API and one sample link.
- Decided: Used a fresh first-pass palette (blue accent, near-black surfaces) rather than reusing an existing project's exact tokens, per the design-defaults rule that every project earns its own palette. Deferred the Cloudflare Workers mirror for v1, see PLANNER.md Notes. Seed script signs up through Better Auth's API rather than inserting a row directly, so the password hash stays one Better Auth can verify.
- Next: `npm run lint` currently fails on an ESLint 9 flat-config issue, unrelated to app code, needs a fix later. Still pending: provision Neon, set real env vars, wire up the sign-up/sign-in and create-link forms (see PLANNER.md Next Steps).
