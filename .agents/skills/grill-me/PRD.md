# LearnAI Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** April 28, 2026  
**Author:** Hemang P  
**Status:** Active Development

---

## Executive Summary

**LearnAI** is an AI-powered video learning platform that solves the biggest pain point in online education: **instant, on-demand visual explanations when learners get confused**. 

Unlike Udemy (outdated content, no help), Coursera (expensive, rigid structure), and YouTube (no engagement structure), LearnAI lets users learn from **any video at their own pace** while an AI assistant provides real-time, animated explanations tailored to their confusion point.

### Market Opportunity
- **Market Size:** $95.82B in 2026, projected to reach $373.33B by 2034 (18.5% CAGR)
- **Target Problem:** 65% of learners abandon online courses due to low engagement and lack of adaptive support
- **Differentiation:** Only platform generating real-time visual explanations on-demand for confusion moments

---

## Problem Statement

### Current Market Gaps

#### 1. **Passive Learning → Low Completion**
- YouTube: Free, vast, but 90%+ abandonment rate. No structure, deadlines, or engagement hooks.
- Udemy: 250K+ courses but 80% completion failure. Content quality varies wildly; courses often outdated (last updated 2018-2020).
- Coursera: Structured & credible but expensive ($30-50/month), rigid timelines, limited course variety.
- **Gap:** No platform combines structure + affordability + personalization.

#### 2. **One-Size-Fits-All Content**
- All competitors deliver the same video to every learner.
- When a learner re-watches a segment (behavior signal of confusion), they see the same explanation again.
- No adaptation to learning style, speed, or confusion point.
- **Gap:** No real-time adaptive help when learners struggle.

#### 3. **No Visual Explanations for Confusion**
- Learners pause videos to Google "how does photosynthesis work?" or "what's a derivative?"
- They watch 3-5 external videos, jump to Reddit, still confused.
- Original video creator has no idea where learners struggled.
- **Gap:** No platform generates on-demand, concept-specific visual explanations tied to the exact video moment.

#### 4. **Source Limitation**
- Coursera/Udemy: Creators upload polished courses (high barrier, slow iteration).
- YouTube: Massive library but no structured learning experience.
- **Gap:** Can't learn from domain-specific content (internal company training, niche topics, new discoveries).

#### 5. **Knowledge Retention Crisis**
- Text-based learning retains only 10% after 1 week (without reinforcement).
- Passive video watching retains only 5%.
- Interactive with visuals: 65% retention gain.
- **Gap:** Platforms have quizzes but lack adaptive spaced repetition + visual reinforcement.

#### 6. **Community Without Friction**
- Forums are often toxic, moderated poorly, slow to respond.
- Synchronous live sessions don't scale or accommodate different timezones.
- **Gap:** No asynchronous, AI-moderated, meaningful peer discussion tied to learning moments.

#### 7. **Creator Isolation**
- Creators can't see *where* learners struggle, *why* they pause, *what* confuses them.
- Analytics are shallow (watch time, completion %).
- **Gap:** No real-time learning insights for course improvement.

---

## Solution Overview

### Core Value Proposition
**"Learn anything, at your own pace, with an AI that explains what confuses you—visually, instantly."**

LearnAI is a **unified learning platform** where:
1. Users paste **any video link** (YouTube, Vimeo, internal training, etc.)
2. AI **auto-processes** the video: chapters, transcript, summary, quiz
3. As users **watch and struggle**, AI detects confusion (rewind, slowdown, pause)
4. Users get **instant, animated visual explanations** for that concept
5. Learners **build paths** (curated sequences) and **earn certificates**
6. Creators get **rich analytics** on where learners struggle

### Unique Differentiators

| Aspect | Udemy | Coursera | YouTube | **LearnAI** |
|--------|-------|----------|---------|------------|
| **Any Video Source** | ✗ | ✗ | ✓ | ✓✓ (structured) |
| **Real-Time Visual Help** | ✗ | ✗ | ✗ | **✓✓** |
| **Adaptive Pacing** | ✗ | ✗ | ✗ | ✓ |
| **Community** | ✗ | Limited | Toxic | ✓ (moderated) |
| **Affordability** | Varies | $$$$ | Free | $ (freemium) |
| **Spaced Repetition** | Flashcards | Limited | ✗ | ✓ (SM-2) |
| **Creator Insights** | Basic | Aggregate only | YouTube Stats | **✓✓** (real-time confusion mapping) |
| **Gamification** | ✗ | ✗ | ✗ | ✓ (leaderboard, paths) |

---

## Target Users

### Primary (MVP Launch)
1. **Self-Directed Learners (25-35 age group)**
   - Professionals upskilling for career change
   - Hobbyists learning new crafts, languages, coding
   - Problem: Can't afford Coursera, don't trust Udemy quality, YouTube is too chaotic
   - Value prop: Learn from YouTube, structured like Coursera, cost of free

2. **Corporate Trainers**
   - Need to onboard employees with existing video/documentation
   - Want to see where training breaks down
   - Value prop: Upload training videos, AI creates interactive experience, get learner insights

### Secondary (Post-MVP)
3. **K-12 & Higher Ed Teachers**
   - Flipped classroom: students watch + get AI tutoring
   - Value prop: Supplement textbooks with video + adaptive explanations

4. **Content Creators (YouTube, TikTok)**
   - Want to monetize or deepen viewer engagement
   - Value prop: Convert viewers → learners → subscribers

---

## Feature Set

### Phase 1: Core MVP (Weeks 1-4)
**Goal:** Learn from any video with AI-generated structure + adaptive help

#### 1.1 Video Ingestion & Processing
- **Inputs:** YouTube URL, Vimeo URL, direct video upload
- **Auto-Processing:**
  - Extract transcript (Deepgram/Whisper API)
  - AI-generate chapters with timestamps (Groq API)
  - AI-generate summary (1-2 paragraphs)
  - Auto-generate quiz (5-10 questions)
  - Estimate difficulty (beginner/intermediate/advanced)
- **Outputs:** Fully processed video ready to learn from
- **Status:** 80% complete (APIs integrated, UI clean)

#### 1.2 Adaptive Watch Experience
- **Core:** Interactive video player with tabbed UI
  - **Overview Tab:** Title, creator, description, AI summary
  - **Notes Tab:** Timestamped notes (user + AI-generated)
  - **Concept Map Tab:** Visual mind-map of topics
  - **Comments Tab:** Threaded discussion (per-video, moderated)
  - **Quiz Tab:** Adaptive quiz with scoring
  - **Flashcards Tab:** Spaced repetition deck (SM-2 algorithm)
  - **Debate Tab:** AI challenges learner arguments

- **Confusion Detection (Realtime):**
  - Rewind >5 seconds = signal of confusion on that concept
  - Playback speed <0.75x = signal of difficulty
  - Long pause (>30 sec) = likely stuck
  - **Action:** Prefill AI chat with confusion context, offer visual explanation

- **Visual Explanation Generation:**
  - User selects confusing concept or AI detects struggle
  - System prompts: "What specifically are you stuck on?"
  - AI generates 3 output types:
    1. **Animated SVG Diagram** (circuits, molecular structures, algorithms)
    2. **Story/Analogy** (explain blockchain like a chain of boxes, derivatives like speed)
    3. **Step-by-Step Walkthrough** (interactive clickable steps)
  - All tie back to the exact video timestamp & concept

**Status:** 60% complete (components built, API routes need polish)

#### 1.3 Learning Paths (Structured Sequences)
- **Creator-Curated Paths:** Group videos into curricula
  - Example: "Python for Beginners" = [Intro, Variables, Functions, Classes, Projects]
  - Dripfeed content (unlock Day 1, Day 3, Week 2)
  - Progress tracking (visual bar)
  - Completion certificates (beautiful, shareable)

- **Learner Paths:** Free to enroll, track progress, earn certificates

**Status:** 85% complete (all APIs & UI done, needs testing)

#### 1.4 AI Chat Copilot
- **Input:** Learner confusion context (video title, timestamp, transcript segment)
- **Behavior:**
  - Answer questions about the concept
  - Relate to learner's prior knowledge
  - Generate follow-up resources
  - Offer visual explanations (diagram, analogy, walkthrough)
- **Status:** 90% complete

**Status:** Phase 1: **80% Complete** → Ready for beta testing

---

### Phase 2: Engagement & Retention (Weeks 5-8)
**Goal:** Keep learners coming back with gamification + adaptive sequencing

#### 2.1 Leaderboard & Gamification
- **Scoring Formula:**
  - Quiz avg score: **50%**
  - Total watch minutes: **30%**
  - Flashcard reps (practice streak): **20%**
- **Rewards:**
  - Top 3 badges (🥇🥈🥉)
  - Milestone achievements ("Quiz Master," "10-hour learner," "Debate Champion")
  - Unlock perks at thresholds (exclusive content, early access)

**Status:** 90% complete (API aggregates data, leaderboard page rendering)

#### 2.2 Adaptive Learning Recommendations
- **Data Collected:**
  - Confusion signals per concept/timestamp
  - Quiz performance per topic
  - Time spent per concept
- **Personalization:**
  - Recommend videos by learner's weak concepts
  - Suggest harder paths if learner excels
  - Reorder quiz questions by learner's knowledge gaps
- **Status:** 30% (design phase, needs ML model)

#### 2.3 Spaced Repetition (Flashcards)
- **Algorithm:** SM-2 scheduling
- **Integration:** Auto-generated flashcards from video concepts
- **Status:** 95% complete (UI + algorithm done)

**Status:** Phase 2: **65% Complete** → Needs ML model for recommendations

---

### Phase 3: Creator Analytics & Monetization (Weeks 9-12)
**Goal:** Help creators improve content + generate revenue

#### 3.1 Creator Dashboard
- **Real-Time Analytics:**
  - Where learners pause most (confusion heatmap on timeline)
  - Which concepts get re-watched (struggle points)
  - Average comprehension score per segment
  - Learner feedback & notes mentioning problems
- **Actionable Insights:**
  - "36% of learners confused at 4:32 (polynomial expansion) → consider adding visual here"
  - "Dropout spike at 8:15 → pacing issue?"

**Status:** 40% (schema in place, dashboard skeleton exists)

#### 3.2 Creator Monetization
- **Freemium Model:**
  - Free: Unlock via 3 ads per video
  - Premium ($5-15/month): Ad-free, full access, analytics
  - **OR** Pay-per-video ($0.99-4.99)
- **Creator Revenue Share:** 70% of subscription revenue (proportional to watch time)

**Status:** 10% (Stripe integration exists, model not finalized)

#### 3.3 Path Collaboration
- **Features:**
  - Multiple creators co-build a path
  - Royalty split per creator contribution
- **Status:** 0% (backlog)

**Status:** Phase 3: **25% Complete** → Post-launch feature

---

### Phase 4: Enterprise & B2B (Post-Launch)
**Goal:** Custom learning experiences for companies

#### 4.1 White-Label Option
- Brand as company's own platform
- Custom domain, logo, colors
- Single-sign-on (SSO) integration

#### 4.2 Advanced Admin Tools
- Batch upload internal training videos
- Mandatory completion tracking
- Compliance reports (certifications, completions)
- Custom learning paths per department

#### 4.3 Integration APIs
- Embed learner progress into HR systems
- Zapier/Make integration for workflow automation

**Status:** 0% (post-launch, Phase 4+)

---

## Technical Architecture

### Frontend
- **Framework:** Next.js 16 (App Router, React 19)
- **Styling:** Tailwind CSS v4 (CSS-first configuration)
- **Video Player:** HTML5 `<video>` with custom controls
- **State Management:** React Context (WatchlistProvider, etc.)
- **Real-Time:** Vercel AI SDK v6 (streaming responses)

### Backend
- **Runtime:** Node.js (Next.js API Routes)
- **Database:** PostgreSQL 15 (Supabase)
- **ORM:** Prisma 7.5.0 with PrismaPg adapter
- **Auth:** Manual JWT (no NextAuth)
- **Rate Limiting:** Upstash Redis

### AI/LLM
- **Primary:** Groq API (fast, free tier, <50ms latency)
- **Fallback:** OpenAI GPT-4 (higher quality, ~$0.10 per request)
- **Vision:** Claude 3.5 Sonnet (for SVG diagram generation)
- **Video Processing:** Deepgram (transcription), Whisper (backup)

### External Services
- **Payments:** Stripe (subscriptions, one-time purchases)
- **Storage:** AWS S3 (`streamai-videos-hemang` bucket)
- **Email:** Resend (transactional emails)
- **Movie Data:** TMDB API (for browse recommendations)
- **Hosting:** Vercel (auto-deploy on push to `main`)

### Key Databases Tables
```
User
  ├─ Profile (name, avatar, bio)
  ├─ Subscription (stripe customer/subscription IDs)
  ├─ Content (videos created)
  ├─ Watchlist (saved videos)
  ├─ QuizAttempt (quiz history + scores)
  ├─ WatchProgress (resume positions + completion %)
  ├─ Note (timestamped notes + AI flag)
  ├─ Comment (threaded discussions)
  ├─ Flashcard (spaced repetition deck)
  ├─ LearningInsight (confusion tracking per concept)
  ├─ PathEnrollment (enrolled learning paths + progress)
  └─ Certificate (issued certificates)

Content
  ├─ Quiz (auto-generated questions)
  ├─ WatchProgress (per-user resume data)
  └─ Comment (threaded discussions)

LearningPath
  ├─ Creator (user who built it)
  ├─ PathEnrollment (enrolled learners + progress)
  └─ Certificate (issued certificates)
```

---

## Go-To-Market Strategy

### Phase 1: Beta Launch (Weeks 13-16)
**Target:** 1,000 beta testers from 3 user segments

1. **Self-Directed Learners**
   - Channels: ProductHunt, HackerNews, Reddit (/r/learnprogramming, /r/datascience)
   - Hook: "Learn from any YouTube video with AI tutoring—for free during beta"
   - Goal: 500 users, feedback on UX + AI quality

2. **Corporate Trainers**
   - Direct outreach to L&D teams on LinkedIn
   - Free pilot: "Turn your training videos into interactive courses"
   - Goal: 10-20 companies, case studies

3. **Content Creators**
   - Outreach to top YouTube educators (Paul McCartney, 3Blue1Brown, Andrej Karpathy adjacent)
   - API access: "Embed LearnAI in your own platform"
   - Goal: 2-3 pilot partners, integrations

### Phase 2: Free Launch (Week 17)
- **Landing Page:** learnai.io
- **Freemium Model:**
  - Free tier: 3 free videos/month, basic features, ads
  - Premium: $9.99/month (unlimited videos, no ads, advanced features)
- **Key Messaging:** "Your personal AI tutor for any video"

### Phase 3: Growth (Months 2-6)
- **Organic:** SEO for "learn [topic] YouTube" keywords, organic viral growth
- **Paid:** Google Ads, TikTok (education creator niches)
- **Partnerships:** Integrate with YouTube, integrate with Notion (study hub)
- **Goal:** 100K users by month 6

---

## Success Metrics

### Engagement
- **Course Completion:** >60% (vs. Udemy's 20%, YouTube's 5%)
- **Avg Session Length:** >30 minutes (vs. YouTube's 5 min average)
- **Return Rate:** 40% of learners return within 7 days
- **Concept Clarity Score:** Learners rate confusing concepts as "clear" after AI explanation 80%+ of the time

### Retention
- **Day 7 Retention:** >50%
- **Day 30 Retention:** >30%
- **Quiz Pass Rate:** 65%+ (learners earn certificates)

### Growth
- **Month 1-3:** 50K users
- **Month 3-6:** 150K users
- **Month 6-12:** 500K users
- **CAC (Cost to Acquire):** <$2 (organic-heavy growth)
- **LTV (Lifetime Value):** >$40 (premium conversion at 5% + premium price)

### Creator Metrics
- **Path Enrollments:** 10x growth month-over-month
- **Creator Revenue:** $100+ per 1,000 watch hours (sustainable for creators)

### AI Quality
- **Explanation Helpfulness:** >4.2/5 stars (user feedback)
- **Visual Diagram Quality:** <10% "not helpful" feedback
- **Explanation Latency:** <2 seconds (perceived instant)

---

## Competitive Landscape

### Direct Competitors
| Feature | Khan Academy | Byju's | DeepTutor | **LearnAI** |
|---------|--------------|--------|-----------|------------|
| **Any Video Source** | ✗ | ✗ | Limited (internal only) | ✓ |
| **Real-Time Visual Explainers** | ✗ | Limited (pre-made) | ✓ | **✓✓** (on-demand) |
| **Confusion Detection** | ✗ | ✗ | ✗ | **✓** |
| **Affordability** | Free (K-12 only) | $$$ | $$ | Freemium |
| **Leaderboard/Gamification** | ✗ | ✓ | Limited | ✓ |
| **Creator Monetization** | N/A | N/A | N/A | ✓ |

### Indirect Competitors
- **Udemy:** 250K courses, $15-50 per course, low completion, low quality control
- **Coursera:** Structured, credible, expensive ($30-50/mo), limited content
- **YouTube:** Vast free library, zero structure, 90% abandonment
- **Notion + Obsidian:** Note-taking tools, not learning platforms

### Competitive Moat
1. **Real-Time Visual Explanations:** Hard to replicate; requires tuned LLM + SVG generation + video understanding
2. **Confusion Detection:** Proprietary behavior data + ML models
3. **Any-Video Support:** Network effects (more learners → better community → more valuable platform)
4. **Creator Insights:** Only platform showing where learners struggle in real-time

---

## Financial Projections

### Revenue Model
1. **Freemium Subscriptions:**
   - Free: 3 videos/month, ads, basic features
   - Premium: $9.99/month → unlimited, no ads, advanced (pathways, analytics)
   - Pro (Creators): $29.99/month → full dashboard, learner insights

2. **Premium Conversion:** 5% of free users → $120/year per paying user
3. **Creator Revenue Share:** 70% of Premium revenue (for creators with enrolled learners)

### Year 1 Projections
- **Users:** 500K
- **Premium Conversion:** 25K paid (5%)
- **MRR:** $300K (25K × $12 avg)
- **ARR:** $3.6M
- **CAC:** ~$2 (organic growth)
- **LTV:** $50-100 per premium user
- **Gross Margin:** 70% (before infrastructure costs)

### Cost Structure
- **Cloud Infrastructure:** $50K/month (video processing, storage, compute)
- **AI API Costs:** $30K/month (LLM requests: Groq + OpenAI)
- **Team (MVP Stage):** 2-3 engineers, 1 PM → $150K/month
- **Marketing:** $50K/month (paid growth post-Month 6)

### Break-Even
- **Month 8-10:** Gross revenue > COGS
- **Month 16-18:** EBITDA positive (all costs)

---

## Risk & Mitigation

### Technical Risks
| Risk | Mitigation |
|------|-----------|
| **AI quality drops over time** | Continuous feedback loop, version testing, human QA on 5% of outputs |
| **Video processing fails (audio, no transcript)** | Fallback: manual captions, user-provided transcript, Whisper backup |
| **Latency issues (2+ sec wait)** | Pre-cache common explanations, async generation with notification |
| **Plagiarism detection in generated content** | Cross-check against public LLM outputs, user reporting |

### Market Risks
| Risk | Mitigation |
|------|-----------|
| **Low creator adoption** | B2B sales team, revenue share transparency, case studies |
| **YouTube clamps API (for transcript extraction)** | Partner with video platforms, offer native upload, own repository |
| **Competitors (Google, Coursera) copy feature** | Move fast, build community, expand to B2B early |
| **Learner acquisition slows** | Diversify channels (TikTok, Instagram, podcasts), creator partnerships |

### Regulatory Risks
| Risk | Mitigation |
|------|-----------|
| **Copyright on video use** | Display attribution, allow creators to opt-out, link to original |
| **GDPR/Privacy (learner data)** | Privacy-first design, transparent data use, easy deletion |
| **AI-generated content claims** | Label AI-generated explanations, transparency in ToS |

---

## Roadmap

### MVP → Launch (4 weeks)
- ✅ Video ingestion (YouTube URL + upload)
- ✅ Auto-processing (transcript, chapters, quiz)
- ✅ Interactive watch UI (tabs, notes, comments, etc.)
- ✅ Confusion detection + adaptive help
- ✅ Visual explanation generation (3 types)
- ✅ Flashcards (spaced repetition)
- ✅ Learning paths (creator + learner)
- ✅ Leaderboard + gamification
- ⚠️ Creator analytics (60% done, needs polish)

### Post-Launch: Month 1-3
- Refine AI explanation quality (based on user feedback)
- Add "Debate Mode" (AI argues back, sharpens critical thinking)
- Recommend videos by learner weakness (simple collaborative filtering)
- Creator monetization (Stripe subscriptions for creators)

### Post-Launch: Month 3-6
- Mobile app (iOS + Android)
- Accessibility features (captions, screen reader, keyboard nav)
- Integrations: Zapier, Make, LMS (Canvas, Blackboard)
- B2B sales team + white-label offering

### Post-Launch: Month 6-12
- Advanced ML: personalized learning sequencing
- Group learning (cohorts, peer review)
- Institution partnerships (universities, corporate)
- Creator communities, collaborations, revenue-share tiers

---

## Appendix: Market Research Sources

### Market Size & Growth
- [AI-Powered Personalized Learning Path Market Report 2026](https://www.researchandmarkets.com/reports/6225935/ai-powered-personalized-learning-path-market)
- [Best AI-Powered LMS and Learning Platform of 2026](https://www.disco.co/blog/top-rated-ai-powered-learning-platform)
- [The e-Learning market of 2025-2030: AI is redefining the codes of learning](https://www.didask.com/en/post/marche-e-learning)
- [5 Best AI Personalized Learning Apps in 2026 for Goal-Driven Professionals](https://www.sosoactive.com/5-best-ai-personalized-learning-apps-in-2026-for-goal-driven-professionals-tested/)

### Market Gaps & Learner Pain Points
- [Why Learning Platforms Fall Short and How to Upgrade Seamlessly in 2026](https://www.openlms.net/blog/insights/why-learning-platforms-fall-short-how-to-upgrade-seamlessly-in-2026/)
- [10 Elearning Challenges + Solutions [2026]](https://www.educate-me.co/blog/elearning-challenges)
- [Despite platform fatigue, educators use AI to bridge resource gaps](https://www.eschoolnews.com/digital-learning/2026/02/02/despite-platform-fatigue-educators-use-ai-to-bridge-resource-gaps/)
- [What Modern Learners Expect From Online Training in 2026](https://www.instructure.com/resources/blog/what-modern-learners-expect-online-training)

### Real-Time Visual Explanations
- [AI Video Generator for Educational Tutorials](https://lumalabs.ai/create/ai-video-generator-for-educational-tutorials)
- [ML Visualizer - Interactive AI & Machine Learning Demonstrations](https://mlvisualizer.org/)
- [AI in Education: Visualize Study Guides](https://reelmind.ai/blog/ai-in-education-visualize-study-guides)
- [New AI Tool Generates Video Explanations Based on Course Materials](https://campustechnology.com/Articles/2025/03/24/New-AI-Tool-Generates-Video-Explanations-Based-on-Course-Materials.aspx)
- [Vision Solve AI - AI-Powered Learning Platform](https://www.visionsolveai.me)

### Competitor Analysis
- [Top 11 Coursera Alternatives 2026](https://freshlearn.com/blog/coursera-alternatives/)
- [Coursera vs Udemy 2026: Ultimate Comparison & Review](https://brianvanderwaal.com/coursera-vs-udemy/)
- [Coursera vs Udemy vs YouTube: Which Is Worth It? (2026)](https://www.techcityng.com/coursera-vs-udemy-vs-youtube/)
- [15 Best Udemy Alternatives in 2026](https://www.group.app/blog/udemy-alternatives/)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-04-25 | H. Patel | Initial research & outline |
| 0.5 | 2026-04-26 | H. Patel | Market gaps + feature definition |
| 1.0 | 2026-04-28 | H. Patel | Final PRD with tech specs + roadmap |

---

**Next Steps:**
1. **Finalize MVP Feature List** — Lock scope for 4-week sprint
2. **Design Creator Analytics Dashboard** — Sketch UI for confusion heatmaps
3. **Plan Beta Program** — Recruit 1,000 testers across 3 segments
4. **Setup Go-To-Market** — ProductHunt, Reddit, LinkedIn outreach
5. **Establish Metrics Dashboard** — Track engagement, retention, quality metrics

---

**Contact:** hemangpatel0710@gmail.com
