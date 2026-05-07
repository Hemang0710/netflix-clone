# Intelligent Study Planner Implementation

A comprehensive AI-powered study planning system that generates personalized weekly learning schedules based on learner availability, goals, and content difficulty.

## ✨ Features

### 1. **AI-Generated Personalized Schedules**
- Uses Groq AI to generate realistic, tailored weekly schedules
- Considers learner availability, skill level, and learning goals
- Respects time preferences (morning vs. flexible)
- Automatically distributes content across the week

### 2. **Flexible Goal-Based Planning**
- **Hobby/Interest**: Relaxed pace for personal growth
- **Certification**: Focused plan to earn verified credentials
- **Career Switch**: Intensive schedule for job transition within 3-6 months

### 3. **Task Management**
- Tracks completion of scheduled learning tasks
- Automatic deadline extensions if falling behind
- Progress visualization with percentage tracking
- Task completion notifications

### 4. **Schedule Adjustments**
- Monitors learner progress and pace
- Automatically adjusts deadlines if user falls behind
- Flexible scheduling to accommodate life changes

## 📊 Database Schema

### StudyPlan
```prisma
model StudyPlan {
  id              Int
  userId          Int
  user            User
  
  hoursPerWeek    Int           // 5, 10, 20, 30
  goal            String        // "certify" | "hobby" | "career_switch"
  targetCareer    String?
  
  schedule        String        // JSON: schedule items
  preferences     String?       // JSON: user preferences
  
  isActive        Boolean       @default(true)
  createdAt       DateTime
  updatedAt       DateTime
  
  tasks           StudyTask[]
  adjustments     ScheduleAdjustment[]
}
```

### StudyTask
```prisma
model StudyTask {
  id              Int
  planId          Int
  plan            StudyPlan
  
  contentId       Int?
  content         Content?
  
  title           String
  description     String?
  taskType        String        // "watch_lesson" | "quiz" | "flashcards" | "review"
  duration        Int           // minutes
  
  scheduledFor    DateTime
  completed       Boolean       @default(false)
  completedAt     DateTime?
  
  createdAt       DateTime
}
```

### ScheduleAdjustment
```prisma
model ScheduleAdjustment {
  id              Int
  planId          Int
  plan            StudyPlan
  
  reason          String        // "fell_behind" | "ahead" | "lost_interest"
  adjustment      String        // JSON with changes
  appliedAt       DateTime
}
```

## 🔌 API Endpoints

### Create Study Plan
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
    "reasoning": "This schedule balances your morning preference...",
    "taskCount": 15
  }
}
```

### Get Study Plans
```http
GET /api/study-plans
```

Returns all active plans for the authenticated user.

### Get Specific Plan
```http
GET /api/study-plans/[planId]
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
    "tasks": [
      {
        "id": 101,
        "title": "Watch: Python Basics",
        "taskType": "watch_lesson",
        "duration": 60,
        "scheduledFor": "2026-05-05T09:00:00Z",
        "completed": false,
        "content": {
          "id": 42,
          "title": "Python Basics",
          "duration": 3600
        }
      }
    ],
    "adjustments": []
  }
}
```

### Complete Task
```http
POST /api/study-plans/[planId]/tasks/[taskId]/complete
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "stats": {
    "completedCount": 5,
    "expectedCount": 6,
    "behindSchedule": false
  }
}
```

## 🎨 Frontend Components

### StudyPlanWizard
Multi-step form to create a new study plan:
1. Select weekly hours (5, 10, 20, 30)
2. Choose learning goal (hobby, certify, career switch)
3. Optional career target and preferences

**Location:** `src/components/StudyPlanWizard.jsx`

### StudyPlanView
Displays and manages an active study plan:
- Schedule grouped by day
- Task completion tracking
- Progress visualization
- Statistics dashboard

**Location:** `src/components/StudyPlanView.jsx`

### Study Plans List
Browse and manage all study plans.

**Location:** `src/app/learn/plans/page.js`

## 📱 Pages

- **Create Plan:** `/learn/plan/create`
- **View Plan:** `/learn/plan/[planId]`
- **All Plans:** `/learn/plans`

## 🚀 Usage

### For Users

1. **Create a Plan**
   - Navigate to `/learn/plan/create`
   - Answer the 3-step wizard
   - AI generates a personalized schedule

2. **Track Progress**
   - View your plan at `/learn/plan/[planId]`
   - Check off completed tasks
   - Monitor progress percentage

3. **Manage Plans**
   - Visit `/learn/plans` to see all plans
   - Plans automatically adjust if you fall behind
   - Pause/resume plans as needed

### For Developers

#### Installation

1. **Add to Prisma Schema** (already done)
   ```bash
   npx prisma migrate dev --name add_study_plans
   ```

2. **Environment Variables**
   ```env
   GROQ_API_KEY=your_groq_api_key
   ```

3. **Import Components**
   ```jsx
   import StudyPlanWizard from '@/components/StudyPlanWizard';
   import StudyPlanView from '@/components/StudyPlanView';
   ```

## 🔧 Configuration

### AI Model
The system uses **Groq's Mixtral-8x7b** for schedule generation. This is fast and cost-effective for the scheduling task.

To use a different model:
```javascript
// In lib/planGenerator.js
const response = await groq.messages.create({
  model: 'your-model-id', // Change here
  max_tokens: 2000,
  ...
});
```

### Schedule Adjustment Thresholds
Currently adjusts schedule if user completes < 50% of due tasks.

To modify:
```javascript
// In src/app/api/study-plans/[planId]/tasks/[taskId]/complete/route.js
if (completedCount < expectedCount * 0.5) { // Change 0.5 to adjust threshold
  await adjustSchedule(Number(planId), 'fell_behind');
}
```

## 📊 Data Flow

```
User Creates Plan
    ↓
StudyPlanWizard collects input
    ↓
POST /api/study-plans
    ↓
generateStudyPlan() via Groq AI
    ↓
Parse AI response → Create StudyPlan & StudyTasks
    ↓
Redirect to /learn/plan/[planId]
    ↓
StudyPlanView displays schedule
    ↓
User completes tasks
    ↓
POST task completion
    ↓
Check progress & auto-adjust if needed
    ↓
Update UI with new status
```

## ⚠️ Error Handling

- **Invalid Input:** Returns 400 with validation message
- **Unauthorized:** Returns 401 for non-authenticated requests
- **Not Found:** Returns 404 for non-existent plans
- **AI Generation Failure:** Catches and returns 500 with error details
- **Database Errors:** Logged and returned as 500 responses

## 🔒 Security

- ✅ User authentication required for all endpoints
- ✅ Plans only accessible to their owner
- ✅ SQL injection protection (Prisma ORM)
- ✅ CSRF protection (Next.js built-in)
- ✅ Input validation on all endpoints

## 🎯 Future Enhancements

1. **Collaborative Planning**
   - Share plans with mentors/coaches
   - Comments and feedback on tasks

2. **Advanced Analytics**
   - Learning velocity tracking
   - Concept mastery visualization
   - Performance predictions

3. **Integration with Study Groups**
   - Auto-match peers with similar schedules
   - Group study sessions

4. **Mobile Optimization**
   - Offline schedule access
   - Push notifications for upcoming tasks
   - Mobile-friendly micro-tasks

5. **Gamification**
   - Streak tracking
   - Rewards for consistent completion
   - Leaderboards

## 📝 Example Workflow

```javascript
// 1. Create a plan
const createRes = await fetch('/api/study-plans', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hoursPerWeek: 10,
    goal: 'certify',
    targetCareer: 'Data Scientist',
    preferences: { preferMorning: true }
  })
});

const { data } = await createRes.json();
const planId = data.planId; // 1

// 2. Get the plan
const getRes = await fetch(`/api/study-plans/${planId}`);
const plan = await getRes.json();
console.log(plan.data.tasks); // Array of 15 tasks

// 3. Complete a task
const completeRes = await fetch(
  `/api/study-plans/${planId}/tasks/101/complete`,
  { method: 'POST' }
);
const result = await completeRes.json();
console.log(result.stats); // { completedCount: 1, expectedCount: 6, behindSchedule: false }
```

## 📞 Support

For issues or questions:
1. Check the error message in the API response
2. Verify database migration ran: `npx prisma migrate deploy`
3. Ensure GROQ_API_KEY is set in environment
4. Check Groq API rate limits

---

**Version:** 1.0  
**Last Updated:** 2026-04-29  
**Status:** Production Ready ✅
