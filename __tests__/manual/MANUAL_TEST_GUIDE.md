# Manual Testing Guide - Explanation Feedback System

Since the Jest environment requires additional Next.js configuration, here's a comprehensive manual testing guide to verify the implementation works correctly.

## Quick Start Testing

### 1. Verify API Endpoints Exist

```bash
# Check save endpoint exists
curl -X POST http://localhost:3000/api/explanation-feedback/save \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v

# Expected: 401 Unauthorized (no auth token) or 400 Bad Request
```

```bash
# Check preferences endpoint exists
curl http://localhost:3000/api/explanation-feedback/preferences \
  -v

# Expected: 401 Unauthorized (no auth token)
```

### 2. Test Components in Browser

#### DiagramExplainer Test
1. Navigate to a page that shows DiagramExplainer
2. Look for "Did this help?" section with 5 rating buttons
3. Click one of the star buttons
4. Should see "✓ Thanks for the feedback!" message
5. Rating buttons should disappear

#### AnalogyExplainer Test
1. Navigate to a page that shows AnalogyExplainer
2. Look for "Did this help?" section with 5 rating buttons
3. Click one of the buttons
4. Should see success message
5. Buttons should disappear

#### WalkthroughExplainer Test
1. Navigate to a walkthrough explanation
2. Go through all steps (click "Next")
3. On final step, you should see "Did this help?" buttons
4. Click a rating
5. Should see success message

### 3. Test Proactive Suggestions

1. Provide 5+ ratings of the **same style** (e.g., all diagrams)
2. Give diagrams high scores (4-5 stars)
3. Navigate to another page with a diagram explanation
4. Should see: "💡 Based on your learning style, diagram works best for you!"
5. Hint should auto-hide after 5 seconds

### 4. Database Verification

#### Check feedback was saved
```sql
SELECT * FROM "ExplanationFeedback" 
WHERE userId = 1 
ORDER BY createdAt DESC 
LIMIT 5;
```

Expected columns:
- id, userId, contentId, chapterTitle
- explainerType (diagram|analogy|walkthrough)
- helpfulnessScore (0-5)
- timeSpentSeconds (elapsed time)
- createdAt, updatedAt

#### Check preference calculation
```sql
SELECT 
  explainerType,
  AVG(helpfulnessScore) as avgScore,
  COUNT(*) as count
FROM "ExplanationFeedback"
WHERE userId = 1 AND createdAt > NOW() - INTERVAL '30 days'
GROUP BY explainerType
ORDER BY avgScore DESC;
```

### 5. Integration Test Flow

Follow this complete user journey:

**Step 1:** User logs in
- Get auth token (JWT)
- Set in browser cookies

**Step 2:** View explanation
- Navigate to lesson with confusion detection
- Trigger visual explanation (diagram, analogy, or walkthrough)

**Step 3:** Rate explanation
- Click rating button (1-5 stars)
- Verify success message shows
- Verify time elapsed is recorded (~5-60 seconds)

**Step 4:** Check feedback saved
```bash
curl http://localhost:3000/api/explanation-feedback/preferences \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "bestExplainerType": "diagram",
  "scores": {
    "diagram": { "avgScore": 4.5, "count": 1, "scores": [5] },
    "analogy": { "avgScore": 0, "count": 0, "scores": [] },
    "walkthrough": { "avgScore": 0, "count": 0, "scores": [] }
  },
  "feedbackCount": 1
}
```

**Step 5:** Get proactive suggestion
- View another explanation of preferred type
- Should see hint: "Based on your learning style..."

---

## Test Checklist

### Feedback Submission ✅
- [ ] Rating buttons render (5 buttons visible)
- [ ] Can click each button (1-5 stars)
- [ ] Success message appears
- [ ] Buttons disappear after submission
- [ ] Network request sent to `/api/explanation-feedback/save`
- [ ] Time elapsed is > 1 second

### Database Storage ✅
- [ ] Feedback stored in `ExplanationFeedback` table
- [ ] userId linked correctly
- [ ] explainerType is one of: diagram|analogy|walkthrough
- [ ] helpfulnessScore is 0-5
- [ ] timeSpentSeconds is positive integer
- [ ] createdAt timestamp is current time

### Preference Calculation ✅
- [ ] GET `/api/explanation-feedback/preferences` returns data
- [ ] bestExplainerType is null when no feedback
- [ ] bestExplainerType is correct after 3+ ratings
- [ ] Average scores calculated correctly
- [ ] Only feedback from last 30 days included
- [ ] Correct type gets highest score

### Proactive Suggestions ✅
- [ ] Preferences fetched on page load
- [ ] Hint shows when types match
- [ ] Hint shows correct message
- [ ] Hint auto-hides after 5 seconds
- [ ] Hint doesn't show when types don't match
- [ ] No hint for new users (no feedback)

### Error Handling ✅
- [ ] 401 returned without auth token
- [ ] 400 returned for invalid explainerType
- [ ] 400 returned for score > 5 or < 0
- [ ] Graceful error messages shown
- [ ] No console errors in browser
- [ ] Server logs show errors

### Performance ✅
- [ ] API response < 200ms (check Network tab)
- [ ] No page jank when submitting
- [ ] Components render without delay
- [ ] No memory leaks (DevTools)

---

## Troubleshooting

### Rating buttons don't appear
**Check:**
1. Are `contentId` and `chapterTitle` being passed?
2. Is the component receiving these props?
3. Are you logged in (auth token set)?
4. Check browser console for errors

**Fix:** Pass props correctly to child components:
```jsx
<DiagramExplainer 
  title="..."
  contentId={123}
  chapterTitle="Chapter 1"
  {...otherProps}
/>
```

### Feedback not saving
**Check:**
1. Is the API endpoint accessible? (`fetch("/api/explanation-feedback/save")`)
2. Is auth token valid? (check JWT in cookies)
3. Is Prisma connected to database?
4. Check server console for database errors

**Fix:**
```bash
# Test endpoint directly
curl -X POST http://localhost:3000/api/explanation-feedback/save \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_TOKEN" \
  -d '{
    "contentId": 1,
    "chapterTitle": "Intro",
    "explainerType": "diagram",
    "helpfulnessScore": 5,
    "timeSpentSeconds": 30
  }'
```

### Proactive hint doesn't appear
**Check:**
1. Do you have 5+ ratings of same type? (needs feedback history)
2. Does current explanation type match preferred type?
3. Is `getUserPreferredStyle()` fetching correctly?
4. Check Network tab - is `/api/explanation-feedback/preferences` called?

**Fix:**
1. First, submit multiple ratings (3-5) of the same type
2. Give high scores (4-5 stars) to establish preference
3. Then view another explanation of that type
4. Check browser console for fetch errors

### Database table not found
**Check:**
1. Was migration applied? `npx prisma migrate dev`
2. Does table exist? `SELECT * FROM "ExplanationFeedback" LIMIT 1;`

**Fix:**
```bash
# Apply migrations
npx prisma migrate dev

# Regenerate Prisma client
npx prisma generate

# Verify table
npx prisma studio
```

---

## Expected API Responses

### Success: Save Feedback
**Request:**
```json
POST /api/explanation-feedback/save
{
  "contentId": 123,
  "chapterTitle": "Module 2: Auth",
  "explainerType": "diagram",
  "helpfulnessScore": 5,
  "timeSpentSeconds": 45
}
```

**Response (201):**
```json
{
  "id": 1,
  "userId": 5,
  "contentId": 123,
  "chapterTitle": "Module 2: Auth",
  "explainerType": "diagram",
  "helpfulnessScore": 5,
  "timeSpentSeconds": 45,
  "createdAt": "2026-05-08T14:30:22.000Z",
  "updatedAt": "2026-05-08T14:30:22.000Z"
}
```

### Success: Get Preferences
**Request:**
```
GET /api/explanation-feedback/preferences
```

**Response (200):**
```json
{
  "bestExplainerType": "diagram",
  "scores": {
    "diagram": {
      "avgScore": 4.5,
      "count": 2,
      "scores": [5, 4]
    },
    "analogy": {
      "avgScore": 3,
      "count": 1,
      "scores": [3]
    },
    "walkthrough": {
      "avgScore": 0,
      "count": 0,
      "scores": []
    }
  },
  "feedbackCount": 3
}
```

### Error: Unauthorized
**Response (401):**
```json
{
  "error": "Unauthorized"
}
```

### Error: Invalid Input
**Response (400):**
```json
{
  "error": "Invalid explainerType. Must be: diagram, analogy, or walkthrough"
}
```

---

## Browser DevTools Testing

### Network Tab
1. Click rating button
2. Look for POST to `/api/explanation-feedback/save`
3. Should be 201 status
4. Response shows saved feedback object
5. Takes < 200ms

### Console Tab
1. No errors or warnings
2. Check that feedback is submitted (no TypeErrors)
3. Verify `console.error` not called

### Application Tab
1. Check "token" cookie exists (auth)
2. Verify token is valid JWT (decode it)
3. Check localStorage for any state

### Performance Tab
1. Record page interaction
2. Click rating button
3. Should not see major jank
4. API call should be < 200ms

---

## Automated Test Template

Once Jest is configured, use this template:

```javascript
describe("ExplanationFeedback", () => {
  it("should save feedback and calculate preferences", async () => {
    // 1. Setup: User logged in
    const token = await login("user@test.com", "password")
    
    // 2. Action: Submit feedback
    const response = await fetch("/api/explanation-feedback/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `token=${token}`
      },
      body: JSON.stringify({
        contentId: 1,
        chapterTitle: "Chapter 1",
        explainerType: "diagram",
        helpfulnessScore: 5,
        timeSpentSeconds: 45
      })
    })

    // 3. Assert: Feedback saved
    expect(response.status).toBe(201)
    const feedback = await response.json()
    expect(feedback.id).toBeDefined()

    // 4. Action: Get preferences
    const prefResponse = await fetch(
      "/api/explanation-feedback/preferences",
      {
        headers: { "Cookie": `token=${token}` }
      }
    )

    // 5. Assert: Preferences calculated
    expect(prefResponse.status).toBe(200)
    const preferences = await prefResponse.json()
    expect(preferences.bestExplainerType).toBe("diagram")
    expect(preferences.scores.diagram.avgScore).toBe(5)
  })
})
```

---

## Success Criteria

All of the following should be true:

- ✅ Rating buttons render and clickable
- ✅ Success message shows after click
- ✅ API endpoint returns 201 status
- ✅ Feedback stored in database
- ✅ Average score calculated correctly
- ✅ Best style identified accurately
- ✅ Proactive hint shows to users
- ✅ No console errors
- ✅ Performance < 200ms
- ✅ Works with auth token

---

**Status:** Ready for manual testing
**Environment:** Local dev environment (npm run dev)
**Tester:** [Your name]
**Date:** [Today's date]
**Result:** ✅ PASS / ❌ FAIL
