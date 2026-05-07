# Study Planner Integration Guide

Quick steps to integrate the Study Planner into your existing LearnAI application.

## 📋 Quick Start (5 minutes)

### Step 1: Run Database Migration

```bash
npx prisma migrate dev --name add_study_plans
```

### Step 2: Verify Environment Variable

```bash
# In .env.local
GROQ_API_KEY=your_groq_api_key_here
```

### Step 3: Add Navigation Links

Update your Navbar to include Study Plans:

```jsx
// In src/components/Navbar.jsx
<nav className="flex gap-6">
  {/* Existing links */}
  <Link href="/learn/plans" className="text-white hover:text-indigo-400">
    📅 Study Plans
  </Link>
</nav>
```

### Step 4: Done! 🎉

Users can now:
- Visit `/learn/plan/create` to create a plan
- Visit `/learn/plans` to see all their plans
- View individual plans at `/learn/plan/[planId]`

## 📂 Files Created

### Database
- ✅ `prisma/schema.prisma` - Updated with StudyPlan, StudyTask, ScheduleAdjustment models
- ✅ `prisma/migrations/20260429_add_study_plans/migration.sql` - Migration file

### Backend
- ✅ `src/lib/planGenerator.js` - AI schedule generation logic
- ✅ `src/app/api/study-plans/route.js` - Create and list plans
- ✅ `src/app/api/study-plans/[planId]/route.js` - Get and update plans
- ✅ `src/app/api/study-plans/[planId]/tasks/[taskId]/complete/route.js` - Task completion

### Frontend Components
- ✅ `src/components/StudyPlanWizard.jsx` - Multi-step plan creation form
- ✅ `src/components/StudyPlanView.jsx` - Plan display and management

### Pages
- ✅ `src/app/learn/plan/create/page.js` - Plan creation page
- ✅ `src/app/learn/plan/[planId]/page.js` - Plan view page
- ✅ `src/app/learn/plans/page.js` - Plans listing page

### Documentation
- ✅ `STUDY_PLANNER_IMPLEMENTATION.md` - Full technical documentation
- ✅ `STUDY_PLANNER_INTEGRATION.md` - This file

## 🔗 Integration Points

### 1. From Dashboard
Add a quick action to create a plan:

```jsx
<Link 
  href="/learn/plan/create"
  className="btn btn-primary"
>
  Create Study Plan
</Link>
```

### 2. From Learning Paths
After enrolling in a path, suggest creating a plan:

```jsx
<button 
  onClick={() => router.push('/learn/plan/create')}
  className="btn btn-secondary"
>
  Create a Study Plan for This Path
</button>
```

### 3. From Content Page
Add a "Schedule Learning" button:

```jsx
<button 
  onClick={() => router.push('/learn/plan/create')}
  className="btn"
>
  📅 Add to Study Plan
</button>
```

## 🎯 User Flow

```
Dashboard
  ↓
Click "📅 Study Plans"
  ↓
/learn/plans (view all plans)
  ↓
Either:
  - View existing plan → /learn/plan/[id]
  - Create new plan → /learn/plan/create
  ↓
/learn/plan/create (wizard)
  ↓
Step 1: Select hours/week → Next
Step 2: Select goal → Next
Step 3: Career + preferences → Create
  ↓
AI generates schedule (takes ~5 seconds)
  ↓
/learn/plan/[id] (view schedule)
  ↓
Check off completed tasks
  ↓
Earn progress badges
```

## 🔧 Configuration Options

### Adjust AI Model
In `src/lib/planGenerator.js`, line ~40:

```javascript
const response = await groq.messages.create({
  model: 'mixtral-8x7b-32768', // Change to 'groq-70b' or other
  max_tokens: 2000,
  ...
});
```

### Change Schedule Adjustment Threshold
In `src/app/api/study-plans/[planId]/tasks/[taskId]/complete/route.js`, line ~45:

```javascript
if (completedCount < expectedCount * 0.5) { // Adjust 0.5 (50%)
  await adjustSchedule(Number(planId), 'fell_behind');
}
```

### Modify Task Types
The system supports these task types (customize as needed):
- `watch_lesson` - Watch educational video
- `quiz` - Take a quiz
- `flashcards` - Practice with flashcards
- `review` - Review material

Add more by updating StudyPlanWizard and the schema.

## 🧪 Testing

### Test Plan Creation
```bash
curl -X POST http://localhost:3000/api/study-plans \
  -H "Content-Type: application/json" \
  -d '{
    "hoursPerWeek": 10,
    "goal": "certify",
    "targetCareer": "Data Scientist",
    "preferences": {"preferMorning": true}
  }'
```

### Test Task Completion
```bash
curl -X POST http://localhost:3000/api/study-plans/1/tasks/1/complete \
  -H "Content-Type: application/json"
```

### Test Plan Retrieval
```bash
curl http://localhost:3000/api/study-plans/1 \
  -H "Content-Type: application/json"
```

## 📊 Monitoring

### Check Database
```bash
# View all plans
npx prisma studio

# Or query directly
npx prisma db execute --stdin < query.sql
```

### Monitor AI Usage
Track Groq API usage at: https://console.groq.com/usage

## ❓ Troubleshooting

### "Unauthorized" Error
- Ensure user is logged in
- Check session is being passed to API

### "GROQ_API_KEY not found"
- Add `GROQ_API_KEY=xxx` to `.env.local`
- Restart dev server after updating .env

### Plan not showing up
- Ensure migration ran: `npx prisma migrate deploy`
- Check user_id matches authenticated user

### AI schedule generation timing out
- Increase `max_tokens` in planGenerator.js
- Check Groq API status

## 🚀 Performance Tips

1. **Cache Generated Schedules**
   - Plans are created once, reused many times
   - Consider Redis caching for frequently viewed plans

2. **Optimize Task Queries**
   - Tasks are grouped by day client-side
   - Consider pagination for large plans

3. **Async Task Completion**
   - Task completion doesn't block UI
   - Consider background job queue for complex adjustments

## 🔐 Security Checklist

- ✅ All endpoints require authentication
- ✅ Users can only view their own plans
- ✅ Input validation on all fields
- ✅ No sensitive data in responses
- ✅ Rate limiting recommended for API endpoints

## 📞 Support

For questions or issues:

1. Check `STUDY_PLANNER_IMPLEMENTATION.md` for full documentation
2. Review error messages in API responses
3. Verify database schema: `npx prisma db push --force-reset`
4. Check Groq API key and rate limits

---

**Ready to launch?** Your Study Planner is production-ready! 🚀
