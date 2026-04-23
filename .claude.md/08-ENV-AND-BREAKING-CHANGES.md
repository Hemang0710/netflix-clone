# StreamAI — Environment Variables & Breaking Changes

## Complete .env File

```bash
# ─── DATABASE ───────────────────────────────────────────
DATABASE_URL="postgresql://postgres:password@host:5432/dbname?schema=public"
# Supabase format:
# postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# ─── AUTH ───────────────────────────────────────────────
JWT_SECRET="minimum-32-chars-random-string-here"

# ─── GOOGLE OAUTH ───────────────────────────────────────
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
# Callback URL (set in Google Cloud Console):
# Dev:  http://localhost:3000/api/auth/google/callback
# Prod: https://yourapp.vercel.app/api/auth/google/callback

# ─── TMDB API ───────────────────────────────────────────
TMDB_TOKEN="Bearer eyJhbGciOiJSUzI1NiJ9..."
NEXT_PUBLIC_TMDB_IMAGE="https://image.tmdb.org/t/p/original"

# ─── AWS S3 ─────────────────────────────────────────────
AWS_ACCESS_KEY_ID="AKIAxxxxxxxx"
AWS_SECRET_ACCESS_KEY="xxxxxxxx"
AWS_REGION="ca-central-1"
AWS_S3_BUCKET="streamai-videos-hemang"
# Bucket must be PUBLIC for video playback + AI transcription

# ─── UPSTASH REDIS (Rate Limiting) ──────────────────────
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# ─── AI PROVIDERS ───────────────────────────────────────
GROQ_API_KEY="gsk_xxx"
OPENAI_API_KEY="sk-xxx"  # For DALL-E thumbnail generation
AI_PROVIDER="groq"  # groq | openai | gemini

# ─── STRIPE ─────────────────────────────────────────────
STRIPE_SECRET_KEY="sk_test_xxx" or "sk_live_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
# Subscription plans (create in Stripe Dashboard)
STRIPE_PRICE_BASIC="price_xxx"
STRIPE_PRICE_STANDARD="price_xxx"
STRIPE_PRICE_PREMIUM="price_xxx"
# Credit packages (one-time payments)
STRIPE_CREDITS_STARTER="price_xxx"
STRIPE_CREDITS_PRO="price_xxx"
STRIPE_CREDITS_UNLIMITED="price_xxx"

# ─── EMAIL (Resend) ──────────────────────────────────────
RESEND_API_KEY="re_xxx"

# ─── APP ─────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL="http://localhost:3000"  # prod: https://yourapp.vercel.app
NODE_ENV="development"
```

## Critical Breaking Changes — This Project Hit All of These

### 1. Next.js 16 — Middleware Renamed
```
❌ middleware.js at project root
✅ src/proxy.js — rename file AND rename export function

// src/proxy.js
export function proxy(request) { ... }  // was: middleware(request)

// package.json or next.config.mjs — must configure
```

### 2. Next.js 16 — Params Are Promises
```javascript
// ❌ Old (Next.js 14/15 style)
export async function GET(request, { params }) {
  const id = params.id  // throws error
}

// ✅ New (Next.js 16)
export async function GET(request, { params }) {
  const { id } = await params  // must await
}

// Same for pages:
export default async function Page({ params, searchParams }) {
  const { id } = await params
  const { q } = await searchParams
}
```

### 3. Prisma 7 — No URL in schema.prisma
```prisma
// ❌ Old (Prisma 6 and below)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // remove this line
}

// ✅ New (Prisma 7)
datasource db {
  provider = "postgresql"
  // no url field
}
```

```typescript
// ✅ prisma.config.ts (NEW — create this file)
import { defineConfig } from "prisma/config"
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
```

### 4. Prisma 7 — Requires PrismaPg Adapter
```javascript
// src/lib/prisma.js — exact pattern required

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = global

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
```

### 5. Prisma 7 — Generator Provider
```prisma
// ❌ Breaks Turbopack
generator client {
  provider = "prisma-client"
}

// ✅ Correct
generator client {
  provider = "prisma-client-js"
}

// ❌ Remove this line (deprecated in Prisma 7)
previewFeatures = ["driverAdapters"]
```

### 6. Vercel AI SDK v6 — useChat Changes
```javascript
// ❌ v3/v4 pattern (BROKEN in v6)
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()

<input value={input} onChange={handleInputChange} />
<form onSubmit={handleSubmit}>

// ✅ v6 pattern (CORRECT)
const [input, setInput] = useState("")
const { messages, sendMessage, status, error } = useChat({
  api: "/api/chat",
  body: { contentId },
})
const isLoading = status === "streaming" || status === "submitted"

function handleSubmit(e) {
  e.preventDefault()
  if (!input.trim() || isLoading) return
  sendMessage({ text: input })
  setInput("")
}

<input value={input} onChange={e => setInput(e.target.value)} />
```

### 7. Vercel AI SDK v6 — Message Format
```javascript
// ❌ v4: message.content was a string
messages.map(m => m.content)

// ✅ v6: message.parts is an array
function getMessageText(message) {
  if (message.parts) {
    return message.parts
      .filter(p => p.type === "text")
      .map(p => p.text)
      .join("")
  }
  return message.content || ""
}
```

### 8. Vercel AI SDK v6 — Route Response Method
```javascript
// ❌ v4 method
return result.toDataStreamResponse()

// ✅ v6 method
return result.toUIMessageStreamResponse()
```

### 9. Tailwind v4 — No Config File
```javascript
// ❌ tailwind.config.js no longer works
module.exports = { theme: { extend: { colors: { brand: '#e50914' } } } }

// ✅ globals.css
@import "tailwindcss";
@theme {
  --color-brand: #e50914;
}

// ❌ @layer utilities
@layer utilities {
  .scrollbar-hide { }
}

// ✅ @utility
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

## Version Compatibility Matrix

| Package | Version Used | Key Change |
|---------|-------------|------------|
| next | 16.2.1 | params = Promise, middleware → proxy |
| react | 19.2.3 | use() hook, async components |
| prisma | 7.5.0 | No url in schema, requires adapter |
| @prisma/adapter-pg | 7.5.0 | New required package |
| ai | 6.0.168 | useChat lost input management |
| @ai-sdk/react | 3.0.170 | sendMessage({text}) not append |
| @ai-sdk/openai | 3.0.53 | createOpenAI still works |
| tailwindcss | 4.2.2 | CSS-first config, no config.js |
