---
name: verify
description: How to build, run, and drive LearnAI (stream-ai) to verify changes end-to-end.
---

# Verifying changes in stream-ai

## Getting a handle

- The user's `next dev` server is usually **already running on port 3000**
  (check with `curl -s http://localhost:3000/api/auth/me`). It hot-reloads,
  so code changes are live — drive it directly instead of starting a second
  instance (two dev servers share `.next` and corrupt each other's cache).
- If nothing is on 3000: `npm run dev` (or preview_start with `.claude/launch.json`).

## Driving the surface

- API routes: curl against `http://localhost:3000/api/...`. Auth uses an
  httpOnly `token` cookie set by POST `/api/auth/login`; pass it with
  `curl -b "token=..."` for protected routes.
- Emails are not actually sent unless `RESEND_API_KEY` is set — verification
  and reset links are printed to the dev server console (not readable from
  here). Fetch tokens straight from the DB instead (below).

## Poking the DB

Prisma 7 with the pg driver adapter — a bare `new PrismaClient()` throws.
Use this pattern (`dotenv/config` loads `.env`):

```js
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
```

- `User` has required relation `UserCredits` — delete credits before user.
- Clean up any test users you create (`...@example.com`).

## Gotchas

- Login blocks unverified emails (403 `requiresEmailVerification`); Google
  OAuth users are auto-verified.
- Rate limiter: `auth` bucket is generous in dev but repeated login failures
  trigger account lockout after several attempts — use fresh test users.
