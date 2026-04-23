# StreamAI — Security Implementation

## What's Already Built

```
✅ Rate limiting       — Upstash Redis, 3 tiers (auth/api/upload)
✅ Zod validation      — All API inputs validated
✅ bcrypt passwords    — 12 rounds
✅ HTTP-only cookies   — JWT never in localStorage
✅ Account lockout     — Redis-based, 5 attempts = 15min lock
✅ Security headers    — next.config.mjs headers()
✅ Audit logging       — AuditLog model in DB
✅ Google OAuth        — Manual, no NextAuth
```

## Rate Limiting — src/lib/rateLimit.js

```javascript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export const rateLimiters = {
  auth:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "15 m"),  prefix: "ratelimit:auth" }),
  api:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, "1 m"),  prefix: "ratelimit:api" }),
  upload: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"),  prefix: "ratelimit:upload" }),
}

export async function checkRateLimit(request, type = "api") {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1"
  const { success, limit, remaining } = await rateLimiters[type].limit(ip)
  return { success, limit, remaining }
}
```

## Account Lockout — src/lib/accountLock.js

```javascript
const MAX_ATTEMPTS = 5
const LOCK_DURATION = 60 * 15  // 15 minutes

export async function recordFailedAttempt(email) {
  const key = `lockout:${email}`
  const attempts = await redis.incr(key)
  if (attempts === 1) await redis.expire(key, LOCK_DURATION)
  return attempts
}

export async function isAccountLocked(email) {
  const attempts = await redis.get(`lockout:${email}`)
  return Number(attempts) >= MAX_ATTEMPTS
}

export async function clearFailedAttempts(email) {
  await redis.del(`lockout:${email}`)
}
```

## JWT Auth — src/lib/auth.js

```javascript
import { jwtVerify } from "jose"
import { cookies } from "next/headers"

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) return null

    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    )
    return payload  // { userId: string, email: string }
  } catch {
    return null
  }
}
```

JWT Cookie settings (set on login):
```javascript
response.cookies.set("token", token, {
  httpOnly: true,     // JS cannot read this cookie
  secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
  sameSite: "lax",    // CSRF protection
  maxAge: 60 * 60 * 24 * 7,  // 7 days
  path: "/",
})
```

## Security Headers — next.config.mjs

```javascript
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    },
  ]
},
```

## Audit Logging — src/lib/audit.js

```javascript
export async function logAction({ userId, action, resource, ip, success, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,     // "LOGIN" | "REGISTER" | "UPLOAD" | "PAYMENT" | "LOGOUT"
        resource: resource || null,
        ip: ip || null,
        success,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (error) {
    console.error("Audit log failed:", error)  // never crash main flow
  }
}
```

## Route Protection — src/proxy.js (Next.js 16 middleware)

```javascript
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PROTECTED = ["/browse", "/watch", "/creator", "/account", "/subscribe/success"]
const AUTH_ONLY = ["/login", "/register"]  // redirect if already logged in

export async function proxy(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  const isProtected = PROTECTED.some(path => pathname.startsWith(path))
  const isAuthOnly = AUTH_ONLY.some(path => pathname.startsWith(path))

  let isValid = false
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
      isValid = true
    } catch {}
  }

  if (isProtected && !isValid) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthOnly && isValid) {
    return NextResponse.redirect(new URL("/browse", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
}
```

## OWASP Top 10 — 2025 Compliance Status

```
A01 Broken Access Control:
  ✅ JWT auth on all protected routes
  ✅ Server-side ownership checks (content.creatorId === userId)
  ✅ proxy.js protects all non-public routes
  ⬜ Role-based access (admin dashboard pending)

A02 Security Misconfiguration:
  ✅ Security headers implemented
  ✅ Environment variables for all secrets
  ✅ CORS handled by Next.js
  ⬜ Content Security Policy (CSP) — partial

A03 Software Supply Chain:
  ⬜ npm audit run regularly
  ⬜ Dependabot not configured

A04 Injection:
  ✅ Prisma ORM prevents SQL injection
  ✅ Zod validates all user input
  ⚠️ Review raw SQL queries in search route

A05 Identification & Auth Failures:
  ✅ bcrypt with 12 rounds
  ✅ Account lockout after 5 attempts
  ✅ HTTP-only cookies
  ✅ JWT with expiry
  ⬜ Email verification (pending)
  ⬜ Password reset flow (pending)

A06 Outdated Components:
  ⬜ Automated dependency scanning pending

A07 Auth Failures:
  ✅ Rate limiting on auth endpoints
  ✅ Account lockout
  ✅ Secure cookie settings

A08 Data Integrity:
  ✅ Stripe webhook signature verification
  ✅ Server-side credit validation

A09 Security Logging:
  ✅ AuditLog model tracks all auth actions
  ⬜ Alerting not configured (Sentry pending)

A10 Mishandling Errors:
  ✅ try/catch on every route
  ✅ Generic error messages (no stack traces to client)
  ⬜ Sentry error monitoring (pending)
```
