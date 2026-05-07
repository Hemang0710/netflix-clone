# LearnAI — Frontend Patterns & Conventions

## Server vs Client Component Decision

```
Use Server Component (default) when:
✓ Fetching data from database or API
✓ Only displaying data (no user interaction)
✓ Reading cookies, headers, or search params
✓ Performance sensitive (no JS sent to browser)

Use Client Component ("use client") when:
✓ Using useState, useEffect, useContext
✓ Handling onClick, onChange, onSubmit
✓ Using browser APIs (localStorage, navigator)
✓ Using third-party client libraries (useChat, framer-motion)
```

## Common Component Patterns

### Page Component (Server — fetches data)
```javascript
// src/app/some-page/page.js
import SomeClientComponent from "@/components/SomeClientComponent"
import { getCurrentUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function SomePage({ params, searchParams }) {
  // Must await in Next.js 16
  const { id } = await params
  const { q } = await searchParams
  
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  
  const data = await prisma.content.findMany({...})
  
  return <SomeClientComponent data={data} userId={Number(user.userId)} />
}
```

### Interactive Component (Client)
```javascript
// src/components/SomeClientComponent.jsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SomeClientComponent({ data, userId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAction() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/some-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ... }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.message); return }
      router.refresh()  // re-fetch server data
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (...)
}
```

## AI Chat (Vercel AI SDK v6 Pattern)

```javascript
// CRITICAL: v6 does NOT manage input state
// You MUST use your own useState for input

"use client"
import { useChat } from "@ai-sdk/react"
import { useState } from "react"

const [input, setInput] = useState("")

const { messages, sendMessage, status, error } = useChat({
  api: "/api/chat",
  body: { contentId },  // extra data sent with every request
})

const isLoading = status === "streaming" || status === "submitted"

// Send a message
function handleSubmit(e) {
  e.preventDefault()
  if (!input.trim() || isLoading) return
  sendMessage({ text: input })
  setInput("")
}

// Get text from message (v6 uses parts array)
function getMessageText(message) {
  if (message.parts) {
    return message.parts.filter(p => p.type === "text").map(p => p.text).join("")
  }
  return message.content || ""
}
```

## Tailwind CSS v4 Patterns

```css
/* globals.css — configuration goes here, NOT tailwind.config.js */
@import "tailwindcss";

@theme {
  /* Custom design tokens */
  --color-brand: #e50914;
}

/* Custom utilities */
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
```

```jsx
/* Standard dark theme classes used throughout */
bg-zinc-950    /* darkest — main page backgrounds */
bg-zinc-900    /* card backgrounds */
bg-zinc-800    /* input backgrounds */
border-zinc-800 /* card borders */
border-zinc-700 /* subtle borders */
text-zinc-400  /* secondary text */
text-zinc-300  /* body text */
text-white     /* primary text */
text-red-600   /* brand color */
```

## Loading States Pattern

```
/browse/loading.js    ← Next.js auto-shows during page load
/browse/error.js      ← Next.js auto-shows on component crash

Skeleton components:
import { SkeletonCard, SkeletonRow, SkeletonHero } from "@/components/SkeletonCard"
```

## Navigation After Actions

```javascript
const router = useRouter()

// After data mutation — use refresh() to re-fetch server data
router.push("/browse")
router.refresh()  // ← important: clears Next.js cache

// For search params without full navigation
router.replace(`/search?q=${query}`)
```

## Image Component (Next.js)

```jsx
// Always use next/image for optimized loading
import Image from "next/image"

// S3 images — allowed in next.config.mjs
<Image
  src={s3Url}
  alt={title}
  fill                    // fills parent container
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 300px"
/>

// TMDB posters
<Image
  src={`https://image.tmdb.org/t/p/w300${posterPath}`}
  alt={title}
  fill
  className="object-cover"
  sizes="144px"
/>
```

## Context Usage

```javascript
// Watchlist (global state)
import { useWatchlist } from "@/context/WatchlistContext"
const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()

// isInWatchlist always uses Number() comparison
isInWatchlist(Number(movie.id))
```

## Custom Hooks

```javascript
// Video progress tracking
import { useVideoProgress } from "@/hooks/useVideoProgress"
useVideoProgress(videoRef, content.id)
// Automatically: loads saved position, saves every 10s, saves on pause
```

## Color Scheme Quick Reference

```
Background layers:
  zinc-950 → main pages
  zinc-900 → cards, sidebars
  zinc-800 → inputs, hover states

Brand:
  red-600  → primary buttons, accents, logo
  red-700  → hover state for red-600

Status:
  green-400/600  → success, completed
  yellow-400     → warning, in progress
  red-400/500    → error messages

Text:
  white        → headlines, important text
  zinc-300     → body text
  zinc-400     → secondary/meta text
  zinc-500     → placeholder, disabled
```
