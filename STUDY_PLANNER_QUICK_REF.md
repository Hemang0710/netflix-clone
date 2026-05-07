# Study Planner - Quick Reference

## 🔗 Routes & Pages

| Route | Method | Purpose |
|-------|--------|---------|
| `/learn/plan/create` | GET | Create new plan (wizard UI) |
| `/learn/plans` | GET | View all user's plans |
| `/learn/plan/[id]` | GET | View specific plan details |

## 🔌 API Endpoints

### Create Plan
```http
POST /api/study-plans
Content-Type: application/json

{
  "hoursPerWeek": 10,
  "goal": "certify",
  "targetCareer": "Data Scientist",
  "preferences": {
    "preferMorning": true,
    "preferMobileTime": false,
    "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "planId": 1,
    "schedule": [
      {
        "day": "Monday",
        "time": "9:00 AM",
        "duration": 60,
        "activity": "Watch: Python Basics",
        "contentId": 42,
        "type": "watch_lesson"
      }
    ],
    "reasoning": "...",
    "taskCount": 15
  }
}
```

### List Plans
```http
GET /api/study-plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hoursPerWeek": 10,
      "goal": "certify",
      "isActive": true,
      "tasks": [...]
    }
  ]
}
```

### Get Plan Details
```http
GET /api/study-plans/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 55,
    "hoursPerWeek": 10,
    "goal": "certify",
    "targetCareer": "Data Scientist",
    "schedule": "[...]",
    "preferences": "{...}",
    "isActive": true,
    "tasks": [
      {
        "id": 101,
        "title": "Watch: Python Basics",
        "taskType": "watch_lesson",
        "duration": 60,
        "scheduledFor": "2026-05-05T09:00:00Z",
        "completed": false,
        "completedAt": null,
        "content": {
          "id": 42,
          "title": "Python Basics"
        }
      }
    ],
    "adjustments": []
  }
}
```

### Update Plan
```http
PUT /api/study-plans/1
Content-Type: application/json

{
  "isActive": false
}
```

### Complete Task
```http
POST /api/study-plans/1/tasks/101/complete
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "completed": true,
    "completedAt": "2026-04-29T14:30:00Z"
  },
  "stats": {
    "completedCount": 5,
    "expectedCount": 6,
    "behindSchedule": false
  }
}
```

## 🎨 Component Usage

### StudyPlanWizard
```jsx
import StudyPlanWizard from '@/components/StudyPlanWizard';

export default function Page() {
  return <StudyPlanWizard />;
}
```

### StudyPlanView
```jsx
import StudyPlanView from '@/components/StudyPlanView';

export default function Page({ params }) {
  return <StudyPlanView planId={params.planId} />;
}
```

## 📊 Data Models

### StudyPlan
```javascript
{
  id: Number,
  userId: Number,
  hoursPerWeek: Number,        // 5, 10, 20, 30
  goal: String,                 // "certify" | "hobby" | "career_switch"
  targetCareer: String | null,
  schedule: String,             // JSON stringified
  preferences: String | null,   // JSON stringified
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  tasks: StudyTask[],
  adjustments: ScheduleAdjustment[]
}
```

### StudyTask
```javascript
{
  id: Number,
  planId: Number,
  contentId: Number | null,
  title: String,
  description: String | null,
  taskType: String,           // "watch_lesson" | "quiz" | "flashcards" | "review"
  duration: Number,           // minutes
  scheduledFor: Date,
  completed: Boolean,
  completedAt: Date | null,
  createdAt: Date,
  content: Content | null
}
```

### ScheduleAdjustment
```javascript
{
  id: Number,
  planId: Number,
  reason: String,             // "fell_behind" | "ahead" | "lost_interest"
  adjustment: String,         // JSON stringified
  appliedAt: Date
}
```

## 🔧 Utility Functions

### In lib/planGenerator.js

#### generateStudyPlan()
```javascript
import { generateStudyPlan } from '@/lib/planGenerator';

const result = await generateStudyPlan({
  userId: 55,
  hoursPerWeek: 10,
  goal: "certify",
  targetCareer: "Data Scientist",
  preferences: { preferMorning: true }
});

// Returns:
// {
//   schedule: [...],
//   tasks: [...],
//   reasoning: "..."
// }
```

#### adjustSchedule()
```javascript
import { adjustSchedule } from '@/lib/planGenerator';

const adjustment = await adjustSchedule(planId, 'fell_behind');
```

## 📱 Component Props

### StudyPlanWizard
No props required. Self-contained wizard.

### StudyPlanView
```jsx
<StudyPlanView planId={1} />
// Props:
// - planId (Number, required): The ID of the plan to display
```

## 🎯 Common Tasks

### Create a Plan Programmatically
```javascript
const res = await fetch('/api/study-plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hoursPerWeek: 10,
    goal: 'certify',
    targetCareer: 'Data Scientist'
  })
});

const data = await res.json();
console.log(data.data.planId); // New plan ID
```

### Complete a Task
```javascript
const res = await fetch(
  `/api/study-plans/1/tasks/101/complete`,
  { method: 'POST' }
);

const data = await res.json();
console.log(data.stats.behindSchedule); // Is user behind?
```

### Get User's Plans
```javascript
const res = await fetch('/api/study-plans');
const data = await res.json();
console.log(data.data); // Array of plans
```

### Query Plans with Prisma
```javascript
import { prisma } from '@/lib/prisma';

// Get all active plans for user
const plans = await prisma.studyPlan.findMany({
  where: { userId, isActive: true },
  include: { tasks: true, adjustments: true }
});

// Get specific plan
const plan = await prisma.studyPlan.findUnique({
  where: { id: planId },
  include: {
    tasks: {
      include: { content: true }
    }
  }
});

// Mark task complete
await prisma.studyTask.update({
  where: { id: taskId },
  data: {
    completed: true,
    completedAt: new Date()
  }
});
```

## 🔑 Environment Variables

```env
# Required for plan generation
GROQ_API_KEY=sk_xxx...
```

## 🛠️ Database Commands

```bash
# Run migration
npx prisma migrate dev --name add_study_plans

# View data
npx prisma studio

# Reset database (dev only!)
npx prisma migrate reset
```

## ❌ Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Missing required fields | Check request payload |
| 401 | Unauthorized | User must be logged in |
| 403 | Forbidden | User can't access this plan |
| 404 | Plan not found | Check plan ID |
| 500 | Server error | Check logs, verify GROQ_API_KEY |

## ⚡ Performance Tips

1. **Cache Plans** - They don't change unless adjusted
2. **Lazy Load Tasks** - Load on demand, not all at once
3. **Batch Updates** - Complete multiple tasks at once
4. **Use Prisma Select** - Only fetch needed fields

```javascript
// Good - only fetch needed fields
const plans = await prisma.studyPlan.findMany({
  select: { id: true, goal: true, hoursPerWeek: true }
});

// Better - include related data efficiently
const plan = await prisma.studyPlan.findUnique({
  where: { id },
  include: { tasks: { take: 10 } } // Limit tasks
});
```

## 📚 Related Files

- Database: `prisma/schema.prisma`
- API: `src/app/api/study-plans/`
- Components: `src/components/StudyPlanWizard.jsx`, `StudyPlanView.jsx`
- Utils: `src/lib/planGenerator.js`
- Pages: `src/app/learn/plan/`, `src/app/learn/plans/`

## 🔗 Related Features

- Learning Paths: Auto-populate plans with path content
- Content Pages: Link to plan creation
- Dashboard: Show current plan progress
- Analytics: Track learning velocity from plans

## 📞 Debugging

### Plan not created
- Check `GROQ_API_KEY` is set
- Verify user is authenticated
- Check response for error message

### Tasks not appearing
- Ensure migration ran
- Verify database connection
- Check plan ID is correct

### Schedule looks wrong
- Check AI prompt in `planGenerator.js`
- Verify preferences passed correctly
- Check content hours are accurate

### Permission denied
- Ensure user is logged in
- Verify user owns the plan
- Check plan exists

---

**Last Updated:** 2026-04-29  
**Version:** 1.0
