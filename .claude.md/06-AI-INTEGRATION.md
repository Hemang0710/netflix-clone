# LearnAI — AI Integration Reference

## AI Providers Configured

### Groq (Primary — Free tier available)
```javascript
// src/lib/openai.js
import { createOpenAI } from "@ai-sdk/openai"

const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

// Models available:
// - llama-3.3-70b-versatile  → best quality, use for summaries, scripts, chat
// - llama-3.1-8b-instant     → fastest, use for simple tasks
// - whisper-large-v3-turbo   → transcription ($0.04/hr)
```

### OpenAI (For image generation only)
```javascript
import OpenAI from "openai"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
// Used only for DALL-E thumbnail generation
```

## Existing AI Functions in src/lib/openai.js

```javascript
// Transcribe audio from S3 URL
transcribeAudio(audioUrl: string): Promise<string>

// Generate summary from transcript
generateSummary(transcript: string, title: string): Promise<string>

// Generate chapters array from transcript
generateChapters(transcript: string, duration?: number): Promise<Array<{time: number, title: string}>>

// Generate quiz questions from transcript
generateQuiz(transcript: string, title: string): Promise<Array<{
  question: string,
  options: string[],
  correct: number,
  explanation: string
}>>
```

## AI SDK v6 Patterns

### Streaming (for chat, scripts)
```javascript
import { streamText } from "ai"

const result = streamText({
  model: groq("llama-3.3-70b-versatile"),
  system: systemPrompt,
  messages,           // array of { role, parts: [{type: "text", text: "..."}] }
  maxTokens: 500,
  temperature: 0.7,
})

return result.toUIMessageStreamResponse()  // ← v6 method
```

### Non-streaming (for structured JSON)
```javascript
import { generateText } from "ai"

const { text } = await generateText({
  model: groq("llama-3.3-70b-versatile"),
  system: "Return ONLY valid JSON. No markdown code blocks.",
  prompt: yourPrompt,
  maxTokens: 800,
  temperature: 0.3,  // low for consistent output
})

// Clean and parse
const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
return JSON.parse(cleaned)
```

## Visual Explanation System (NEW — ConceptAI)

### What It Does
When a learner is confused, instead of text, the AI generates:
1. **Diagram** — Animated SVG showing the concept visually
2. **Analogy** — Real-world story that maps to the concept
3. **Walkthrough** — Step-by-step interactive breakdown

### API Endpoint: POST /api/ai/explain
```javascript
// Input
{
  concept: string,          // "What are HTTP headers?"
  videoTranscript: string,  // transcript excerpt for context
  videoTitle: string,
  explanationType: "diagram" | "analogy" | "walkthrough"
}

// Output for "diagram"
{
  type: "diagram",
  title: string,
  description: string,
  svgCode: string,          // complete self-contained animated SVG
  keyPoints: string[],
  followUpPrompts: string[]
}

// Output for "analogy"
{
  type: "analogy",
  title: string,
  realWorldSetup: string,
  mapping: [{ analogy: string, concept: string, explanation: string }],
  story: string,
  followUpPrompts: string[]
}

// Output for "walkthrough"
{
  type: "walkthrough",
  title: string,
  totalSteps: number,
  steps: [{
    stepNumber: number,
    title: string,
    explanation: string,
    svgHighlight: string?,
    keyPoint: string
  }]
}
```

### SVG Diagram Requirements
All AI-generated SVGs must be:
- viewBox="0 0 600 400"
- Dark theme: background #18181b, text white
- Self-contained (no external resources)
- Animated using CSS keyframes in `<style>` tag
- Staggered animations using animation-delay
- Simple shapes: rect, circle, path, text, line, polygon
- Arrow markers defined in `<defs>`
- Animation patterns:
  ```svg
  <style>
    .appear { animation: fadeIn 0.5s ease forwards; opacity: 0; }
    .appear-1 { animation-delay: 0.2s; }
    .appear-2 { animation-delay: 0.7s; }
    .draw { 
      animation: draw 1s ease forwards; 
      stroke-dasharray: 1000; 
      stroke-dashoffset: 1000; 
    }
    @keyframes fadeIn { to { opacity: 1; } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
  </style>
  ```

## Prompt Engineering Guidelines

### System Prompt Structure
```
1. Role definition (who the AI is)
2. Context (what platform, what video)
3. Output format (exact JSON structure if needed)
4. Rules (tone, length, constraints)
5. Examples if needed
```

### For Structured JSON Output
```
System: "You are a [role]. Return ONLY valid JSON with this exact structure:
{
  "field1": "string",
  "field2": ["array"]
}
No markdown code blocks. No explanation text. Only the JSON object."

Prompt: "[specific request]"
Temperature: 0.3 (lower = more consistent)
```

### For Conversational/Creative Output
```
System: "You are [role]. [Context]. [Rules about length/tone]."
Temperature: 0.7 (higher = more creative)
```

## Confusion Detection Signals

The platform detects learner confusion from:

### Text signals (in chat messages)
```javascript
const CONFUSION_PATTERNS = [
  /i don't (get|understand)/i,
  /i'm confused/i,
  /what does .+ mean/i,
  /can you explain .+ (again|differently|better)/i,
  /i still don't/i,
  /that doesn't make sense/i,
  /can you show me/i,
  /help me understand/i,
]
```

### Behavioral signals (from video player)
```javascript
// Tracked in useVideoProgress hook
rewindCount    // >2 rewinds on same 30s segment = confused
slowdownEvent  // changed to 0.5x or 0.75x speed = confused
longPause      // paused for >30s mid-video = confused
```

## Credit System

```javascript
// Costs per action
SCRIPT_GENERATION: 2 credits
THUMBNAIL_GENERATION: 3 credits
COURSE_OUTLINE: 1 credit
VISUAL_EXPLANATION: 1 credit

// Free credits on signup: 10
// Buy more via Stripe one-time payments
```

## Environment Variables Required

```bash
# Groq (free tier)
GROQ_API_KEY="gsk_..."

# OpenAI (for DALL-E thumbnails)
OPENAI_API_KEY="sk-..."

# AI provider selection
AI_PROVIDER="groq"  # groq | openai | gemini
```
