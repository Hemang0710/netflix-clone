# ConceptAI — Visual Explainer System

## What This Feature Is

When a learner is confused watching a video, instead of just giving text,
the platform generates a LIVE visual explanation tailored to that specific
concept in that specific video.

**This does not exist on any platform today.**

```
Current platforms (LinkedIn, Udemy, Coursera):
  Learner confused → AI gives text response → still confused

StreamAI ConceptAI:
  Learner confused → AI detects confusion type → generates:
    - Animated SVG diagram (visual learners)
    - Analogy story (conceptual learners)
    - Step-by-step walkthrough (detail learners)
  All using the actual video transcript as context
```

## How Confusion Is Detected

### Text Signals (from chat messages)
```javascript
const CONFUSION_PATTERNS = [
  /i don't (get|understand)/i,
  /i'm confused/i,
  /i still don't/i,
  /what does .+ mean/i,
  /can you explain .+ (again|differently|better)/i,
  /that doesn't make sense/i,
  /can you show me/i,
  /help me understand/i,
]

// Returns true if message contains confusion signal
function isConfused(message) {
  return CONFUSION_PATTERNS.some(p => p.test(message))
}

// Extracts what they're confused about
function extractConcept(message) {
  // "I don't understand useEffect" → "useEffect"
  // "Can you explain HTTP headers?" → "HTTP headers"
}
```

### Behavioral Signals (from video player)
```javascript
// Tracked in useVideoProgress hook additions:
rewindCount      // if user rewinds same 30s segment >2 times → confused
speedDecrease    // if user slows to 0.5x or 0.75x → confused
longPause        // if user pauses >30s mid-video → confused
```

## API Route: POST /api/ai/explain

### Input
```javascript
{
  concept: string,           // "HTTP headers"
  videoTranscript: string,   // first 3000 chars of transcript
  videoTitle: string,        // "REST API Tutorial"
  explanationType: "diagram" | "analogy" | "walkthrough"
}
```

### Output: diagram type
```javascript
{
  type: "diagram",
  title: "How HTTP Headers Work",
  description: "Visual breakdown of the concept",
  svgCode: "<svg viewBox='0 0 600 400'>...</svg>",
  keyPoints: ["Headers carry metadata", "Every request has headers", "..."],
  followUpPrompts: ["What happens without headers?", "Show me a real example"]
}
```

### Output: analogy type
```javascript
{
  type: "analogy",
  title: "HTTP Headers are like envelope labels",
  realWorldSetup: "Imagine sending a letter in an envelope...",
  mapping: [
    { analogy: "envelope", concept: "HTTP request", explanation: "..." },
    { analogy: "label on envelope", concept: "header", explanation: "..." }
  ],
  story: "Full flowing analogy text here...",
  followUpPrompts: ["Show me as a diagram", "Try different analogy"]
}
```

### Output: walkthrough type
```javascript
{
  type: "walkthrough",
  title: "How HTTP Headers Work — Step by Step",
  totalSteps: 5,
  steps: [
    {
      stepNumber: 1,
      title: "Browser makes a request",
      explanation: "When you type a URL...",
      svgHighlight: "<svg>small highlight diagram</svg>",
      keyPoint: "Every HTTP request has headers automatically"
    }
  ]
}
```

## SVG Requirements for AI Generation

All AI-generated SVG diagrams MUST follow these rules:

### Dimensions and Theme
```svg
<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="600" height="400" fill="#18181b" rx="12"/>
  <!-- All text: fill="white" or fill="#a1a1aa" -->
  <!-- Primary accent: fill="#e50914" (red) -->
</svg>
```

### Required Animation Pattern
```svg
<style>
  /* Fade in elements one by one */
  .appear { animation: fadeIn 0.5s ease forwards; opacity: 0; }
  .appear-1 { animation-delay: 0.2s; }
  .appear-2 { animation-delay: 0.7s; }
  .appear-3 { animation-delay: 1.2s; }
  .appear-4 { animation-delay: 1.7s; }

  /* Draw lines/arrows */
  .draw {
    animation: draw 1s ease forwards;
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  .draw-1 { animation-delay: 0.5s; }

  /* Pulse for emphasis */
  .pulse { animation: pulse 2s infinite; }

  @keyframes fadeIn { to { opacity: 1; } }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>

<!-- Arrow markers for relationship lines -->
<defs>
  <marker id="arrow" markerWidth="10" markerHeight="7"
          refX="10" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="#e50914"/>
  </marker>
</defs>
```

### Shapes Available
```svg
<!-- Box/Component -->
<rect x="50" y="50" width="120" height="60" rx="8"
      fill="#27272a" stroke="#3f3f46" stroke-width="1"
      class="appear appear-1"/>
<text x="110" y="85" fill="white" text-anchor="middle"
      font-size="14" class="appear appear-1">Browser</text>

<!-- Arrow line -->
<line x1="170" y1="80" x2="280" y2="80"
      stroke="#e50914" stroke-width="2"
      marker-end="url(#arrow)"
      class="draw draw-1"
      stroke-dasharray="110" stroke-dashoffset="110"/>

<!-- Circle -->
<circle cx="300" cy="80" r="40"
        fill="#3f3f46" stroke="#e50914" stroke-width="2"
        class="appear appear-2"/>

<!-- Label with background -->
<rect x="200" y="55" width="80" height="24" rx="4" fill="#e50914"
      class="appear appear-3"/>
<text x="240" y="71" fill="white" text-anchor="middle"
      font-size="11" font-weight="bold" class="appear appear-3">
  GET /api
</text>
```

## Components to Build

### src/components/visual/VisualExplainer.jsx
Router component — picks which explainer to show based on type.
Also handles loading state while AI generates the explanation.

### src/components/visual/DiagramExplainer.jsx
Renders animated SVG with:
- Title and description above SVG
- SVG in dark rounded container
- Key points as animated bullet list (stagger in one by one)
- Follow-up prompts as clickable chips
- "Replay animation" button (re-mounts SVG to restart CSS animations)
- "Try as analogy instead" button

### src/components/visual/AnalogyExplainer.jsx
Renders analogy story with:
- Title
- Story text (typing/streaming effect)
- Mapping table: Real World → Concept
- "Show me as diagram" button
- "Try different analogy" button

### src/components/visual/WalkthroughExplainer.jsx
Step-by-step interactive with:
- Progress bar showing "Step 2 of 5"
- One step at a time display
- Back / Next buttons
- Step number badge, title, explanation, key point
- Optional mini-SVG per step
- Jump-to dots at bottom
- "Got it! ✓" button on last step (sends positive signal)

## Feedback API: POST /api/ai/explain/feedback

### Input
```javascript
{
  contentId: number,
  concept: string,
  explainType: "diagram" | "analogy" | "walkthrough",
  helpful: boolean
}
```

### Logic
- If helpful: true → save to LearningInsight table, done
- If helpful: false → return next type to try:
  - diagram → try analogy
  - analogy → try walkthrough
  - walkthrough → try diagram (cycle)

## Integration in AIChatSidebar

The visual explainer appears INSIDE the chat sidebar, below the AI text response:

```
[ AI text response (existing) ]
[ ✨ Show me visually? ] ← button appears when confusion detected
  ↓ clicked
[ VisualExplainer component renders here ]
[ Did this help? 👍 👎 ]
```

The existing useChat setup is NOT modified.
Visual content is separate state alongside the chat.

## Database: LearningInsight Model

```prisma
model LearningInsight {
  id          Int      @id @default(autoincrement())
  userId      Int
  contentId   Int
  concept     String
  explainType String   // diagram | analogy | walkthrough
  helpful     Boolean
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

Run after adding:
```bash
npx prisma migrate dev --name add_learning_insight
```
