# StreamAI — Folder Structure

## Root Level
```
netflix-clone/                    # project root
├── prisma/
│   ├── schema.prisma             # database models
│   ├── prisma.config.ts          # Prisma 7 config (datasource URL goes here)
│   ├── seed.js                   # database seeder
│   └── migrations/               # SQL migration history
├── src/
│   ├── app/                      # Next.js App Router pages + API routes
│   ├── components/               # Reusable React components
│   ├── context/                  # React Context providers
│   ├── hooks/                    # Custom React hooks
│   └── lib/                      # Shared utilities and helpers
├── public/                       # Static assets
├── .env                          # Environment variables (never commit)
├── next.config.mjs               # Next.js configuration
├── postcss.config.mjs            # PostCSS (Tailwind v4)
└── package.json
```

## src/app/ — Pages and API Routes
```
src/app/
├── proxy.js                      # Route protection (replaces middleware.js in Next.js 16)
├── layout.js                     # Root layout with WatchlistProvider + Toaster
├── page.js                       # Landing page (/)
├── not-found.js                  # 404 page
├── globals.css                   # Global styles + Tailwind v4 @theme config
│
├── browse/
│   ├── page.js                   # Main Netflix-style browse page (Server Component)
│   ├── loading.js                # Skeleton loading state (auto-shown by Next.js)
│   └── error.js                  # Error boundary (auto-shown by Next.js)
│
├── login/
│   └── page.js                   # Login page (Client Component)
│
├── register/
│   └── page.js                   # Register page wrapper (Server Component)
│
├── search/
│   └── page.js                   # Search page wrapper
│
├── subscribe/
│   ├── page.js                   # Pricing/plans page
│   └── success/
│       └── page.js               # Post-payment success page
│
├── watch/
│   └── [id]/
│       └── page.js               # Video watch page (Server Component)
│
├── creator/
│   ├── upload/
│   │   └── page.js               # Video upload page
│   ├── dashboard/
│   │   └── page.js               # Creator analytics dashboard
│   └── studio/                   # AI generation studio (coming soon)
│       └── page.js
│
└── api/                          # All API routes
    ├── auth/
    │   ├── login/route.js        # POST: email/password login
    │   ├── register/route.js     # POST: create account
    │   ├── logout/route.js       # POST: clear cookie
    │   ├── me/route.js           # GET: current user info
    │   └── google/
    │       ├── route.js          # GET: redirect to Google OAuth
    │       └── callback/
    │           └── route.js      # GET: handle Google OAuth callback
    │
    ├── movies/
    │   ├── route.js              # GET: all movies from DB
    │   └── [id]/
    │       └── route.js          # GET: single movie by ID
    │
    ├── content/
    │   ├── route.js              # GET: all content | POST: create content
    │   └── [id]/
    │       ├── process/
    │       │   └── route.js      # POST: trigger AI processing
    │       └── quiz/
    │           ├── route.js      # GET: fetch quiz | POST: generate quiz
    │           └── attempt/
    │               └── route.js  # POST: submit quiz answers
    │
    ├── upload/
    │   └── presigned/
    │       └── route.js          # POST: get S3 presigned URL
    │
    ├── watchlist/
    │   └── route.js              # GET/POST/DELETE: manage watchlist
    │
    ├── progress/
    │   └── route.js              # GET/POST: watch progress tracking
    │
    ├── search/
    │   └── route.js              # GET: full-text search
    │
    ├── chat/
    │   └── route.js              # POST: AI chat with transcript context (streaming)
    │
    ├── ai/
    │   ├── explain/
    │   │   ├── route.js          # POST: generate visual explanation (NEW)
    │   │   └── feedback/
    │   │       └── route.js      # POST: track if explanation helped (NEW)
    │   ├── script/
    │   │   └── route.js          # POST: AI script writer
    │   ├── thumbnail/
    │   │   └── route.js          # POST: AI thumbnail generator
    │   └── outline/
    │       └── route.js          # POST: AI course outline generator
    │
    ├── credits/
    │   └── route.js              # GET: user credit balance
    │
    └── stripe/
        ├── checkout/route.js     # POST: create subscription checkout
        ├── webhook/route.js      # POST: handle Stripe events
        ├── portal/route.js       # POST: create customer portal session
        └── credits/route.js      # POST: create credits purchase checkout
```

## src/components/ — React Components
```
src/components/
├── Navbar.jsx                    # Fixed top nav (Client — needs onClick)
├── HeroBanner.jsx                # Video hero section (Server — just displays)
├── MovieRow.jsx                  # Horizontal scrolling movie row (Server)
├── MovieCard.jsx                 # Individual movie card with hover (Client)
├── WatchlistRow.jsx              # User's saved movies row (Client — needs remove)
├── WatchlistCard.jsx             # Individual watchlist card (Client)
├── EmailForm.jsx                 # Landing page email input (Client)
├── VideoUpload.jsx               # Multi-step video upload (Client)
├── VideoChapters.jsx             # Chapter navigation (Client — needs videoRef)
├── WatchPageClient.jsx           # Watch page wrapper (Client — has videoRef)
├── AIChatSidebar.jsx             # AI chat panel (Client — uses useChat v6)
├── PricingPlans.jsx              # Stripe pricing cards (Client)
├── SkeletonCard.jsx              # Loading skeletons (Server)
├── RegisterForm.jsx              # Registration form (Client)
├── QuizSection.jsx               # Quiz UI (Client)
├── SearchPageClient.jsx          # Search with debounce (Client)
├── ScriptGenerator.jsx           # AI script writer UI (Client)
├── ThumbnailGenerator.jsx        # AI thumbnail UI (Client)
├── CourseOutlineGenerator.jsx    # AI outline UI (Client)
├── CreditsWidget.jsx             # Credits balance display (Client)
│
└── visual/                       # Visual explanation components (NEW)
    ├── VisualExplainer.jsx       # Router component — picks right explainer
    ├── DiagramExplainer.jsx      # Animated SVG diagram renderer
    ├── AnalogyExplainer.jsx      # Story-based analogy display
    └── WalkthroughExplainer.jsx  # Step-by-step interactive walkthrough
```

## src/lib/ — Utilities
```
src/lib/
├── prisma.js                     # Prisma client singleton (Prisma 7 + PrismaPg)
├── auth.js                       # getCurrentUser() — reads JWT from cookie
├── openai.js                     # AI client (Groq + OpenAI) + helper functions
├── s3.js                         # AWS S3 presigned URLs + file operations
├── stripe.js                     # Stripe client instance
├── plans.js                      # Subscription plan definitions
├── rateLimit.js                  # Upstash Redis rate limiters
├── schemas.js                    # Zod validation schemas
├── email.js                      # Resend email sender
├── audit.js                      # Audit logging helper
├── accountLock.js                # Account lockout via Redis
└── tmdb.js                       # TMDB API helpers
```

## src/context/
```
src/context/
└── WatchlistContext.js           # Global watchlist state (React Context)
```

## src/hooks/
```
src/hooks/
└── useVideoProgress.js           # Save/restore video position
```
