# LearnAI — Database Schema

## Critical Prisma 7 Rules
- `prisma.config.ts` handles the database URL — NOT schema.prisma
- schema.prisma datasource block has NO `url` field
- Generator uses `provider = "prisma-client-js"` (NOT "prisma-client" — breaks Turbopack)
- `previewFeatures = ["driverAdapters"]` line is REMOVED — deprecated in Prisma 7
- Run migrations with: `npx prisma migrate dev --name description`

## Current Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id             Int              @id @default(autoincrement())
  email          String           @unique
  password       String?          // null for OAuth users (Google)
  role           String           @default("viewer") // viewer | creator | admin | subscriber
  createdAt      DateTime         @default(now())
  profiles       Profile?
  content        Content[]
  purchases      Purchase[]
  subscription   Subscription?
  watchlist      Watchlist[]
  watchProgress  WatchProgress[]
  quizAttempts   QuizAttempt[]
  auditLogs      AuditLog[]
  aiGenerations  AIGeneration[]
  credits        UserCredits?
  learningInsights LearningInsight[]
}

model Profile {
  id        Int     @id @default(autoincrement())
  userId    Int     @unique
  user      User    @relation(fields: [userId], references: [id])
  name      String
  avatarUrl String?
  bio       String?
}

model Content {
  id            Int           @id @default(autoincrement())
  title         String
  description   String
  videoUrl      String
  thumbnailUrl  String?
  duration      Int?
  price         Float         @default(0)
  isFree        Boolean       @default(true)
  status        String        @default("processing") // processing | ready | failed
  aiSummary     String?
  transcript    String?
  chapters      String?       // JSON string: [{time: 0, title: "Intro"}, ...]
  genre         String        @default("General")
  creatorId     Int
  creator       User          @relation(fields: [creatorId], references: [id])
  purchases     Purchase[]
  views         Int           @default(0)
  watchProgress WatchProgress[]
  quiz          Quiz?
  quizAttempts  QuizAttempt[]
  createdAt     DateTime      @default(now())
}

model Subscription {
  id               Int      @id @default(autoincrement())
  userId           Int      @unique
  user             User     @relation(fields: [userId], references: [id])
  stripeCustomerId String?
  stripeSubId      String?  @unique
  plan             String   // basic | standard | premium
  status           String   @default("active") // active | cancelled | past_due
  periodEnd        DateTime
  createdAt        DateTime @default(now())
}

model Purchase {
  id        Int      @id @default(autoincrement())
  userId    Int
  contentId Int
  amount    Float
  user      User     @relation(fields: [userId], references: [id])
  content   Content  @relation(fields: [contentId], references: [id])
  createdAt DateTime @default(now())
  @@unique([userId, contentId])
}

model Watchlist {
  id         Int      @id @default(autoincrement())
  userId     Int
  tmdbId     Int?
  contentId  Int?
  title      String
  posterPath String?
  user       User     @relation(fields: [userId], references: [id])
  addedAt    DateTime @default(now())
}

model WatchProgress {
  id        Int      @id @default(autoincrement())
  userId    Int
  contentId Int
  timestamp Float    @default(0)   // seconds into video
  duration  Float    @default(0)   // total video duration
  completed Boolean  @default(false)
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
  content   Content  @relation(fields: [contentId], references: [id])
  @@unique([userId, contentId])
}

model Quiz {
  id        Int          @id @default(autoincrement())
  contentId Int          @unique
  content   Content      @relation(fields: [contentId], references: [id])
  questions String       // JSON: [{question, options[], correct, explanation}, ...]
  createdAt DateTime     @default(now())
}

model QuizAttempt {
  id        Int      @id @default(autoincrement())
  userId    Int
  contentId Int
  score     Int      // 0-100
  answers   String   // JSON
  user      User     @relation(fields: [userId], references: [id])
  content   Content  @relation(fields: [contentId], references: [id])
  createdAt DateTime @default(now())
}

model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id])
  action    String   // LOGIN | REGISTER | UPLOAD | PAYMENT | LOGOUT
  resource  String?
  ip        String?
  userAgent String?
  success   Boolean
  metadata  String?  // JSON
  createdAt DateTime @default(now())
}

model AIGeneration {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  type        String   // SCRIPT | THUMBNAIL | OUTLINE | EXPLAIN
  prompt      String
  result      String?  // JSON or URL
  status      String   @default("completed")
  creditsUsed Int      @default(1)
  createdAt   DateTime @default(now())
}

model UserCredits {
  id      Int  @id @default(autoincrement())
  userId  Int  @unique
  user    User @relation(fields: [userId], references: [id])
  credits Int  @default(10)
}

model LearningInsight {
  id          Int      @id @default(autoincrement())
  userId      Int
  contentId   Int
  concept     String   // what they were confused about
  explainType String   // diagram | analogy | walkthrough
  helpful     Boolean
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
}
```

## Migration Commands
```bash
# Create and apply a migration
npx prisma migrate dev --name description_here

# Apply migrations to production
npx prisma migrate deploy

# Reset database (dev only — destroys all data)
npx prisma migrate reset

# View database in browser
npx prisma studio

# After schema change, regenerate client
npx prisma generate
```

## Important Patterns

### Finding current user's data
```javascript
// userId comes from JWT payload as STRING — always convert
const user = await getCurrentUser()
const userId = Number(user.userId)  // ← always Number()
```

### Upsert pattern (create or update)
```javascript
await prisma.watchProgress.upsert({
  where: { userId_contentId: { userId, contentId } },
  update: { timestamp, duration },
  create: { userId, contentId, timestamp, duration },
})
```

### Transaction for credit deduction
```javascript
await prisma.$transaction(async (tx) => {
  const credits = await tx.userCredits.findUnique({ where: { userId } })
  if (!credits || credits.credits < cost) throw new Error("Insufficient credits")
  await tx.userCredits.update({
    where: { userId },
    data: { credits: { decrement: cost } },
  })
  // do the AI work here
})
```

### JSON fields (chapters, questions, etc.)
```javascript
// Always stringify when saving
data: { chapters: JSON.stringify(chaptersArray) }

// Always parse when reading
const chapters = content.chapters ? JSON.parse(content.chapters) : []
```
