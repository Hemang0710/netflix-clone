# LearnAI — AI Generation Studio

## What This Is

Creators can generate content using AI instead of creating everything manually.

```
Current flow:    Creator records video → uploads → AI processes it
New flow:        Creator describes what they want → AI generates:
                   - Video script
                   - Thumbnail image
                   - Course outline
                 Creator records using the script → uploads
```

## Credits System

```
Free credits on signup: 10

Action costs:
  Script generation:    2 credits
  Thumbnail generation: 3 credits
  Course outline:       1 credit
  Visual explanation:   1 credit (for learners)

Buy more credits (Stripe one-time payments):
  Starter:   50 credits = $4.99
  Pro:      200 credits = $14.99
  Unlimited: 1000 credits = $49.99
```

## Database Models

```prisma
model UserCredits {
  id      Int  @id @default(autoincrement())
  userId  Int  @unique
  credits Int  @default(10)
  user    User @relation(fields: [userId], references: [id])
}

model AIGeneration {
  id          Int      @id @default(autoincrement())
  userId      Int
  type        String   // SCRIPT | THUMBNAIL | OUTLINE | EXPLAIN
  prompt      String
  result      String?  // JSON string or S3 URL
  status      String   @default("completed")
  creditsUsed Int      @default(1)
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

## Credit Deduction Pattern (ALWAYS use transaction)

```javascript
// This pattern prevents race conditions
// If two requests come at same time, one will fail cleanly
await prisma.$transaction(async (tx) => {
  const credits = await tx.userCredits.findUnique({
    where: { userId }
  })

  if (!credits || credits.credits < COST) {
    throw new Error("Insufficient credits")
  }

  await tx.userCredits.update({
    where: { userId },
    data: { credits: { decrement: COST } }
  })

  // Save generation record
  await tx.aIGeneration.create({
    data: {
      userId,
      type: "SCRIPT",
      prompt: topic,
      result: null,  // fill after AI responds
      creditsUsed: COST,
    }
  })
})
// If any step fails, ALL steps roll back
```

## API Routes

### GET /api/credits
Returns current user's credit balance.
Never expose credit manipulation to client.

### POST /api/ai/script
```javascript
// Input (validated with Zod)
{
  topic: string,           // max 200 chars
  duration: "short" | "medium" | "long",
  style: "educational" | "tutorial" | "storytelling" | "interview",
  targetAudience: string   // optional
}

// Duration mapping:
// short  = 5 min script  (~750 words)
// medium = 15 min script (~2250 words)
// long   = 30 min script (~4500 words)

// Returns: streaming text (toUIMessageStreamResponse)
// Script structure AI must produce:
// - Hook (30 seconds)
// - Introduction
// - Main sections (numbered, each with title + talking points + example)
// - Conclusion
// - Call to action
```

### POST /api/ai/thumbnail
```javascript
// Input
{
  title: string,
  style: "cinematic" | "minimalist" | "bold" | "professional",
  mood: "exciting" | "calm" | "dramatic" | "friendly"
}

// Process:
// 1. Build detailed DALL-E 3 prompt from inputs
// 2. Generate 1024x576 image (16:9)
// 3. Upload to S3
// 4. Return S3 URL

// Uses OpenAI client (NOT Groq — Groq has no image generation)
// Falls back to colored gradient if OPENAI_API_KEY not set
```

### POST /api/ai/outline
```javascript
// Input
{
  subject: string,
  level: "beginner" | "intermediate" | "advanced",
  numModules: number  // 3-10
}

// Returns JSON (not streaming):
{
  courseTitle: string,
  description: string,
  totalDuration: string,
  modules: [{
    number: number,
    title: string,
    description: string,
    topics: string[],
    estimatedTime: string,
    suggestedVideoTitle: string
  }]
}

// Use generateText with temperature: 0.3 for consistent JSON
```

## Pages

```
/creator/studio         — AI Studio landing with 3 feature cards
/creator/generate/script     — Script writer
/creator/generate/thumbnail  — Thumbnail generator
/creator/generate/outline    — Course outline generator
```

## Stripe Credit Purchases

```javascript
// One-time payment (NOT subscription)
// mode: "payment" in Stripe checkout

// Stripe Dashboard → Products → Create product → Add price
// Type: One time (not recurring)

// In checkout session:
const session = await stripe.checkout.sessions.create({
  mode: "payment",  // ← not "subscription"
  line_items: [{ price: priceId, quantity: 1 }],
  metadata: {
    userId: String(userId),
    type: "credits",
    package: packageId,  // "starter" | "pro" | "unlimited"
  },
  success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/creator/studio?credits=added`,
  cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/creator/studio`,
})
```

### Webhook: checkout.session.completed
```javascript
// Only process if metadata.type === "credits"
const creditAmounts = {
  starter: 50,
  pro: 200,
  unlimited: 1000,
}

await prisma.userCredits.upsert({
  where: { userId },
  update: { credits: { increment: amount } },
  create: { userId, credits: amount },
})
```
