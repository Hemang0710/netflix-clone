# LearnAI — API Patterns & Conventions

## Every API Route Must Follow This Pattern

```javascript
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { validateBody, yourSchema } from "@/lib/schemas"

export async function POST(request) {
  try {
    // 1. Rate limit FIRST
    const { success } = await checkRateLimit(request, "api")
    if (!success) {
      return NextResponse.json(
        { success: false, message: "Too many requests" },
        { status: 429 }
      )
    }

    // 2. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      )
    }

    // 3. Parse and validate body
    const body = await request.json()
    const validation = validateBody(yourSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: validation.errors },
        { status: 400 }
      )
    }

    // 4. Business logic
    const result = await prisma.something.create({ ... })

    // 5. Return success
    return NextResponse.json({ success: true, data: result }, { status: 201 })

  } catch (error) {
    console.error("[ROUTE_NAME] error:", error)
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    )
  }
}
```

## Standard HTTP Status Codes Used

```
200 — OK (GET success)
201 — Created (POST success creating a resource)
400 — Bad Request (validation failed, missing fields)
401 — Unauthorized (not logged in)
403 — Forbidden (logged in but wrong permissions)
404 — Not Found
409 — Conflict (duplicate email, already in watchlist)
423 — Locked (account locked due to failed attempts)
429 — Too Many Requests (rate limited)
500 — Internal Server Error (unexpected crash)
```

## Standard Response Format

```javascript
// Success
{ success: true, data: {...} }
{ success: true, message: "Created", data: {...} }

// Error
{ success: false, message: "Human readable message" }
{ success: false, message: "Validation failed", errors: { field: "message" } }
```

## Auth Pattern — getCurrentUser()

```javascript
// src/lib/auth.js
// Returns JWT payload or null
const user = await getCurrentUser()
// user = { userId: "1", email: "user@example.com" } or null

// ALWAYS convert userId to Number for Prisma
const userId = Number(user.userId)
```

## Rate Limit Types

```javascript
// Available limiters in src/lib/rateLimit.js
checkRateLimit(request, "auth")    // 5 requests per 15 min (login, register)
checkRateLimit(request, "api")     // 60 requests per minute (general)
checkRateLimit(request, "upload")  // 10 uploads per hour
```

## Dynamic Route Params (Next.js 16 — MUST await)

```javascript
// WRONG — will throw error in Next.js 16
export async function GET(request, { params }) {
  const id = params.id  // ❌ params is a Promise
}

// CORRECT
export async function GET(request, { params }) {
  const { id } = await params  // ✅ must await
  const numId = Number(id)     // always convert to number
}
```

## Streaming AI Routes

```javascript
// For streaming responses (chat, script generation)
import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

const result = streamText({
  model: groq("llama-3.3-70b-versatile"),
  system: "...",
  messages,
  maxTokens: 500,
})

return result.toUIMessageStreamResponse()  // v6 method (NOT toDataStreamResponse)
```

## Non-Streaming AI Routes (for structured JSON output)

```javascript
// For getting structured data (chapters, quiz, explanations)
import { generateText } from "ai"

const { text } = await generateText({
  model: groq("llama-3.3-70b-versatile"),
  system: "Return ONLY valid JSON. No markdown, no explanation.",
  prompt: "...",
  maxTokens: 800,
  temperature: 0.3,  // low temp for consistent JSON
})

const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
const parsed = JSON.parse(cleaned)
```

## S3 Upload Pattern

```javascript
// NEVER upload videos through your server
// Always use presigned URLs

// Step 1: Client asks server for a presigned URL
POST /api/upload/presigned
{ fileName, contentType, fileType: "video" | "thumbnail" }
→ Returns: { presignedUrl, fileUrl, key }

// Step 2: Client uploads directly to S3
await fetch(presignedUrl, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file
})

// Step 3: Client saves the fileUrl to database
POST /api/content
{ videoUrl: fileUrl, ... }
```

## Prisma Transaction Pattern (for atomicity)

```javascript
// Use when multiple DB operations must succeed or fail together
const result = await prisma.$transaction(async (tx) => {
  const record = await tx.model.findUnique(...)
  if (!record) throw new Error("Not found")
  
  await tx.model.update(...)
  await tx.otherModel.create(...)
  
  return result
})
```
