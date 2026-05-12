# Explanation Feedback System - Test Documentation

## Overview

This test suite covers the complete Explanation Feedback system (Features 11-12) which enables:
- **Feature 11**: Explanation Feedback Tracker - Track which explanation style (diagram, analogy, walkthrough) users find helpful
- **Feature 12**: Proactive Visual Suggestion - Automatically suggest the explanation style that works best for each user

## Test Structure

### 1. Unit Tests

#### `hooks/useExplanationFeedback.test.js`
Tests the React hook that manages feedback submission and preference fetching.

**Test cases:**
- ✓ Hook initialization with correct default values
- ✓ Tracking time when explanation is viewed
- ✓ Submitting feedback with correct data structure
- ✓ Error handling on feedback submission
- ✓ Fetching user's preferred explanation style
- ✓ Handling case when no preference exists
- ✓ Accurate time measurement (in seconds)

**Run:** `npm test -- useExplanationFeedback.test.js`

#### `api/explanation-feedback.test.js`
Tests the API endpoints for feedback submission and preference retrieval.

**Test cases:**
- ✓ POST `/api/explanation-feedback/save` - Authorization validation
- ✓ POST `/api/explanation-feedback/save` - Successful feedback creation
- ✓ POST `/api/explanation-feedback/save` - Validation of explainerType
- ✓ POST `/api/explanation-feedback/save` - Validation of helpfulness score (0-5)
- ✓ GET `/api/explanation-feedback/preferences` - Authorization validation
- ✓ GET `/api/explanation-feedback/preferences` - Calculate best style based on average
- ✓ GET `/api/explanation-feedback/preferences` - Handle no feedback case
- ✓ GET `/api/explanation-feedback/preferences` - Only use feedback from last 30 days

**Run:** `npm test -- explanation-feedback.test.js`

### 2. Component Tests

#### `components/ExplainerFeedback.test.js`
Tests the feedback buttons and integration in each explainer component.

**Test cases:**

*DiagramExplainer:*
- ✓ Render feedback rating buttons (1-5 stars)
- ✓ Show success message after feedback submission
- ✓ Hide feedback buttons after submission
- ✓ Track time spent viewing diagram

*AnalogyExplainer:*
- ✓ Render feedback rating buttons
- ✓ Submit correct explainer type ("analogy")
- ✓ Handle feedback submission

*WalkthroughExplainer:*
- ✓ Only show feedback buttons on the last step
- ✓ Submit correct explainer type ("walkthrough")
- ✓ Track multiple steps before showing feedback

*VisualExplainer:*
- ✓ Show proactive hint when user has preferred style
- ✓ Don't show hint when preferred style doesn't match current type
- ✓ Fetch user preferences on component mount
- ✓ Auto-hide hint after 5 seconds

**Run:** `npm test -- ExplainerFeedback.test.js`

### 3. Integration Tests

#### `integration/explanation-feedback-flow.test.js`
Tests the complete end-to-end flow of feedback collection and recommendation.

**Test scenarios:**
- ✓ Complete flow: view → rate → save → analyze → recommend
- ✓ Multiple feedback entries with mixed scores
- ✓ Time tracking across different explanation types
- ✓ No preference when user has no feedback history
- ✓ 30-day rolling window for feedback analysis
- ✓ Correct correlation between scores and recommendations

**Run:** `npm test -- explanation-feedback-flow.test.js`

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- useExplanationFeedback.test.js
```

### Run with coverage
```bash
npm test -- --coverage
```

### Run in watch mode
```bash
npm test -- --watch
```

## Test Data Structure

### Explanation Feedback Model
```javascript
{
  id: number,
  userId: number,
  contentId?: number,
  chapterTitle?: string,
  explainerType: "diagram" | "analogy" | "walkthrough",
  helpfulnessScore: 0-5,      // 0=not helpful, 5=very helpful
  timeSpentSeconds: number,   // seconds user spent viewing
  createdAt: Date,
  updatedAt: Date
}
```

### API Response: Preferences
```javascript
{
  bestExplainerType: "diagram" | "analogy" | "walkthrough" | null,
  scores: {
    diagram: { avgScore: 4.2, count: 5, scores: [5, 4, 3, 4, 5] },
    analogy: { avgScore: 3.1, count: 4, scores: [3, 2, 4, 3] },
    walkthrough: { avgScore: 0, count: 0, scores: [] }
  },
  feedbackCount: 9
}
```

## Feedback Flow Diagram

```
User Views Explanation
       ↓
User Rates (1-5 stars)
       ↓
submitFeedback() called
       ↓
POST /api/explanation-feedback/save
       ↓
Stored in DB
       ↓
Next explanation request
       ↓
GET /api/explanation-feedback/preferences
       ↓
Calculate best style (highest avg score)
       ↓
VisualExplainer shows proactive hint
       ↓
Next time that style is shown → "Based on your learning style..."
```

## Key Features Tested

### 1. Feedback Tracking
- Record which explanation style was shown
- Capture user's helpfulness rating
- Measure time spent on explanation
- Associate with specific content/chapter

### 2. Preference Analysis
- Calculate average helpfulness score per style
- Identify user's preferred learning style
- Only consider feedback from last 30 days
- Handle users with no feedback history

### 3. Proactive Suggestion
- Load user's best style when explanation appears
- Show hint if current type matches preference
- Auto-hide hint after 5 seconds
- Handle new users (no preference yet)

### 4. Error Handling
- Unauthorized access (no session)
- Invalid explainer types
- Invalid score ranges
- Network failures
- Missing user data

## Expected Test Results

When running the full test suite:
- ✅ 12 unit tests for hooks/API
- ✅ 15 component tests
- ✅ 8 integration tests
- **Total: 35 test cases**

All tests should pass with 100% coverage of:
- `/hooks/useExplanationFeedback.js`
- `/api/explanation-feedback/*`
- `/components/visual/*` (feedback sections)

## Debugging Tests

### View detailed error messages
```bash
npm test -- --verbose
```

### Debug specific test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand explanation-feedback.test.js
```

### Check mock calls
```javascript
// In test, after running:
console.log(mockFunction.mock.calls)
console.log(mockFunction.mock.results)
```

## Integration with CI/CD

These tests should run:
- ✓ On every PR
- ✓ Before merge to main
- ✓ As part of build pipeline

Example GitHub Actions setup:
```yaml
- name: Run tests
  run: npm test -- --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Future Test Additions

- [ ] Performance tests (response time < 200ms)
- [ ] Load tests (1000+ concurrent users)
- [ ] A/B testing framework integration
- [ ] Advanced preference learning (weighted by recency)
- [ ] Style switching detection tests
