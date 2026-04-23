# StreamAI — Project Overview

## What This Project Is
A full-stack AI-powered video learning platform where creators upload content,
AI processes it automatically, and learners watch with an AI assistant that
generates visual explanations when they're confused.

## Core Differentiator
**No platform generates real-time visual explanations on demand.**
When a learner is confused, this platform detects it and generates
animated SVG diagrams, analogy stories, or interactive walkthroughs
specific to the concept AND the video they're watching.

## Tech Stack (Exact Versions)
- **Next.js**: 16.2.1 (Turbopack, App Router)
- **React**: 19.2.3
- **Database**: PostgreSQL via Supabase (production)
- **ORM**: Prisma 7.5.0 with PrismaPg adapter
- **Auth**: Manual JWT (NO NextAuth)
- **AI**: Vercel AI SDK v6 + Groq API
- **Payments**: Stripe
- **Storage**: AWS S3
- **Hosting**: Vercel
- **CSS**: Tailwind CSS v4 (NO tailwind.config.js — CSS-first config)
- **Language**: JavaScript (TypeScript migration in progress separately)

## Key Architectural Decisions
1. **Middleware renamed**: `middleware.js` is now `proxy.js` in Next.js 16
2. **Prisma 7**: Requires `prisma.config.ts` + `PrismaPg` adapter — NO `url` in schema.prisma
3. **AI SDK v6**: `useChat` manages NO input state — must use `useState` + `sendMessage({text})`
4. **Tailwind v4**: Configuration goes in `globals.css` using `@theme`, NOT `tailwind.config.js`
5. **Params are Promises**: All `params` and `searchParams` must be `await`ed in Next.js 16

## Deployment
- App: Vercel (auto-deploys on push to `main`)
- Database: Supabase (PostgreSQL)
- Files: AWS S3 bucket `streamai-videos-hemang`
- Redis: Upstash (for rate limiting)
