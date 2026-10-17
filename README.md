# Setu

A QR code and short-link redirect platform. Scan lands on the real destination instantly, no ads, no forced branding, with analytics kept by the link owner.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Neon (PostgreSQL) + Drizzle ORM
- Better Auth
- Vercel (v1)

## Prerequisites

- Node 20+
- A Neon project (or any PostgreSQL with two connection strings, pooled and unpooled)
- Vercel account, for deploy

## Local setup

1. Clone the repo: `git clone https://github.com/mahtamun-hoque-fahim/setu.git`
2. Install: `npm install`
3. Copy `.env.example` to `.env.local` and fill in values (see PLANNER.md, Env Vars)
4. Push the schema: `npm run db:push`
5. Create your own account: sign-up is invite-only, so issue yourself an invite with `npm run invite -- you@example.com`, open the printed link, and set `ADMIN_EMAIL` to that same address to get the admin dashboard at `/admin`
6. Run dev: `npm run dev`

## Env vars

See PLANNER.md, Env Vars, for descriptions. Names only:

```
DATABASE_URL
DATABASE_URL_UNPOOLED
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NEXT_PUBLIC_APP_URL
ADMIN_EMAIL
SAFE_BROWSING_API_KEY   # optional
```

## Scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest, runs against an in-process Postgres, no setup needed
npm run db:generate  # generate migration from schema
npm run db:migrate   # apply migrations
npm run db:push      # push schema directly, dev only
npm run db:seed      # dev-only test user and one sample link
npm run invite -- a@b.com   # issue an invite and print the join link
```

## Deploy

- Push to `main` to auto-deploy to Vercel production
- Push to any other branch for a Vercel preview deploy

## Folder structure

```
src/app/             routes (App Router)
src/app/[slug]/      the public redirect route
src/app/dashboard/   authenticated link management and analytics
src/lib/             auth, db, reserved-slugs, id helper
drizzle/             generated migrations
```

For the detailed structure, see PLANNER.md, Architecture.
