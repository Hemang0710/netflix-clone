# Contributing to LearnAI

Thanks for your interest in contributing! This document explains how to get a
development environment running and what we expect from contributions.

## Getting started

1. **Fork and clone**
   ```bash
   git clone https://github.com/<your-username>/stream-ai.git
   cd stream-ai
   npm install --legacy-peer-deps
   ```

2. **Environment**
   ```bash
   cp .env.example .env
   ```
   Only `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_APP_URL`
   are required to run locally. Optional integrations (Stripe, S3, Hedera,
   Upstash, AI providers) disable themselves gracefully when unset — AI-powered
   features need at least one AI provider key.

3. **Database**
   ```bash
   npx prisma migrate dev   # creates DB schema
   npm run seed             # optional sample data
   ```

4. **Run**
   ```bash
   npm run dev
   ```

## Before you open a PR

- **Tests must pass:** `npm test`
- **Lint must pass:** `npm run lint`
- **Build must pass:** `npm run build`
- Add tests for new API routes and components. Look at `__tests__/api/` for
  the mocking pattern used with route handlers (explicit `jest.mock` factories).
- Never commit secrets. `.env` is gitignored — keep it that way. New env vars
  must be added to `.env.example` with a comment.

## Code conventions

- **API routes** live in `src/app/api/**/route.js`.
  - Authenticate with `getCurrentUser()` from `@/lib/auth` and use
    `user.userId` — never trust a user ID from the request body or query.
  - Validate input; clamp numeric ranges; return sanitized error messages
    (no `error.message` passthrough in 500 responses).
  - Rate-limit sensitive routes with `checkRateLimit()` from `@/lib/rateLimit`.
- **Database access** goes through `@/lib/prisma`. Schema changes require a
  migration: `npx prisma migrate dev --name your_change`.
- **AI responses** are parsed with `parseAIJson()` from `@/lib/aiJson` —
  never raw `JSON.parse` on model output — and AI calls should have a
  non-AI fallback where feasible.
- **Client components** live in `src/components/`, grouped by domain.

## Reporting security issues

Please do **not** open a public issue for security vulnerabilities.
Email hemangpatel0710@gmail.com instead.

## Pull request process

1. Create a feature branch: `git checkout -b feature/short-name`
2. Keep PRs focused — one feature or fix per PR.
3. Describe **what** changed and **why**; include screenshots for UI changes.
4. CI (tests, lint, build) must be green before review.
