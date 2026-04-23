# StreamAI — Master Prompt Template

When asking any AI (Claude, ChatGPT, etc.) to build features for this project,
start EVERY conversation with this context block. This prevents the AI from
making wrong assumptions about your stack or suggesting deprecated patterns.

---

## Context Block (paste this at the start of every AI conversation)

```
I am building StreamAI — a full-stack AI-powered video learning platform.

EXACT VERSIONS (critical — do not suggest alternatives):
- Next.js 16.2.1 (App Router, Turbopack)
- React 19.2.3
- Prisma 7.5.0 with @prisma/adapter-pg (NOT standard Prisma setup)
- PostgreSQL via Supabase
- Vercel AI SDK: ai@6.0.168, @ai-sdk/react@3.0.170, @ai-sdk/openai@3.0.53
- Tailwind CSS v4 (CSS-first, NO tailwind.config.js)
- JavaScript only (TypeScript migration happening separately)

BREAKING CHANGES I HAVE ALREADY HANDLED (do not suggest the old way):
1. params/searchParams are Promises → always: const { id } = await params
2. Prisma 7 has no url in datasource block → URL in prisma.config.ts
3. Prisma 7 requires PrismaPg adapter in PrismaClient constructor
4. AI SDK v6 useChat has NO input management → use useState + sendMessage({text})
5. AI SDK v6 messages use parts array → message.parts[0].text not message.content
6. AI SDK v6 route returns → result.toUIMessageStreamResponse() not toDataStreamResponse()
7. Next.js 16 middleware → file is proxy.js, function is proxy()
8. Tailwind v4 config → in globals.css using @theme, not tailwind.config.js

IMPORT PATTERNS (always use these exact imports):
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateBody } from "@/lib/schemas"
import { useChat } from "@ai-sdk/react"

EVERY API ROUTE MUST:
1. checkRateLimit first
2. getCurrentUser for protected routes
3. validateBody with Zod schema
4. try/catch with console.error("[ROUTE] error:", error)
5. Return { success: boolean, data?, message? }

CREDIT DEDUCTION must ALWAYS use prisma.$transaction()

DO NOT:
- Use TypeScript (project is JS only right now)
- Use NextAuth (we have manual JWT auth)
- Use toDataStreamResponse() (use toUIMessageStreamResponse())
- Use handleInputChange from useChat (manage input with useState)
- Add url to datasource block in schema.prisma
- Create tailwind.config.js
- Use params.id without awaiting params first
```

---

## Feature-Specific Prompt Templates

### For ConceptAI Visual Explainer
```
I need to build the ConceptAI visual explanation system for StreamAI.
[paste context block above]

The existing AIChatSidebar.jsx uses useChat from @ai-sdk/react.
Input state is managed with useState (not useChat's input).
Messages use message.parts[0].text format.

Confusion detection patterns:
/i don't (get|understand)/i, /i'm confused/i, /what does .+ mean/i

The visual explainer should appear BELOW the AI text response
as a separate component — it does NOT replace the chat.

[describe the specific part you want built]
```

### For API Routes
```
I need to build [route name] for StreamAI.
[paste context block above]

This route needs to:
- [list what it does]
- Deduct [N] credits (use prisma.$transaction)
- Rate limit with: checkRateLimit(request, "api")

The Groq client is configured in src/lib/openai.js as:
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
})

[describe inputs, outputs, business logic]
```

### For React Components
```
I need to build [component name] for StreamAI.
[paste context block above]

This is a Client Component ("use client").
It will be used in: [page or parent component]
Props it receives: [list props]

Styling rules:
- Tailwind only (no inline styles except SVG)
- Dark theme: bg-zinc-950, bg-zinc-900, bg-zinc-800
- Brand color: red-600 for primary buttons
- Text: white for headlines, zinc-300 for body, zinc-400 for meta

[describe the UI and interactions needed]
```

### For Database Changes
```
I need to update the StreamAI database schema.
[paste context block above]

CURRENT schema models (already exist): User, Content, Subscription,
Purchase, Watchlist, WatchProgress, Quiz, QuizAttempt, AuditLog,
AIGeneration, UserCredits, LearningInsight

[describe new model or changes needed]

After showing the schema change, show me:
1. The migration command
2. Any changes needed to existing routes that use this model
```

---

## What Each Doc File Is For

| File | Use When |
|------|----------|
| 01-PROJECT-OVERVIEW.md | Starting a new AI conversation — share this |
| 02-FOLDER-STRUCTURE.md | Adding new files, confused about where to put things |
| 03-DATABASE-SCHEMA.md | Modifying database, adding models, writing queries |
| 04-API-PATTERNS.md | Building API routes — shows exact required pattern |
| 05-FRONTEND-PATTERNS.md | Building React components, pages |
| 06-AI-INTEGRATION.md | Building anything with AI (chat, generation, visuals) |
| 07-CONCEPTAI-SYSTEM.md | Building the visual explainer feature specifically |
| 08-ENV-AND-BREAKING-CHANGES.md | Debugging errors, setting up env vars |
| 09-SECURITY.md | Adding security features, understanding what's already there |
| 10-AI-GENERATION-STUDIO.md | Building creator AI tools (script, thumbnail, outline) |
| 11-MASTER-PROMPT.md | This file — template for every AI conversation |

---

## Common Mistakes AI Makes Without This Context

```
❌ Suggests: NextAuth.js for authentication
✅ Correct: We have manual JWT in src/lib/auth.js

❌ Suggests: params.id (without await)
✅ Correct: const { id } = await params

❌ Suggests: message.content for AI chat
✅ Correct: message.parts.filter(p => p.type === "text").map(p => p.text).join("")

❌ Suggests: handleInputChange from useChat
✅ Correct: useState + sendMessage({ text: input })

❌ Suggests: toDataStreamResponse()
✅ Correct: toUIMessageStreamResponse()

❌ Suggests: url = env("DATABASE_URL") in schema.prisma
✅ Correct: URL goes in prisma.config.ts only

❌ Suggests: tailwind.config.js
✅ Correct: @theme in globals.css

❌ Suggests: TypeScript files (.ts, .tsx)
✅ Correct: JavaScript files (.js, .jsx) — TS migration is separate
```
