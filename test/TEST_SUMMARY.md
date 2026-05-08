# Spaced Repetition System - Test Summary

## Overview

A comprehensive test suite has been created for the spaced repetition learning system, covering all major components, API routes, utilities, and hooks.

## Test Files Created

### 1. SM-2 Algorithm Tests (`test/lib/sm2.test.js`)

**File Count:** 1  
**Test Cases:** 30+

**Coverage:**
- `applySM2()` - Core SM-2 algorithm
  - Reset on poor reviews (quality 0)
  - Interval progression (1 → 6 → n*easeFactor)
  - Repetition counting
  - Ease factor adjustments with min 1.3 constraint
  - Due date calculation

- `calcMasteryScore()` - Mastery calculation
  - Score range (0-100)
  - Impact of repetitions and ease factor
  - Impact of last review score

- `getForgettingCurve()` - Retention prediction
  - 30-day curve generation
  - Ebbinghaus decay formula
  - Interval-dependent decay rates

- `isOverdue()` & `daysUntilDue()` - Date utilities
  - Overdue detection
  - Days calculation

**Key Assertions:**
- Quality 0 resets card state
- Ease factor never drops below 1.3
- Due dates progress correctly
- Forgetting curves decay monotonically
- Mastery scores stay within 0-100 bounds

---

### 2. API Route Tests (`test/api/concepts.test.js`)

**File Count:** 1  
**Test Cases:** 15+

**Coverage:**

- **GET /api/concepts**
  - Returns concepts for authenticated user
  - Filters by contentId
  - Lazy-seeds from chapter titles
  - Returns 401 for unauthenticated

- **POST /api/concepts**
  - Creates new concept
  - Validates required fields
  - Returns 201 on success

- **GET /api/concepts/due**
  - Returns concepts due for review
  - Sorted by due date
  - Returns count

- **POST /api/concepts/[id]/review**
  - Applies SM-2 algorithm
  - Updates mastery score
  - Validates quality (0-3)
  - Returns 404 for non-existent concept
  - Returns 403 for unauthorized access

- **POST /api/concepts/evaluate**
  - Evaluates free-text answers
  - Uses Groq AI
  - Returns score (0-100), feedback, correct flag
  - Validates required fields

---

### 3. React Component Tests

#### DailyReviewSession (`test/components/DailyReviewSession.test.js`)

**Test Cases:** 10+

**Coverage:**
- Idle state (shows count, "All caught up" message)
- Session initialization
- Progress bar during review
- Concept and question display
- Answer textarea input
- Score evaluation and display
- Success/encouragement messages based on score
- Rating buttons (Again/Hard/Good/Easy)
- Session completion with stats
- Error handling

#### ComprehensionCheckpoint (`test/components/ComprehensionCheckpoint.test.js`)

**Test Cases:** 20+

**Coverage:**
- Overlay rendering and chapter title
- Loading state for question generation
- Question fetching and display
- Textarea for answer input

**First Watch Behavior:**
- No skip button initially
- Skip button appears after 5 seconds
- Blocking until skip is available

**Rewatch Behavior:**
- Skip button visible immediately

**Answer Submission:**
- Disables submit with empty answer
- Fetches evaluation from API
- Shows loading during evaluation

**Score Display:**
- Score percentage display
- Progress bar visualization
- Success message for passing (≥60)
- Encouragement message for low scores

**Callbacks:**
- `onPass()` called with correct params
- `onSkip()` called when skip clicked

**Error Handling:**
- Question generation errors
- Evaluation API errors

#### ConceptMasteryList (`test/components/ConceptMasteryList.test.js`)

**Test Cases:** 15+

**Coverage:**
- Loading state
- Empty state when no concepts
- Concept list rendering
- Concept count display
- Due count display

**Color Coding:**
- Green (>80%): "Mastered"
- Blue (50-80%): "Proficient"
- Amber/Red (<50%): "Developing"

**Due Status:**
- "Due now" badge for overdue
- "Due in X days" for future

**Statistics:**
- Percentage of mastered concepts
- Total concepts count
- Total reviews done

**Sorting:**
- Sorted by due date (earliest first)

**Trend Indicators:**
- Trending up/down arrows

#### ForgettingCurveChart (`test/components/ForgettingCurveChart.test.js`)

**Test Cases:** 15+

**Coverage:**
- Loading state
- Empty state
- Chart rendering with recharts
- Multiple chart components (axes, grid, legend)
- Reference line at 70% retention
- Multiple concept lines
- Concept limiting (top 8 by review count)
- Color coding by mastery level
- Legend with color explanation
- Responsive container
- Error handling

---

### 4. Hook Tests (`test/hooks/useChapterCheckpoints.test.js`)

**File Count:** 1  
**Test Cases:** 20+

**Coverage:**

**Initialization:**
- Fetches existing checkpoints on mount
- Initializes empty state
- Skips fetch if no contentId

**Checkpoint Detection:**
- Triggers when chapter boundary crossed
- Pauses video on trigger
- Doesn't trigger twice for same chapter
- Recognizes first watch vs rewatch
- Marks checkpoint state based on history

**clearCheckpoint():**
- Clears trigger
- Resumes video

**markPassed():**
- Marks checkpoint as passed
- Sends POST to endpoint
- Updates checkpoint state
- Clears trigger after marking
- Increments attempts count

**Event Management:**
- Attaches timeupdate listener
- Removes listener on cleanup

**Error Handling:**
- Gracefully handles fetch errors

---

### 5. Integration Tests (`test/integration/spaced-repetition.test.js`)

**File Count:** 1  
**Test Cases:** 15+

**Coverage:**

**Complete Review Cycles:**
- Full SM-2 progression (3+ reviews)
- Failed review recovery
- Ease factor progression

**Lifecycle:**
- Retention at key milestones
- Longer intervals = slower decay

**Quality Impact:**
- Quality differences affect interval scheduling
- Ease factor progression based on quality

**Mastery Progression:**
- Realistic mastery progression (10 reviews)
- Interval increase over time

**Multiple Concepts:**
- Different mastery levels
- Proper ranking/ordering

**Edge Cases:**
- Minimum ease factor constraint
- Zero interval handling
- Very high repetition counts

---

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm test:watch
```

### Coverage Report
```bash
npm test:coverage
```

### Specific File
```bash
npm test -- test/lib/sm2.test.js
```

### Specific Test
```bash
npm test -- --testNamePattern="should reset card"
```

---

## Test Statistics

- **Total Test Files:** 7
- **Total Test Cases:** ~120+
- **Lines of Test Code:** ~2,500+
- **Coverage Target:** 80%+

---

## Test Environment

- **Framework:** Jest
- **Component Testing:** React Testing Library
- **Mocking:** jest.fn(), jest.mock()
- **Async Testing:** waitFor(), act()

---

## Setup Files

- **jest.config.js** - Jest configuration
- **jest.setup.js** - Test environment setup with mocks
- **test/README.md** - Detailed test documentation

---

## Key Test Patterns

### Unit Tests
Single-function tests with isolated dependencies

### Component Tests
Render → User Interaction → Assertions → Cleanup

### API Tests
Mock fetch → Call endpoint → Verify response

### Integration Tests
Multi-step workflows with realistic data

---

## Quality Metrics

Each test file includes:
- ✅ Descriptive test names
- ✅ Clear setup/teardown
- ✅ Edge case coverage
- ✅ Error scenario testing
- ✅ Isolated tests (no interdependencies)

---

## Next Steps

1. Run test suite: `npm test`
2. Check coverage: `npm test -- --coverage`
3. Add tests for new features
4. Maintain 80%+ coverage threshold
5. Update tests when modifying existing code

---

## Test Maintenance

When updating code:
1. Update corresponding tests first (TDD)
2. Run tests to ensure they fail
3. Implement the change
4. Verify all tests pass
5. Check coverage hasn't decreased

---

## Debugging Tests

- **Verbose output:** `npm test -- --verbose`
- **Single test:** `npm test -- --testNamePattern="pattern"`
- **Debug in Node:** `node --inspect-brk node_modules/.bin/jest --runInBand`

---

## Resources

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
