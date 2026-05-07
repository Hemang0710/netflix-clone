# Micro-Learning Mode Implementation Guide

## Overview

Micro-Learning Mode automatically splits long educational videos into 2-5 minute concept-specific micro-lessons for better retention and mobile learning.

## Features

✅ **Auto-Generated Lessons** — AI splits videos into natural concept boundaries  
✅ **Transcript-Powered** — Uses video transcripts to identify key concepts  
✅ **Progress Tracking** — Track watched lessons and quiz scores  
✅ **Mobile-Optimized** — Perfect for learning on-the-go  
✅ **Smart Navigation** — Auto-advance to next lesson when current ends  

---

## Database Schema

### MicroLesson
Stores individual micro-lesson segments extracted from content.

```prisma
model MicroLesson {
  id                    Int       @id @default(autoincrement())
  contentId             Int       // Original video
  title                 String    // "Python Decorators: Overview"
  description           String?
  concept               String    // "decorators"
  
  startTimestamp        Float     // Seconds into video
  endTimestamp          Float
  duration              Int       // Seconds
  order                 Int       // Sequence number
  
  videoUrl              String?   // Optional separate trimmed video
  transcriptSegment     String    // Relevant transcript excerpt
  relatedFlashcards     String    // JSON array of flashcard IDs
  
  createdAt             DateTime  @default(now())
  progresses            MicroLessonProgress[]
}
```

### MicroLessonProgress
Tracks user's progress through micro-lessons.

```prisma
model MicroLessonProgress {
  id                    Int       @id @default(autoincrement())
  userId                Int
  microLessonId         Int
  
  watched               Boolean   @default(false)
  quizScore             Int?
  notesAdded            String?
  
  watchedAt             DateTime?
  createdAt             DateTime  @default(now())
}
```

---

## API Endpoints

### 1. Generate Micro-Lessons
**POST** `/api/content/[contentId]/micro-lessons/generate`

Automatically generate micro-lessons from video transcript.

**Requirements:**
- User must be creator or admin
- Video must have transcript processed

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 8,
    "lessons": [
      {
        "id": 1,
        "title": "Python Decorators: Overview",
        "concept": "decorators",
        "description": "Introduction to decorators",
        "startTimestamp": 0,
        "endTimestamp": 120,
        "duration": 120,
        "order": 1,
        "transcriptSegment": "..."
      }
    ]
  }
}
```

### 2. Fetch Micro-Lessons
**GET** `/api/content/[contentId]/micro-lessons`

Get all micro-lessons for a video.

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "...", "duration": 120, ... }
  ]
}
```

### 3. Update Lesson Progress
**POST** `/api/content/[contentId]/micro-lessons/[lessonId]/progress`

Mark lesson as watched or add quiz score.

**Body:**
```json
{
  "watched": true,
  "quizScore": 85,
  "notesAdded": "Important concept..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 55,
    "microLessonId": 101,
    "watched": true,
    "quizScore": 85,
    "watchedAt": "2026-04-29T..."
  }
}
```

### 4. Get Lesson Progress
**GET** `/api/content/[contentId]/micro-lessons/[lessonId]/progress`

Get current user's progress on a specific lesson.

### 5. Get Micro-Lessons Stats
**GET** `/api/content/[contentId]/micro-lessons/stats`

Get user's overall progress stats for all micro-lessons in a video.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLessons": 8,
    "watchedLessons": 5,
    "completionPercentage": 62.5,
    "totalDuration": 960,
    "totalDurationMinutes": 16,
    "averageQuizScore": 87,
    "progressByLesson": [
      {
        "id": 1,
        "title": "...",
        "watched": true,
        "quizScore": 90,
        "watchedAt": "2026-04-29T..."
      }
    ]
  }
}
```

---

## Frontend Components

### MicroLessonPlayer
Main component for viewing and navigating micro-lessons.

**Props:**
```typescript
interface MicroLessonPlayerProps {
  contentId: number
  microLessons: MicroLesson[]
  videoUrl: string
  contentTitle: string
}
```

**Usage:**
```jsx
import MicroLessonPlayer from "@/components/MicroLessonPlayer"

export default function WatchPage({ params }) {
  const [microLessons, setMicroLessons] = useState([])
  
  useEffect(() => {
    fetch(`/api/content/${params.id}/micro-lessons`)
      .then(r => r.json())
      .then(d => setMicroLessons(d.data))
  }, [params.id])
  
  return (
    <MicroLessonPlayer
      contentId={Number(params.id)}
      microLessons={microLessons}
      videoUrl={content.videoUrl}
      contentTitle={content.title}
    />
  )
}
```

**Features:**
- Auto-seek to lesson timestamps
- Auto-advance to next lesson when current ends
- Progress tracking (mark as watched)
- Sidebar with all lessons
- Navigation buttons (Previous/Next)
- Progress bar showing course completion
- Lesson statistics (duration, concept)

### MicroLessonManager
Creator-facing component to generate micro-lessons.

**Props:**
```typescript
interface MicroLessonManagerProps {
  contentId: number
  hasTranscript: boolean
}
```

**Usage:**
```jsx
import MicroLessonManager from "@/components/MicroLessonManager"

export default function CreatorDashboard() {
  return (
    <MicroLessonManager
      contentId={content.id}
      hasTranscript={!!content.transcript}
    />
  )
}
```

**Features:**
- Generate button (disabled if no transcript)
- Loading state
- Success/error messages
- Shows generated lesson count

---

## Implementation Steps

### Step 1: Database Migration
Run the migration to create tables:
```bash
npx prisma migrate deploy
```

### Step 2: Add to Watch Page
Update your watch page component to display micro-lessons:

```jsx
"use client"

import { useEffect, useState } from "react"
import MicroLessonPlayer from "@/components/MicroLessonPlayer"

export default function WatchPage({ params }) {
  const [content, setContent] = useState(null)
  const [microLessons, setMicroLessons] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadData() {
      const [contentRes, lessonsRes] = await Promise.all([
        fetch(`/api/content/${params.id}`),
        fetch(`/api/content/${params.id}/micro-lessons`)
      ])
      
      setContent(await contentRes.json())
      setMicroLessons(await lessonsRes.json())
      setLoading(false)
    }
    
    loadData()
  }, [params.id])
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div className="space-y-8">
      {microLessons.length > 0 && (
        <section>
          <h2 className="text-2xl font-black mb-4">Micro-Learning Mode</h2>
          <MicroLessonPlayer
            contentId={Number(params.id)}
            microLessons={microLessons}
            videoUrl={content.videoUrl}
            contentTitle={content.title}
          />
        </section>
      )}
    </div>
  )
}
```

### Step 3: Add to Creator Dashboard
Update creator dashboard to generate micro-lessons:

```jsx
import MicroLessonManager from "@/components/MicroLessonManager"

export default function EditContentPage({ params }) {
  const [content, setContent] = useState(null)
  
  useEffect(() => {
    fetch(`/api/content/${params.id}`)
      .then(r => r.json())
      .then(d => setContent(d.data))
  }, [params.id])
  
  return (
    <div className="space-y-6">
      {content && (
        <MicroLessonManager
          contentId={content.id}
          hasTranscript={!!content.transcript}
        />
      )}
    </div>
  )
}
```

---

## How It Works

### 1. Transcript Processing
- Video must have transcript available
- Transcript can be from YouTube captions, speech-to-text, or manual upload

### 2. AI Analysis (Groq)
- Analyzes transcript to identify concept boundaries
- Determines natural breakpoints (2-5 minute segments)
- Generates descriptive titles for each lesson
- Creates lesson descriptions

### 3. Database Storage
- Each micro-lesson stores start/end timestamps
- Includes transcript excerpt for reference
- Links to original content

### 4. User Experience
- Player automatically seeks to lesson start/end times
- Shows lesson title, description, and concept
- Tracks which lessons user has watched
- Auto-advances when lesson duration completes
- Displays progress bar and statistics

---

## Best Practices

### For Creators
1. **Ensure Good Transcripts** — Better transcripts = better micro-lessons
2. **Long Content** — Most beneficial for videos 15+ minutes
3. **Review Generated Lessons** — Quality varies based on transcript
4. **Re-generate if Needed** — Can regenerate to get different splits

### For Learners
1. **Mobile Learning** — Perfect for commute or quick sessions
2. **Review Concepts** — Use for targeted concept review
3. **Progress Tracking** — Mark lessons watched for accountability
4. **Quiz Integration** — Pair with concept quizzes for retention

---

## Future Enhancements

- [ ] Custom micro-lesson editing (drag to adjust timestamps)
- [ ] AI-generated quiz questions per micro-lesson
- [ ] Audio summaries for mobile listening
- [ ] Spaced repetition based on micro-lesson progress
- [ ] Micro-lesson collections and playlists
- [ ] Analytics dashboard for creators

---

## Troubleshooting

**Q: Micro-lessons not generating**
- A: Check that transcript is available (not null)
- Verify Groq API key is set in environment variables
- Check browser console for API errors

**Q: Wrong timestamp boundaries**
- A: Happens with poor transcripts
- Try re-generating or manually editing timestamps

**Q: Video doesn't seek to timestamp**
- A: Some video players/formats don't support seeking
- Ensure video codec supports HLS or MP4

---

## API Error Codes

| Code | Issue | Solution |
|------|-------|----------|
| 401 | Unauthorized | Log in first |
| 403 | Forbidden | Must be creator/admin |
| 404 | Content not found | Check content ID |
| 400 | No transcript | Wait for transcript processing |
| 500 | Generation failed | Check server logs |

---

## Example: Complete Watch Flow

```jsx
"use client"

import { useEffect, useState } from "react"
import MicroLessonPlayer from "@/components/MicroLessonPlayer"

export default function WatchContent({ params }) {
  const [content, setContent] = useState(null)
  const [lessons, setLessons] = useState([])
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    async function load() {
      const content = await fetch(
        `/api/content/${params.id}`
      ).then(r => r.json())
      
      const lessons = await fetch(
        `/api/content/${params.id}/micro-lessons`
      ).then(r => r.json())
      
      const stats = await fetch(
        `/api/content/${params.id}/micro-lessons/stats`
      ).then(r => r.json()).catch(() => null)
      
      setContent(content.data)
      setLessons(lessons.data || [])
      setStats(stats?.data || null)
    }
    
    load()
  }, [params.id])
  
  if (!content) return <div>Loading...</div>
  
  return (
    <div className="space-y-8">
      {lessons.length > 0 && (
        <div>
          {stats && (
            <div className="mb-4 p-4 bg-blue-500/10 rounded-lg">
              <p className="text-sm text-blue-400">
                {stats.completionPercentage}% complete •{" "}
                {stats.totalDurationMinutes} mins total
              </p>
            </div>
          )}
          
          <MicroLessonPlayer
            contentId={content.id}
            microLessons={lessons}
            videoUrl={content.videoUrl}
            contentTitle={content.title}
          />
        </div>
      )}
    </div>
  )
}
```
