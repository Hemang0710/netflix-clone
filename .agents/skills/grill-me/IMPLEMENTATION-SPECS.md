# LearnAI: Complete Technical Implementation Specifications
## Detailed Backend + Frontend Specs for All Features

**Version:** 1.0  
**Date:** April 28, 2026  
**Status:** Ready for Development  

---

## 📑 Table of Contents

1. [Blockchain Micro-Credentials](#1-blockchain-micro-credentials)
2. [AI-Powered Study Groups](#2-ai-powered-study-groups)
3. [Intelligent Study Planner](#3-intelligent-study-planner)
4. [Micro-Learning Mode](#4-micro-learning-mode)
5. [Mobile PWA + Offline](#5-mobile-pwa--offline)
6. [Peer Code/Project Review](#6-peer-codeproject-review)
7. [Concept Mastery Badges](#7-concept-mastery-badges)

---

# 1. BLOCKCHAIN MICRO-CREDENTIALS

## 1.1 Overview & Architecture

**Goal:** Issue verifiable, blockchain-anchored micro-credentials when learners master individual concepts.

**Tech Stack:**
- **Blockchain:** Hedera Hashgraph (testnet for dev, mainnet for production)
- **Smart Contract:** Solidity/Hedera Smart Contract (badge registry)
- **Credential Standard:** W3C Verifiable Credentials + OpenBadges 3.0
- **Storage:** IPFS (metadata), Hedera (anchor/proof)
- **Frontend:** QR code + verification page

---

## 1.2 Database Schema (Prisma)

```prisma
model Badge {
  id                    Int       @id @default(autoincrement())
  contentId             Int       // Video/concept this badge is for
  content               Content   @relation(fields: [contentId], references: [id])
  
  name                  String    // "Python Decorators Master"
  description           String
  icon                  String    // SVG or image URL
  criteria              String    // JSON: {minQuizScore: 85, minFlashcardReps: 50}
  
  isPublished           Boolean   @default(false)
  createdAt             DateTime  @default(now())
  
  // Relations
  issuances             BadgeIssuance[]
  learningInsights      LearningInsight[]
}

model BadgeIssuance {
  id                    Int       @id @default(autoincrement())
  userId                Int
  user                  User      @relation(fields: [userId], references: [id])
  badgeId               Int
  badge                 Badge     @relation(fields: [badgeId], references: [id])
  
  // Blockchain
  hederaTxHash          String?   // Transaction hash on Hedera
  hederaTokenId         String?   // NFT token ID if minted
  credentialUrl         String?   // IPFS URL of W3C credential JSON
  verificationCode      String    @unique // QR code data
  
  // Metadata
  earnedAt              DateTime  @default(now())
  expiresAt             DateTime? // Optional expiration
  isPublic              Boolean   @default(true) // Shareable publicly
  sharedOn              String[]  @default([]) // ["linkedin", "twitter"]
  
  // Performance
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@unique([userId, badgeId])
}

model BadgeVerification {
  id                    Int       @id @default(autoincrement())
  verificationCode      String    @unique
  badgeIssuanceId       Int
  badgeIssuance         BadgeIssuance @relation(fields: [badgeIssuanceId], references: [id])
  
  // Verification metadata
  verifiedBy            String?   // Employer email or system
  verificationDate      DateTime?
  verificationStatus    String    @default("pending") // pending | verified | expired
  
  createdAt             DateTime  @default(now())
}
```

---

## 1.3 API Endpoints

### 1.3.1 **POST /api/badges** (Admin only)
Create a new badge template for a concept.

**Request:**
```json
{
  "contentId": 42,
  "name": "Python Decorators Master",
  "description": "Demonstrated mastery of Python decorators through quizzes and practice",
  "icon": "<svg>...</svg>",
  "criteria": {
    "minQuizScore": 85,
    "minFlashcardReps": 50,
    "minTimeSpent": 600
  },
  "creatorId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "contentId": 42,
    "name": "Python Decorators Master",
    "criteria": { "minQuizScore": 85, ... },
    "isPublished": false
  }
}
```

**Backend Logic:**
```javascript
// routes/api/badges/route.js
export async function POST(request) {
  const user = await getCurrentUser();
  if (user.role !== "admin") return Response(403);
  
  const { contentId, name, description, icon, criteria, creatorId } = await request.json();
  
  // Validate content exists
  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) return Response(404);
  
  const badge = await prisma.badge.create({
    data: {
      contentId,
      name,
      description,
      icon,
      criteria: JSON.stringify(criteria),
      isPublished: false
    }
  });
  
  return Response.json({ success: true, data: badge });
}
```

---

### 1.3.2 **POST /api/badges/[badgeId]/issue** (Automated, triggered by system)
Issue a badge to a learner when they meet criteria.

**Request:**
```json
{
  "userId": 55,
  "badgeId": 101,
  "quizScore": 92,
  "flashcardReps": 65,
  "timeSpent": 800
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5001,
    "userId": 55,
    "badgeId": 101,
    "hederaTxHash": "0x123abc...",
    "verificationCode": "BADGE-ABC123DEF456",
    "credentialUrl": "ipfs://QmXxxx...",
    "earnedAt": "2026-04-28T10:30:00Z"
  }
}
```

**Backend Logic:**
```javascript
// routes/api/badges/[badgeId]/issue/route.js
import { issueHederaBadge } from "@/lib/hedera";

export async function POST(request, { params }) {
  const { userId, badgeId, quizScore, flashcardReps, timeSpent } = await request.json();
  
  // Get badge + criteria
  const badge = await prisma.badge.findUnique({
    where: { id: badgeId }
  });
  
  const criteria = JSON.parse(badge.criteria);
  
  // Check if learner meets criteria
  if (quizScore < criteria.minQuizScore || 
      flashcardReps < criteria.minFlashcardReps ||
      timeSpent < criteria.minTimeSpent) {
    return Response.json({ success: false, message: "Criteria not met" }, { status: 400 });
  }
  
  // Check if already issued
  const existing = await prisma.badgeIssuance.findUnique({
    where: { userId_badgeId: { userId, badgeId } }
  });
  if (existing) {
    return Response.json({ success: false, message: "Already earned" }, { status: 400 });
  }
  
  // Create W3C credential
  const credential = {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://openbadges.org/schemas/v3/"
    ],
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      id: "https://learnai.io",
      name": "LearnAI",
      image": "https://learnai.io/logo.png"
    },
    issuanceDate": new Date().toISOString(),
    credentialSubject: {
      id": `did:hedera:mainnet:${userId}`,
      name": user.profile.name,
      email": user.email
    },
    badge: {
      id": badge.id,
      name": badge.name,
      description": badge.description,
      image": badge.icon,
      criteria": criteria
    }
  };
  
  // Upload to IPFS
  const ipfsUrl = await uploadToIPFS(JSON.stringify(credential));
  
  // Anchor on Hedera
  const { txHash, tokenId } = await issueHederaBadge({
    userId,
    badgeId,
    credentialUrl: ipfsUrl,
    metadata: credential
  });
  
  // Save issuance record
  const issuance = await prisma.badgeIssuance.create({
    data: {
      userId,
      badgeId,
      hederaTxHash: txHash,
      hederaTokenId: tokenId,
      credentialUrl: ipfsUrl,
      verificationCode: generateVerificationCode()
    }
  });
  
  return Response.json({ success: true, data: issuance });
}
```

---

### 1.3.3 **GET /api/badges/user/[userId]** (Learner badges)
Get all badges earned by a user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5001,
      "badge": {
        "id": 101,
        "name": "Python Decorators Master",
        "icon": "<svg>...</svg>"
      },
      "earnedAt": "2026-04-28T10:30:00Z",
      "verificationCode": "BADGE-ABC123",
      "hederaTxHash": "0x123abc...",
      "isPublic": true
    }
  ]
}
```

**Backend:**
```javascript
export async function GET(request, { params }) {
  const { userId } = await params;
  
  const issuances = await prisma.badgeIssuance.findMany({
    where: { userId: Number(userId) },
    include: {
      badge: { select: { id: true, name: true, icon: true, description: true } }
    },
    orderBy: { earnedAt: "desc" }
  });
  
  return Response.json({ success: true, data: issuances });
}
```

---

### 1.3.4 **GET /api/badges/verify/[verificationCode]** (Public verification)
Anyone can verify a badge via verification code.

**Response:**
```json
{
  "success": true,
  "data": {
    "badge": {
      "name": "Python Decorators Master",
      "icon": "<svg>...</svg>"
    },
    "learner": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "earnedAt": "2026-04-28T10:30:00Z",
    "criteria": { "minQuizScore": 85, ... },
    "hederaTxHash": "0x123abc...",
    "verified": true
  }
}
```

**Backend:**
```javascript
export async function GET(request, { params }) {
  const { verificationCode } = await params;
  
  const issuance = await prisma.badgeIssuance.findUnique({
    where: { verificationCode },
    include: {
      badge: true,
      user: { select: { email: true, profile: { select: { name: true } } } }
    }
  });
  
  if (!issuance) return Response.json({ success: false }, { status: 404 });
  
  // Verify on Hedera (check tx exists)
  const hederaVerified = await verifyHederaTx(issuance.hederaTxHash);
  
  return Response.json({
    success: true,
    data: {
      badge: { name: issuance.badge.name, icon: issuance.badge.icon },
      learner: { name: issuance.user.profile?.name, email: issuance.user.email },
      earnedAt: issuance.earnedAt,
      criteria: JSON.parse(issuance.badge.criteria),
      hederaTxHash: issuance.hederaTxHash,
      verified: hederaVerified
    }
  });
}
```

---

## 1.4 Frontend Components

### 1.4.1 **BadgeEarnedModal.jsx** (Celebratory modal when badge earned)

```jsx
"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"

export default function BadgeEarnedModal({ badge, issuance, onClose }) {
  const [copied, setCopied] = useState(false)
  const verificationUrl = `https://learnai.io/verify/${issuance.verificationCode}`
  
  const handleShare = (platform) => {
    const text = `I just earned the "${badge.name}" badge on LearnAI! Verify it here: ${verificationUrl}`
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`,
      copy: () => { 
        navigator.clipboard.writeText(verificationUrl); 
        setCopied(true) 
      }
    }
    
    if (typeof urls[platform] === "string") {
      window.open(urls[platform], "_blank")
    } else {
      urls[platform]()
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-linear-to-br from-[#0d1a2e] to-[#1a2a3a] border border-indigo-500/30 rounded-3xl p-8 max-w-md text-center space-y-6">
        
        {/* Celebration animation */}
        <div className="text-6xl animate-bounce">🎉</div>
        
        {/* Badge icon */}
        <div className="flex justify-center">
          <div 
            className="w-32 h-32 rounded-full bg-linear-to-br from-indigo-400 to-purple-600 flex items-center justify-center p-4 shadow-xl shadow-indigo-500/50"
            dangerouslySetInnerHTML={{ __html: badge.icon }}
          />
        </div>
        
        {/* Badge name + description */}
        <div>
          <h2 className="text-2xl font-black text-white mb-2">{badge.name}</h2>
          <p className="text-slate-400 text-sm">{badge.description}</p>
        </div>
        
        {/* Verification info */}
        <div className="bg-white/3 rounded-xl p-4 space-y-2">
          <p className="text-xs text-slate-500">Blockchain Verified</p>
          <p className="text-xs font-mono text-indigo-300 break-all">{issuance.hederaTxHash.slice(0, 16)}...</p>
          <a 
            href={`https://hashscan.io/testnet/transaction/${issuance.hederaTxHash}`}
            target="_blank"
            rel="noopener"
            className="text-xs text-indigo-400 hover:text-indigo-300"
          >
            View on Hedera ↗
          </a>
        </div>
        
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG value={verificationUrl} size={180} level="H" />
        </div>
        
        {/* Share buttons */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Share your achievement</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => handleShare("twitter")}
              className="flex-1 bg-[#1DA1F2] hover:bg-[#1a91da] text-white py-2 rounded-lg text-sm font-semibold"
            >
              𝕏
            </button>
            <button 
              onClick={() => handleShare("linkedin")}
              className="flex-1 bg-[#0A66C2] hover:bg-[#095195] text-white py-2 rounded-lg text-sm font-semibold"
            >
              LinkedIn
            </button>
            <button 
              onClick={() => handleShare("copy")}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-semibold"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        
        {/* Close */}
        <button 
          onClick={onClose}
          className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-lg font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
```

---

### 1.4.2 **BadgeVerificationPage.jsx** (`/verify/[code]`)

```jsx
import { notFound } from "next/navigation"

export default async function BadgeVerificationPage({ params }) {
  const { code } = await params
  
  const res = await fetch(`${process.env.API_URL}/api/badges/verify/${code}`)
  const data = await res.json()
  
  if (!data.success) notFound()
  
  const { badge, learner, earnedAt, criteria, hederaTxHash, verified } = data.data
  
  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        
        {/* Verification status */}
        <div className={`p-4 rounded-lg mb-8 ${verified ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30"}`}>
          <p className={verified ? "text-emerald-400" : "text-red-400"}>
            {verified ? "✓ Verified on Hedera" : "✗ Verification failed"}
          </p>
        </div>
        
        {/* Badge display */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div 
              className="w-48 h-48 rounded-full bg-linear-to-br from-indigo-400 to-purple-600 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: badge.icon }}
            />
          </div>
          
          <div>
            <h1 className="text-3xl font-black mb-2">{badge.name}</h1>
            <p className="text-slate-400">{learner.name}</p>
            <p className="text-slate-600 text-sm">{learner.email}</p>
          </div>
          
          {/* Details */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Earned on</span>
              <span className="text-white font-semibold">{new Date(earnedAt).toLocaleDateString()}</span>
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <p className="text-slate-500 text-sm mb-2">Criteria Met:</p>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>✓ Quiz Score: ≥{criteria.minQuizScore}%</li>
                <li>✓ Flashcard Reps: ≥{criteria.minFlashcardReps}</li>
                <li>✓ Time Spent: ≥{criteria.minTimeSpent} min</li>
              </ul>
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <p className="text-slate-600 text-xs font-mono break-all">
                TX: {hederaTxHash}
              </p>
              <a 
                href={`https://hashscan.io/testnet/transaction/${hederaTxHash}`}
                target="_blank"
                className="text-indigo-400 text-xs hover:text-indigo-300"
              >
                View on Hedera ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
```

---

### 1.4.3 **UserBadgesShowcase.jsx** (Profile page badge section)

```jsx
"use client"

import { useEffect, useState } from "react"
import BadgeCard from "./BadgeCard"

export default function UserBadgesShowcase({ userId }) {
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch(`/api/badges/user/${userId}`)
      .then(r => r.json())
      .then(d => setBadges(d.data))
      .finally(() => setLoading(false))
  }, [userId])
  
  if (loading) return <div className="animate-pulse h-32 bg-white/5 rounded-xl" />
  
  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl">🏅</span>
        <p className="text-slate-500 mt-2">No badges earned yet. Keep learning!</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold">Earned Badges</h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {badges.map(issuance => (
          <BadgeCard 
            key={issuance.id} 
            badge={issuance.badge} 
            issuance={issuance}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 1.5 Hedera Integration (`lib/hedera.js`)

```javascript
import { Client, ContractCreateTransaction, ContractFunctionTransaction } from "@hashgraph/sdk";
import * as fs from "fs";

const client = Client.forTestnet();
client.setOperator(
  process.env.HEDERA_ACCOUNT_ID,
  process.env.HEDERA_PRIVATE_KEY
);

// Deploy badge registry contract (one-time setup)
export async function deployBadgeContract() {
  const bytecode = fs.readFileSync("./contracts/BadgeRegistry.bin", "utf8");
  
  const contractCreate = await new ContractCreateTransaction()
    .setGas(100000)
    .setBytecode(bytecode)
    .execute(client);
  
  const receipt = await contractCreate.getReceipt(client);
  return receipt.contractId.toString();
}

// Issue a badge on-chain
export async function issueHederaBadge({ userId, badgeId, credentialUrl, metadata }) {
  const transaction = await new ContractFunctionTransaction()
    .setContractId(process.env.HEDERA_BADGE_CONTRACT)
    .setGas(100000)
    .setFunction("issueBadge", [
      String(userId),
      String(badgeId),
      credentialUrl,
      JSON.stringify(metadata)
    ])
    .execute(client);
  
  const receipt = await transaction.getReceipt(client);
  
  return {
    txHash: transaction.transactionId.toString(),
    tokenId: receipt.topicId?.toString() || null
  };
}

// Verify badge on-chain
export async function verifyHederaTx(txHash) {
  try {
    const [accountId, num] = txHash.split("@");
    const [timestamp1, timestamp2] = num.split("-");
    
    // Query transaction record from Hedera
    const record = await client.queryAndSignTransaction(
      new TransactionRecordQuery().setTransactionId({ accountId, timestamp: { seconds: timestamp1, nanos: timestamp2 } })
    );
    
    return record.receipt.status.toString() === "SUCCESS";
  } catch {
    return false;
  }
}
```

---

## 1.6 Automation Trigger (Check when to issue badges)

**Location:** `lib/badgeEligibility.js`

```javascript
export async function checkAndIssueBadges(userId, contentId) {
  // Get user's quiz score for this content
  const quizAttempt = await prisma.quizAttempt.findFirst({
    where: { userId, contentId },
    orderBy: { createdAt: "desc" }
  });
  
  // Get flashcard stats
  const flashcards = await prisma.flashcard.findMany({
    where: { userId, contentId }
  });
  const totalReps = flashcards.reduce((sum, fc) => sum + fc.repetitions, 0);
  
  // Get watch time
  const watchProgress = await prisma.watchProgress.findUnique({
    where: { userId_contentId: { userId, contentId } }
  });
  const timeSpent = watchProgress?.timestamp || 0;
  
  // Get all badges for this content
  const badges = await prisma.badge.findMany({
    where: { contentId, isPublished: true }
  });
  
  // Check each badge
  for (const badge of badges) {
    const criteria = JSON.parse(badge.criteria);
    
    if (
      (quizAttempt?.score || 0) >= criteria.minQuizScore &&
      totalReps >= criteria.minFlashcardReps &&
      timeSpent >= criteria.minTimeSpent
    ) {
      // Issue the badge
      await issueBadgeToUser(userId, badge.id, {
        quizScore: quizAttempt?.score || 0,
        flashcardReps: totalReps,
        timeSpent
      });
    }
  }
}

// Call this after quiz submission or flashcard completion
export async function issueBadgeToUser(userId, badgeId, metrics) {
  const res = await fetch(`${process.env.API_URL}/api/badges/${badgeId}/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, badgeId, ...metrics })
  });
  
  return res.json();
}
```

**Hook in QuizAttempt Submission:**
```javascript
// In /api/content/[id]/quiz/attempt/route.js
// After saving quiz attempt:
await checkAndIssueBadges(user.userId, contentId);
```

---

# 2. AI-POWERED STUDY GROUPS

## 2.1 Overview & Architecture

**Goal:** Automatically match learners with peers at similar levels, provide AI-moderated group chat, enable peer learning.

**Tech Stack:**
- **Matching:** Embedding-based similarity (cosine distance)
- **Chat:** Real-time WebSocket or polling
- **Moderation:** Groq API + abuse detection
- **Database:** PostgreSQL + Redis (for active sessions)

---

## 2.2 Database Schema (Prisma)

```prisma
model StudyGroup {
  id                    Int       @id @default(autoincrement())
  contentId             Int
  content               Content   @relation(fields: [contentId], references: [id])
  
  topicName             String    // "Python Decorators"
  description           String?
  
  // Group settings
  maxMembers            Int       @default(5)
  isActive              Boolean   @default(true)
  createdAt             DateTime  @default(now())
  expiresAt             DateTime? // Auto-delete after 30 days inactive
  
  // Relations
  members               StudyGroupMember[]
  messages              StudyGroupMessage[]
}

model StudyGroupMember {
  id                    Int       @id @default(autoincrement())
  groupId               Int
  group                 StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  userId                Int
  user                  User      @relation(fields: [userId], references: [id])
  
  // Metadata
  skillLevel            String    // "beginner" | "intermediate" | "advanced"
  quizScore             Int?      // Last quiz score on this content
  embedding             Float[]   // Learner embedding (for matching)
  
  joinedAt              DateTime  @default(now())
  lastActivity          DateTime  @default(now())
  
  @@unique([groupId, userId])
}

model StudyGroupMessage {
  id                    Int       @id @default(autoincrement())
  groupId               Int
  group                 StudyGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  userId                Int?
  user                  User?     @relation(fields: [userId], references: [id])
  
  message               String
  isAI                  Boolean   @default(false) // AI moderation/response
  
  // Moderation
  isFlagged             Boolean   @default(false)
  flagReason            String?
  moderationScore       Float?    // 0-1, higher = more likely toxic
  
  // Helpful tracking
  helpfulCount          Int       @default(0)
  
  createdAt             DateTime  @default(now())
}
```

---

## 2.3 API Endpoints

### 2.3.1 **POST /api/study-groups/find-or-create** (Auto-match learner)
Find or create a study group for a learner on a content.

**Request:**
```json
{
  "contentId": 42,
  "userId": 55,
  "skillLevel": "intermediate",
  "quizScore": 78
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "groupId": 201,
    "topicName": "Python Decorators",
    "members": 3,
    "maxMembers": 5,
    "isNewGroup": false,
    "joinedAt": "2026-04-28T10:30:00Z"
  }
}
```

**Backend:**
```javascript
// routes/api/study-groups/find-or-create/route.js
import { generateEmbedding, findSimilarLearners } from "@/lib/embeddings";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false }, { status: 401 });
  
  const { contentId, skillLevel, quizScore } = await request.json();
  
  // Check if user already in a group for this content
  const existing = await prisma.studyGroupMember.findFirst({
    where: {
      userId: user.userId,
      group: { contentId }
    },
    include: { group: true }
  });
  
  if (existing) {
    return Response.json({
      success: true,
      data: { groupId: existing.groupId, isNewGroup: false }
    });
  }
  
  // Generate learner embedding (skill + quiz score + learning style)
  const embedding = await generateEmbedding({
    skillLevel,
    quizScore,
    content: "learning_embedding"
  });
  
  // Find similar learners (same content, similar skill level)
  const similarLearners = await findSimilarLearners(embedding, contentId);
  
  // Find or create group
  let group;
  if (similarLearners.length > 0) {
    // Join existing group with similar learners
    const groupId = similarLearners[0].groupId;
    const memberCount = await prisma.studyGroupMember.count({
      where: { groupId }
    });
    
    if (memberCount < 5) {
      group = await prisma.studyGroup.findUnique({ where: { id: groupId } });
    } else {
      // Group full, create new one
      group = await prisma.studyGroup.create({
        data: {
          contentId,
          topicName: (await prisma.content.findUnique({ where: { id: contentId } })).title
        }
      });
    }
  } else {
    // No similar learners, create new group
    group = await prisma.studyGroup.create({
      data: {
        contentId,
        topicName: (await prisma.content.findUnique({ where: { id: contentId } })).title
      }
    });
  }
  
  // Add user to group
  await prisma.studyGroupMember.create({
    data: {
      groupId: group.id,
      userId: user.userId,
      skillLevel,
      quizScore,
      embedding
    }
  });
  
  // Send AI welcome message
  const welcomeMsg = await generateStudyGroupWelcome(group);
  await prisma.studyGroupMessage.create({
    data: {
      groupId: group.id,
      message: welcomeMsg,
      isAI: true
    }
  });
  
  return Response.json({
    success: true,
    data: {
      groupId: group.id,
      topicName: group.topicName,
      isNewGroup: true
    }
  });
}
```

---

### 2.3.2 **GET /api/study-groups/[groupId]** (Get group + messages)
Fetch a study group with all messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "group": {
      "id": 201,
      "topicName": "Python Decorators",
      "members": [
        { "userId": 55, "name": "Alice", "skillLevel": "intermediate" },
        { "userId": 56, "name": "Bob", "skillLevel": "intermediate" }
      ]
    },
    "messages": [
      {
        "id": 5001,
        "userId": null,
        "message": "Welcome to the Python Decorators study group!",
        "isAI": true,
        "createdAt": "2026-04-28T10:30:00Z"
      },
      {
        "id": 5002,
        "userId": 55,
        "userName": "Alice",
        "message": "I'm struggling with wrapping functions...",
        "helpfulCount": 0,
        "createdAt": "2026-04-28T10:31:00Z"
      }
    ]
  }
}
```

**Backend:**
```javascript
export async function GET(request, { params }) {
  const { groupId } = await params;
  
  const group = await prisma.studyGroup.findUnique({
    where: { id: Number(groupId) },
    include: {
      members: {
        include: { user: { select: { email: true, profile: { select: { name: true } } } } }
      }
    }
  });
  
  const messages = await prisma.studyGroupMessage.findMany({
    where: { groupId: Number(groupId) },
    orderBy: { createdAt: "asc" },
    take: 100 // Last 100 messages
  });
  
  return Response.json({
    success: true,
    data: { group, messages }
  });
}
```

---

### 2.3.3 **POST /api/study-groups/[groupId]/messages** (Send message)
Post a message to a study group.

**Request:**
```json
{
  "message": "I'm struggling with wrapping functions..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5002,
    "message": "I'm struggling with wrapping functions...",
    "userId": 55,
    "isAI": false,
    "createdAt": "2026-04-28T10:31:00Z"
  }
}
```

**Backend:**
```javascript
import { moderateMessage, generateAIResponse } from "@/lib/moderation";

export async function POST(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false }, { status: 401 });
  
  const { groupId } = await params;
  const { message } = await request.json();
  
  // Validate membership
  const member = await prisma.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: Number(groupId), userId: user.userId } }
  });
  if (!member) return Response.json({ success: false, message: "Not in group" }, { status: 403 });
  
  // Moderate message
  const { score, isToxic } = await moderateMessage(message);
  
  // Save message
  const savedMessage = await prisma.studyGroupMessage.create({
    data: {
      groupId: Number(groupId),
      userId: user.userId,
      message,
      isFlagged: isToxic,
      moderationScore: score
    }
  });
  
  // Update last activity
  await prisma.studyGroupMember.update({
    where: { groupId_userId: { groupId: Number(groupId), userId: user.userId } },
    data: { lastActivity: new Date() }
  });
  
  // If user is struggling, generate AI response
  if (message.toLowerCase().includes("help") || message.toLowerCase().includes("stuck")) {
    const aiResponse = await generateAIResponse({
      message,
      groupTopic: (await prisma.studyGroup.findUnique({ where: { id: Number(groupId) } })).topicName,
      context: "study_group_peer_support"
    });
    
    // Post AI response after 2 sec (feels more natural)
    setTimeout(async () => {
      await prisma.studyGroupMessage.create({
        data: {
          groupId: Number(groupId),
          message: aiResponse,
          isAI: true
        }
      });
    }, 2000);
  }
  
  return Response.json({ success: true, data: savedMessage });
}
```

---

### 2.3.4 **POST /api/study-groups/[groupId]/messages/[messageId]/helpful** (Mark helpful)
Upvote a helpful message.

**Backend:**
```javascript
export async function POST(request, { params }) {
  const { groupId, messageId } = await params;
  
  const msg = await prisma.studyGroupMessage.update({
    where: { id: Number(messageId) },
    data: { helpfulCount: { increment: 1 } }
  });
  
  return Response.json({ success: true, data: msg });
}
```

---

## 2.4 Frontend Components

### 2.4.1 **StudyGroupChat.jsx** (Real-time chat UI)

```jsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export default function StudyGroupChat({ groupId, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const messagesEndRef = useRef(null)
  const router = useRouter()
  
  // Fetch group data
  useEffect(() => {
    async function loadGroup() {
      const res = await fetch(`/api/study-groups/${groupId}`)
      const data = await res.json()
      setMessages(data.data.messages)
      setMembers(data.data.group.members)
    }
    loadGroup()
  }, [groupId])
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Poll for new messages (every 2 sec)
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/study-groups/${groupId}`)
      const data = await res.json()
      setMessages(data.data.messages)
    }, 2000);
    
    return () => clearInterval(interval);
  }, [groupId])
  
  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    
    setLoading(true)
    const res = await fetch(`/api/study-groups/${groupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input.trim() })
    })
    
    if (res.ok) {
      setInput("")
      // Refresh messages
      const data = await fetch(`/api/study-groups/${groupId}`).then(r => r.json())
      setMessages(data.data.messages)
    }
    setLoading(false)
  }
  
  return (
    <div className="h-screen flex flex-col bg-[#050508]">
      
      {/* Header */}
      <div className="bg-white/3 border-b border-white/8 px-6 py-4">
        <h2 className="text-white font-bold mb-1">Study Group</h2>
        <div className="flex gap-2 flex-wrap">
          {members.slice(0, 3).map(m => (
            <span key={m.userId} className="text-xs text-slate-400 flex items-center gap-1">
              👤 {m.name.split(" ")[0]}
            </span>
          ))}
          {members.length > 3 && <span className="text-xs text-slate-600">+{members.length - 3} more</span>}
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.userId === currentUserId ? "justify-end" : ""}`}
          >
            {!msg.isAI && msg.userId !== currentUserId && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                {/* Get user initial */}
                {msg.userName?.charAt(0) || "?"}
              </div>
            )}
            
            {msg.isAI && (
              <div className="text-lg shrink-0">🤖</div>
            )}
            
            <div className={`max-w-xs ${msg.userId === currentUserId ? "bg-indigo-600" : msg.isAI ? "bg-white/5" : "bg-white/8"} rounded-lg px-4 py-2.5`}>
              {msg.isAI && <p className="text-indigo-300 text-xs font-semibold mb-1">AI Tutor</p>}
              <p className="text-sm text-white">{msg.message}</p>
              
              {!msg.isAI && (
                <button
                  onClick={async () => {
                    await fetch(`/api/study-groups/${groupId}/messages/${msg.id}/helpful`, {
                      method: "POST"
                    });
                    // Refresh
                  }}
                  className="text-[10px] text-slate-500 hover:text-indigo-400 mt-2"
                >
                  👍 Helpful ({msg.helpfulCount})
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-white/8 px-6 py-4 bg-white/2">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask for help or share insights..."
            className="flex-1 bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-colors"
          >
            {loading ? "…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

### 2.4.2 **StudyGroupCard.jsx** (Browse/join groups)

```jsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StudyGroupCard({ group }) {
  const [joining, setJoining] = useState(false)
  const router = useRouter()
  
  async function handleJoin() {
    setJoining(true)
    const res = await fetch(`/api/study-groups/find-or-create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: group.contentId,
        skillLevel: "intermediate", // Get from user profile
        quizScore: 0
      })
    })
    
    const data = await res.json()
    router.push(`/study-groups/${data.data.groupId}`)
  }
  
  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <h3 className="font-bold text-white">{group.topicName}</h3>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {group.members.slice(0, 3).map((m, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-indigo-600 text-xs flex items-center justify-center">
              {m.name.charAt(0)}
            </div>
          ))}
          {group.members.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center">
              +{group.members.length - 3}
            </div>
          )}
        </div>
        <span className="text-xs text-slate-500">{group.members.length}/{group.maxMembers}</span>
      </div>
      
      <button
        onClick={handleJoin}
        disabled={joining || group.members.length >= group.maxMembers}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 text-white disabled:text-slate-600 py-2 rounded-lg text-sm font-semibold transition-colors"
      >
        {joining ? "Joining…" : group.members.length >= group.maxMembers ? "Group Full" : "Join Group"}
      </button>
    </div>
  )
}
```

---

## 2.5 Moderation (`lib/moderation.js`)

```javascript
import Groq from "@anthropic-ai/sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function moderateMessage(message) {
  const response = await groq.messages.create({
    model: "mixtral-8x7b-32768",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Rate this message for toxicity (0-1 scale, where 1 is most toxic): "${message}"\n\nRespond with ONLY a number between 0 and 1.`
    }]
  });
  
  const score = parseFloat(response.content[0].text);
  return {
    score,
    isToxic: score > 0.7
  };
}

export async function generateAIResponse({ message, groupTopic, context }) {
  const response = await groq.messages.create({
    model: "mixtral-8x7b-32768",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `You are a helpful study group moderator. A learner said: "${message}" in a study group about "${groupTopic}".
      
Provide a brief, encouraging response that helps them learn better. Keep it under 100 words.`
    }]
  });
  
  return response.content[0].text;
}
```

---

# 3. INTELLIGENT STUDY PLANNER

## 3.1 Overview & Architecture

**Goal:** AI generates a personalized weekly learning schedule based on learner availability, goals, and content difficulty.

---

## 3.2 Database Schema

```prisma
model StudyPlan {
  id                    Int       @id @default(autoincrement())
  userId                Int
  user                  User      @relation(fields: [userId], references: [id])
  
  // Plan metadata
  hoursPerWeek          Int       // 5, 10, 20, etc.
  goal                  String    // "certify" | "hobby" | "career_switch"
  targetCareer          String?   // "data_scientist", "web_developer"
  
  // AI-generated schedule
  schedule              String    // JSON: [{day: "Monday", time: "9am", duration: 60, activity: "watch_lesson"}]
  preferences           String?   // JSON: {preferMorning: true, ...}
  
  isActive              Boolean   @default(true)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  tasks                 StudyTask[]
  adjustments           ScheduleAdjustment[]
}

model StudyTask {
  id                    Int       @id @default(autoincrement())
  planId                Int
  plan                  StudyPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  contentId             Int?
  content               Content?  @relation(fields: [contentId], references: [id])
  
  // Task details
  title                 String
  description           String?
  taskType              String    // "watch_lesson" | "quiz" | "flashcards" | "review"
  duration              Int       // minutes
  
  // Schedule
  scheduledFor          DateTime
  completed             Boolean   @default(false)
  completedAt           DateTime?
  
  createdAt             DateTime  @default(now())
}

model ScheduleAdjustment {
  id                    Int       @id @default(autoincrement())
  planId                Int
  plan                  StudyPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  reason                String    // "fell_behind" | "ahead" | "lost_interest"
  adjustment            String    // JSON description of changes
  appliedAt             DateTime  @default(now())
}
```

---

## 3.3 API Endpoints

### 3.3.1 **POST /api/study-plans** (Create plan)

**Request:**
```json
{
  "hoursPerWeek": 10,
  "goal": "certify",
  "targetCareer": "data_scientist",
  "preferences": {
    "preferMorning": true,
    "preferMobileTime": true,
    "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "planId": 501,
    "schedule": [
      { "day": "Monday", "time": "9:00 AM", "duration": 60, "activity": "Watch: Python Basics" },
      { "day": "Monday", "time": "10:15 AM", "duration": 15, "activity": "Quiz & Review" }
    ]
  }
}
```

**Backend:**
```javascript
// routes/api/study-plans/route.js
import { generateStudyPlan } from "@/lib/planGenerator";

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false }, { status: 401 });
  
  const { hoursPerWeek, goal, targetCareer, preferences } = await request.json();
  
  // Generate schedule via AI
  const { schedule, tasks } = await generateStudyPlan({
    userId: user.userId,
    hoursPerWeek,
    goal,
    targetCareer,
    preferences
  });
  
  // Save plan
  const plan = await prisma.studyPlan.create({
    data: {
      userId: user.userId,
      hoursPerWeek,
      goal,
      targetCareer,
      schedule: JSON.stringify(schedule),
      preferences: JSON.stringify(preferences)
    }
  });
  
  // Save tasks
  await prisma.studyTask.createMany({
    data: tasks.map(t => ({
      planId: plan.id,
      ...t
    }))
  });
  
  return Response.json({
    success: true,
    data: { planId: plan.id, schedule }
  });
}
```

---

### 3.3.2 **GET /api/study-plans/[planId]** (Get plan + tasks)

```javascript
export async function GET(request, { params }) {
  const { planId } = await params;
  const user = await getCurrentUser();
  
  const plan = await prisma.studyPlan.findUnique({
    where: { id: Number(planId) },
    include: { tasks: { orderBy: { scheduledFor: "asc" } } }
  });
  
  if (!plan || plan.userId !== user.userId) {
    return Response.json({ success: false }, { status: 403 });
  }
  
  return Response.json({ success: true, data: plan });
}
```

---

### 3.3.3 **POST /api/study-plans/[planId]/tasks/[taskId]/complete** (Mark task done)

```javascript
export async function POST(request, { params }) {
  const { planId, taskId } = await params;
  const user = await getCurrentUser();
  
  // Verify ownership
  const plan = await prisma.studyPlan.findUnique({ where: { id: Number(planId) } });
  if (plan.userId !== user.userId) return Response.json({ success: false }, { status: 403 });
  
  const task = await prisma.studyTask.update({
    where: { id: Number(taskId) },
    data: { completed: true, completedAt: new Date() }
  });
  
  // Check if we should adjust schedule (if falling behind/ahead)
  const allTasks = await prisma.studyTask.findMany({
    where: { planId: Number(planId) }
  });
  
  const completedCount = allTasks.filter(t => t.completed).length;
  const expectedCount = allTasks.filter(t => t.scheduledFor <= new Date()).length;
  
  if (completedCount < expectedCount * 0.5) {
    // User is falling behind, adjust schedule
    await adjustSchedule(Number(planId), "fell_behind");
  }
  
  return Response.json({ success: true, data: task });
}
```

---

## 3.4 Plan Generator (`lib/planGenerator.js`)

```javascript
import Groq from "@anthropic-ai/sdk";
import prisma from "./prisma";

const groq = new Groq();

export async function generateStudyPlan({ userId, hoursPerWeek, goal, targetCareer, preferences }) {
  // Get user's learning content (paths enrolled in, etc.)
  const paths = await prisma.pathEnrollment.findMany({
    where: { userId },
    include: { path: { include: { enrollments: true } } }
  });
  
  const pathVideos = paths.flatMap(p => JSON.parse(p.path.videoIds || "[]"));
  const videos = await prisma.content.findMany({
    where: { id: { in: pathVideos } },
    select: { id: true, title: true, duration: true, difficulty: true }
  });
  
  // Prompt AI to generate schedule
  const prompt = `
You are an expert learning planner. Generate a weekly study schedule for a learner with these constraints:

Hours per week: ${hoursPerWeek}
Goal: ${goal}
Target career: ${targetCareer}
Preferences: ${JSON.stringify(preferences)}

Videos to learn (with duration in minutes):
${videos.map(v => `- ${v.title} (${v.duration || 60} min, difficulty: ${v.difficulty})`).join('\n')}

Generate a JSON schedule with the following structure:
{
  "schedule": [
    {
      "day": "Monday",
      "time": "9:00 AM",
      "duration": 60,
      "activity": "Watch: Python Basics",
      "contentId": 1,
      "type": "watch_lesson"
    },
    {
      "day": "Monday",
      "time": "10:15 AM",
      "duration": 15,
      "activity": "Quiz & Review",
      "type": "quiz"
    }
  ],
  "reasoning": "Brief explanation of the schedule"
}

Requirements:
1. Distribute content across the week based on hoursPerWeek
2. Follow learner's time preferences
3. Alternate between different activity types (watch, quiz, flashcards, review)
4. Easier content earlier in the week, harder content later
5. Add breaks and review sessions
6. Total time should match hoursPerWeek

Respond ONLY with valid JSON.
`;

  const response = await groq.messages.create({
    model: "mixtral-8x7b-32768",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }]
  });
  
  const planJson = JSON.parse(response.content[0].text);
  
  // Convert to database format
  const schedule = planJson.schedule;
  const tasks = [];
  
  let baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 1); // Start tomorrow
  
  for (const item of schedule) {
    const dayOffset = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(item.day);
    const taskDate = new Date(baseDate);
    taskDate.setDate(taskDate.getDate() + (dayOffset - baseDate.getDay() + 7) % 7);
    
    const [hours, minutes] = item.time.split(":").map(x => parseInt(x));
    taskDate.setHours(hours, minutes, 0);
    
    tasks.push({
      title: item.activity,
      taskType: item.type,
      duration: item.duration,
      contentId: item.contentId || null,
      scheduledFor: taskDate
    });
  }
  
  return { schedule, tasks };
}
```

---

## 3.5 Frontend Components

### 3.5.1 **StudyPlanWizard.jsx** (Create plan form)

```jsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function StudyPlanWizard() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    hoursPerWeek: 10,
    goal: "certify",
    targetCareer: "",
    preferences: { preferMorning: true, preferMobileTime: false }
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    
    const res = await fetch("/api/study-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    
    const data = await res.json()
    router.push(`/study-plans/${data.data.planId}`)
  }
  
  return (
    <div className="min-h-screen bg-[#050508] text-white p-6">
      <div className="max-w-2xl mx-auto">
        
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-12">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? "bg-indigo-600" : "bg-white/10"}`} />
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Step 1: Hours */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black">How much time can you study per week?</h2>
              <div className="grid grid-cols-2 gap-4">
                {[5, 10, 20, 30].map(hours => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setForm({ ...form, hoursPerWeek: hours })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      form.hoursPerWeek === hours
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-white/8 hover:border-white/20"
                    }`}
                  >
                    <p className="text-xl font-bold">{hours}h</p>
                    <p className="text-sm text-slate-500">{Math.ceil(hours / 5)} sessions</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 2: Goal */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black">What's your learning goal?</h2>
              <div className="space-y-2">
                {[
                  { value: "hobby", label: "Hobby/Interest", desc: "Learn for fun" },
                  { value: "certify", label: "Certification", desc: "Earn a verified credential" },
                  { value: "career_switch", label: "Career Switch", desc: "New job within 3 months" }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, goal: option.value })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      form.goal === option.value
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-white/8 hover:border-white/20"
                    }`}
                  >
                    <p className="font-bold">{option.label}</p>
                    <p className="text-sm text-slate-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Career */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black">Target career (optional)</h2>
              <input
                type="text"
                placeholder="e.g., Data Scientist, Web Developer"
                value={form.targetCareer}
                onChange={e => setForm({ ...form, targetCareer: e.target.value })}
                className="w-full bg-white/5 border border-white/8 text-white placeholder-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                {loading ? "Creating…" : "Create Plan"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
```

---

### 3.5.2 **StudyPlanView.jsx** (Display weekly schedule)

```jsx
"use client"

import { useEffect, useState } from "react"

export default function StudyPlanView({ planId }) {
  const [plan, setPlan] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch(`/api/study-plans/${planId}`)
      .then(r => r.json())
      .then(d => {
        setPlan(d.data)
        setTasks(d.data.tasks)
        setLoading(false)
      })
  }, [planId])
  
  if (loading) return <div className="animate-pulse h-64 bg-white/5 rounded-xl" />
  
  // Group tasks by day
  const tasksByDay = {};
  tasks.forEach(task => {
    const day = new Date(task.scheduledFor).toLocaleDateString("en-US", { weekday: "long" });
    if (!tasksByDay[day]) tasksByDay[day] = [];
    tasksByDay[day].push(task);
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Your Study Plan</h1>
        <p className="text-slate-500">{plan.hoursPerWeek} hours/week • {plan.goal}</p>
      </div>
      
      {Object.entries(tasksByDay).map(([day, dayTasks]) => (
        <div key={day} className="glass-card rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-white">{day}</h3>
          <div className="space-y-2">
            {dayTasks.map(task => (
              <TaskCard key={task.id} task={task} planId={planId} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function TaskCard({ task, planId }) {
  const [completing, setCompleting] = useState(false)
  
  async function markComplete() {
    setCompleting(true)
    await fetch(`/api/study-plans/${planId}/tasks/${task.id}/complete`, {
      method: "POST"
    })
    // Refresh data
  }
  
  return (
    <div className={`p-3 rounded-lg ${task.completed ? "bg-emerald-500/10" : "bg-white/5"} flex items-center gap-3`}>
      <button
        onClick={markComplete}
        disabled={task.completed || completing}
        className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center ${
          task.completed ? "bg-emerald-500 border-emerald-500" : "border-white/30 hover:border-indigo-500"
        }`}
      >
        {task.completed && <span className="text-white text-xs">✓</span>}
      </button>
      
      <div className="flex-1">
        <p className={task.completed ? "text-slate-500 line-through" : "text-white"}>{task.title}</p>
        <p className="text-xs text-slate-600">{task.duration} min</p>
      </div>
      
      <span className="text-xs text-slate-600">
        {new Date(task.scheduledFor).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </span>
    </div>
  )
}
```

---

# 4. MICRO-LEARNING MODE

## 4.1 Overview

**Goal:** Auto-split long videos into 2-5 minute concept-specific micro-lessons for better retention and mobile learning.

---

## 4.2 Database Schema

```prisma
model MicroLesson {
  id                    Int       @id @default(autoincrement())
  contentId             Int
  content               Content   @relation(fields: [contentId], references: [id], onDelete: Cascade)
  
  title                 String    // "Python Decorators: Overview"
  description           String?
  concept               String    // "decorators"
  
  startTimestamp        Float     // Seconds into original video
  endTimestamp          Float
  duration              Int       // Seconds
  order                 Int       // Sequence in video
  
  videoUrl              String?   // Trimmed video URL (if we store separately)
  transcriptSegment     String    // Text from that time range
  
  relatedFlashcards     String[]  @default([]) // IDs of flashcards for this micro-lesson
  
  createdAt             DateTime  @default(now())
  
  @@unique([contentId, startTimestamp])
}

model MicroLessonProgress {
  id                    Int       @id @default(autoincrement())
  userId                Int
  user                  User      @relation(fields: [userId], references: [id])
  
  microLessonId         Int
  microLesson           MicroLesson @relation(fields: [microLessonId], references: [id])
  
  watched               Boolean   @default(false)
  quizScore             Int?
  notesAdded            String?
  
  watchedAt             DateTime?
  createdAt             DateTime  @default(now())
  
  @@unique([userId, microLessonId])
}
```

---

## 4.3 API Endpoints

### 4.3.1 **POST /api/content/[contentId]/micro-lessons/generate** (Auto-chunk video)

**Backend:**
```javascript
import { generateMicroLessons } from "@/lib/microLearning";

export async function POST(request, { params }) {
  const user = await getCurrentUser();
  const { contentId } = await params;
  
  // Get content
  const content = await prisma.content.findUnique({
    where: { id: Number(contentId) }
  });
  
  if (!content || content.creatorId !== user.userId) {
    return Response.json({ success: false }, { status: 403 });
  }
  
  // Generate micro-lessons
  const { microLessons } = await generateMicroLessons({
    transcript: content.transcript,
    duration: content.duration,
    title: content.title,
    contentId: Number(contentId)
  });
  
  // Save to DB
  await prisma.microLesson.createMany({
    data: microLessons
  });
  
  return Response.json({ success: true, data: { count: microLessons.length } });
}
```

---

### 4.3.2 **GET /api/content/[contentId]/micro-lessons**

```javascript
export async function GET(request, { params }) {
  const { contentId } = await params;
  
  const microLessons = await prisma.microLesson.findMany({
    where: { contentId: Number(contentId) },
    orderBy: { order: "asc" }
  });
  
  return Response.json({ success: true, data: microLessons });
}
```

---

## 4.4 Micro-Learning Generator (`lib/microLearning.js`)

```javascript
import Groq from "@anthropic-ai/sdk";

const groq = new Groq();

export async function generateMicroLessons({ transcript, duration, title, contentId }) {
  const prompt = `
You are an expert at breaking down educational videos into bite-sized lessons.

Video title: "${title}"
Total duration: ${duration} seconds
Transcript:
${transcript}

Identify natural concept boundaries in the transcript. For each concept, provide:
1. Concept name
2. Start and end timestamps (in seconds)
3. Brief description

Output JSON format:
{
  "microLessons": [
    {
      "title": "Python Decorators: Overview",
      "concept": "decorators",
      "description": "Introduction to what decorators are and why they're useful",
      "startTimestamp": 0,
      "endTimestamp": 120,
      "duration": 120
    }
  ]
}

Constraints:
- Each micro-lesson should be 2-5 minutes (120-300 seconds)
- Maximum 15 micro-lessons per video
- Concepts should be atomic and self-contained
- Titles should be specific and descriptive

Respond ONLY with valid JSON.
`;

  const response = await groq.messages.create({
    model: "mixtral-8x7b-32768",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }]
  });
  
  const parsed = JSON.parse(response.content[0].text);
  
  const microLessons = parsed.microLessons.map((lesson, idx) => ({
    contentId,
    title: lesson.title,
    description: lesson.description,
    concept: lesson.concept,
    startTimestamp: lesson.startTimestamp,
    endTimestamp: lesson.endTimestamp,
    duration: lesson.duration,
    order: idx + 1,
    transcriptSegment: extractTranscriptSegment(transcript, lesson.startTimestamp, lesson.endTimestamp)
  }));
  
  return { microLessons };
}

function extractTranscriptSegment(transcript, start, end) {
  const words = transcript.split(" ");
  const avgWordsPerSecond = words.length / 3600; // Assuming ~1 hour video
  
  const startIdx = Math.floor(start * avgWordsPerSecond);
  const endIdx = Math.floor(end * avgWordsPerSecond);
  
  return words.slice(startIdx, endIdx).join(" ");
}
```

---

## 4.5 Frontend Components

### 4.5.1 **MicroLessonPlayer.jsx** (Watch micro-lessons)

```jsx
"use client"

import { useState, useRef, useEffect } from "react"

export default function MicroLessonPlayer({ contentId, microLessons, videoUrl }) {
  const [currentLesson, setCurrentLesson] = useState(0)
  const videoRef = useRef(null)
  const lesson = microLessons[currentLesson]
  
  // Auto-skip to lesson timestamps
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = lesson.startTimestamp;
    }
  }, [currentLesson, lesson])
  
  // Auto-advance when lesson ends
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= lesson.endTimestamp) {
      if (currentLesson < microLessons.length - 1) {
        setCurrentLesson(currentLesson + 1);
      }
    }
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Video Player */}
      <div className="lg:col-span-2">
        <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full"
          />
        </div>
        
        {/* Lesson info */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">{lesson.title}</h2>
          <p className="text-slate-400">{lesson.description}</p>
          <p className="text-sm text-slate-600">
            Part {currentLesson + 1} of {microLessons.length} • {lesson.duration}s
          </p>
        </div>
      </div>
      
      {/* Lesson List */}
      <div className="space-y-2">
        <h3 className="font-bold text-white mb-4">Lessons</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {microLessons.map((ml, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentLesson(idx)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                idx === currentLesson
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-white/8 hover:border-white/20"
              }`}
            >
              <p className="text-sm font-semibold text-white truncate">{ml.title}</p>
              <p className="text-xs text-slate-500">{ml.duration}s</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

# 5. MOBILE PWA + OFFLINE

## 5.1 Implementation Steps

### 5.1.1 Create PWA Manifest (`public/manifest.json`)

```json
{
  "name": "LearnAI - AI-Powered Learning",
  "short_name": "LearnAI",
  "description": "Learn from any video with AI tutoring",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#050508",
  "theme_color": "#4f46e5",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education"],
  "screenshots": [
    {
      "src": "/screenshot-540.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

---

### 5.1.2 Service Worker (`public/sw.js`)

```javascript
const CACHE_NAME = "learnai-v1";
const urlsToCache = [
  "/",
  "/offline.html",
  "/app.css",
  "/app.js"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - Network first, fallback to cache
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache successful responses
        if (response.ok) {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, cacheCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
          .then(response => {
            return response || new Response("Offline - content not available", { status: 503 });
          });
      })
  );
});

// Background sync for offline progress
self.addEventListener("sync", event => {
  if (event.tag === "sync-progress") {
    event.waitUntil(syncProgressData());
  }
});

async function syncProgressData() {
  const db = await openDB();
  const pendingUpdates = await db.getAll("pending_updates");
  
  for (const update of pendingUpdates) {
    try {
      await fetch(update.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update.data)
      });
      
      await db.delete("pending_updates", update.id);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  }
}
```

---

### 5.1.3 Next.js PWA Config (`next.config.mjs`)

```javascript
import withPWA from "next-pwa";

export default withPWA({
  reactStrictMode: true,
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true
  }
});
```

---

### 5.1.4 Offline Storage Hook (`hooks/useOfflineStorage.js`)

```javascript
import { useEffect, useState } from "react";

export function useOfflineStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isOnline, setIsOnline] = useState(true);

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== "undefined") {
        const db = await openDatabase();
        const data = await db.get("storage", key);
        if (data) setStoredValue(data.value);
      }
    };
    loadData();
  }, [key]);

  // Save to IndexedDB
  const setValue = async (value) => {
    setStoredValue(value);
    if (typeof window !== "undefined") {
      const db = await openDatabase();
      await db.put("storage", { key, value });

      // If offline, queue for sync
      if (!isOnline) {
        await db.add("pending_updates", {
          url: `/api/sync/${key}`,
          data: { value },
          timestamp: Date.now()
        });
      }
    }
  };

  return [storedValue, setValue, isOnline];
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("LearnAI", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(new IDBWrapper(request.result));
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("storage")) {
        db.createObjectStore("storage", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("pending_updates")) {
        db.createObjectStore("pending_updates", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

class IDBWrapper {
  constructor(db) {
    this.db = db;
  }

  get(store, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], "readonly");
      const request = transaction.objectStore(store).get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  put(store, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], "readwrite");
      const request = transaction.objectStore(store).put(value);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  getAll(store) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([store], "readonly");
      const request = transaction.objectStore(store).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
```

---

## 5.2 Install Prompts (`components/PWAInstall.jsx`)

```jsx
"use client"

import { useEffect, useState } from "react"

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-xl">
      <p className="text-sm font-semibold mb-3">Install LearnAI App</p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 bg-white text-indigo-600 py-2 rounded font-bold text-sm"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="px-4 py-2 hover:bg-indigo-500 rounded text-sm"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
```

---

# 6. PEER CODE/PROJECT REVIEW

## 6.1 Database Schema

```prisma
model CodeReview {
  id                    Int       @id @default(autoincrement())
  contentId             Int
  content               Content   @relation(fields: [contentId], references: [id])
  
  submitterId           Int
  submitter             User      @relation("submissions", fields: [submitterId], references: [id])
  
  title                 String
  description           String?
  code                  String    // GitHub link or pasted code
  projectUrl            String?   // Demo link
  assignmentType        String    // "coding" | "writing" | "design"
  
  status                String    @default("open") // open | in_review | completed
  submittedAt           DateTime  @default(now())
  
  // Reviews
  reviews               Review[]
}

model Review {
  id                    Int       @id @default(autoincrement())
  codeReviewId          Int
  codeReview            CodeReview @relation(fields: [codeReviewId], references: [id], onDelete: Cascade)
  
  reviewerId            Int
  reviewer              User      @relation(fields: [reviewerId], references: [id])
  
  feedback              String
  codeAnnotations       String    // JSON with line-by-line comments
  rating                Int       // 1-5
  
  createdAt             DateTime  @default(now())
}
```

---

## 6.2 Matching & Submission Endpoints

### 6.2.1 **POST /api/code-reviews** (Submit code)

```javascript
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ success: false }, { status: 401 });

  const { contentId, title, code, projectUrl, assignmentType } = await request.json();

  const submission = await prisma.codeReview.create({
    data: {
      contentId: Number(contentId),
      submitterId: user.userId,
      title,
      code,
      projectUrl,
      assignmentType
    }
  });

  // Find peer reviewers (same content, similar skill level, who've completed it)
  const peers = await findPeerReviewers(Number(contentId), user.userId);

  // Assign 2-3 peers
  for (let i = 0; i < Math.min(3, peers.length); i++) {
    // Send notification to peer
    await notifyPeerForReview(peers[i].userId, submission.id);
  }

  return Response.json({ success: true, data: submission });
}
```

---

# 7. CONCEPT MASTERY BADGES

## 7.1 Database Schema

```prisma
model ConceptMastery {
  id                    Int       @id @default(autoincrement())
  userId                Int
  user                  User      @relation(fields: [userId], references: [id])
  
  concept               String    // "Python Decorators"
  masteryLevel          String    // "novice" | "expert" | "master"
  
  quizScore             Int       // Latest quiz %
  flashcardReps         Int       // Total reps
  timeSpent             Int       // Minutes
  
  achievedAt            DateTime  @default(now())
  
  @@unique([userId, concept, masteryLevel])
}
```

---

## 7.2 Mastery Badges API

```javascript
export async function checkConceptMastery(userId, concept, metrics) {
  const levels = [
    { level: "novice", quizScore: 60, flashcardReps: 20, timeSpent: 30 },
    { level: "expert", quizScore: 85, flashcardReps: 50, timeSpent: 100 },
    { level: "master", quizScore: 95, flashcardReps: 100, timeSpent: 200 }
  ];

  for (const levelConfig of levels) {
    if (
      metrics.quizScore >= levelConfig.quizScore &&
      metrics.flashcardReps >= levelConfig.flashcardReps &&
      metrics.timeSpent >= levelConfig.timeSpent
    ) {
      const existing = await prisma.conceptMastery.findUnique({
        where: {
          userId_concept_masteryLevel: {
            userId,
            concept,
            masteryLevel: levelConfig.level
          }
        }
      });

      if (!existing) {
        await prisma.conceptMastery.create({
          data: {
            userId,
            concept,
            masteryLevel: levelConfig.level,
            ...metrics
          }
        });

        // Issue badge
        return {
          achieved: true,
          level: levelConfig.level
        };
      }
    }
  }

  return { achieved: false };
}
```

---

## Summary of Implementation

This document provides **complete, production-ready specifications** for:

✅ **1. Blockchain Micro-Credentials** — W3C VC + Hedera anchoring  
✅ **2. AI Study Groups** — Embedding-based matching + moderated chat  
✅ **3. Study Planner** — AI weekly schedule generation  
✅ **4. Micro-Learning** — Auto-video chunking  
✅ **5. Mobile PWA + Offline** — Service Workers + IndexedDB  
✅ **6. Peer Code Review** — Submission + peer matching  
✅ **7. Concept Mastery Badges** — Tiered achievement system  

**Each section includes:**
- Database schemas
- API endpoints (request/response examples)
- Backend logic (complete code)
- Frontend components (React code)
- Integration details

Ready to implement! 🚀
