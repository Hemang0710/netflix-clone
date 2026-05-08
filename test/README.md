# Spaced Repetition System - Test Suite

This directory contains comprehensive test coverage for the spaced repetition learning system, including unit tests for the SM-2 algorithm, API routes, React components, and custom hooks.

## Test Structure

```
test/
├── lib/
│   └── sm2.test.js                      # SM-2 algorithm tests
├── api/
│   └── concepts.test.js                 # Concepts API route tests
├── components/
│   ├── DailyReviewSession.test.js       # Daily review component tests
│   ├── ComprehensionCheckpoint.test.js  # Checkpoint component tests
│   ├── ConceptMasteryList.test.js       # Mastery list component tests
│   └── ForgettingCurveChart.test.js     # Chart component tests
├── hooks/
│   └── useChapterCheckpoints.test.js    # Chapter checkpoint hook tests
├── integration/
│   └── spaced-repetition.test.js        # Full system integration tests
└── README.md                             # This file
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Specific Test File

```bash
npm test -- test/lib/sm2.test.js
```

### Run Tests with Coverage Report

```bash
npm test -- --coverage
```

## Test Coverage

### SM-2 Algorithm Tests (`test/lib/sm2.test.js`)

- ✅ SM-2 algorithm implementation
- ✅ Quality scoring (0-3)
- ✅ Interval calculation
- ✅ Ease factor adjustments
- ✅ Mastery score calculation
- ✅ Forgetting curve generation
- ✅ Date calculations (days until due, overdue checks)

**Key Test Cases:**
- Resetting cards on poor reviews
- Interval progression (1 → 6 → n*easeFactor)
- Ease factor constraints (min 1.3)
- Forgetting curve decay rates

### API Route Tests (`test/api/concepts.test.js`)

- ✅ GET /api/concepts (fetch, filter by contentId)
- ✅ POST /api/concepts (create new concept)
- ✅ GET /api/concepts/due (fetch due concepts)
- ✅ POST /api/concepts/[id]/review (apply SM-2)
- ✅ POST /api/concepts/evaluate (AI evaluation)
- ✅ Authentication checks
- ✅ Error handling

**Key Test Cases:**
- Unauthorized requests return 401
- Lazy-seeding from chapter titles
- SM-2 algorithm application on reviews
- AI evaluation with Groq API

### Component Tests

#### DailyReviewSession (`test/components/DailyReviewSession.test.js`)
- ✅ Idle state rendering
- ✅ Session initialization
- ✅ Concept review flow
- ✅ Score submission and display
- ✅ Rating buttons (Again/Hard/Good/Easy)
- ✅ Session completion and stats

#### ComprehensionCheckpoint (`test/components/ComprehensionCheckpoint.test.js`)
- ✅ Checkpoint overlay rendering
- ✅ First watch vs rewatch behavior
- ✅ Skip button visibility timing
- ✅ Question generation and display
- ✅ Answer evaluation and scoring
- ✅ Callback handlers (onPass, onSkip)
- ✅ Error states and recovery

#### ConceptMasteryList (`test/components/ConceptMasteryList.test.js`)
- ✅ Concept list rendering
- ✅ Mastery score color-coding
- ✅ Due status display
- ✅ Statistics calculation
- ✅ Sorting by due date
- ✅ Trend indicators

#### ForgettingCurveChart (`test/components/ForgettingCurveChart.test.js`)
- ✅ Recharts integration
- ✅ Forgetting curve visualization
- ✅ Multiple concept lines
- ✅ Reference line at 70% retention
- ✅ Legend and color coding
- ✅ Responsive container

### Hook Tests (`test/hooks/useChapterCheckpoints.test.js`)

- ✅ Chapter boundary detection
- ✅ Video pause/resume on checkpoint
- ✅ First watch vs rewatch detection
- ✅ Checkpoint state management
- ✅ Event listener attachment/removal
- ✅ Error handling

### Integration Tests (`test/integration/spaced-repetition.test.js`)

- ✅ Complete SM-2 review cycles
- ✅ Failed review recovery
- ✅ Mastery progression
- ✅ Multiple concept management
- ✅ Retention curves at key milestones
- ✅ Quality impact on scheduling
- ✅ Edge cases and constraints

## Test Patterns Used

### Unit Tests
Each unit test focuses on a single function or component feature with mocked dependencies.

```javascript
it('should reset card when quality is 0 (Again)', () => {
  const result = applySM2(baseCard, 0)
  expect(result.repetitions).toBe(0)
  expect(result.interval).toBe(1)
})
```

### Component Tests
React component tests use React Testing Library to render components and simulate user interactions.

```javascript
it('should submit answer when submit button is clicked', async () => {
  render(<ComprehensionCheckpoint {...mockProps} />)
  fireEvent.change(textarea, { target: { value: 'Test answer' } })
  fireEvent.click(screen.getByText(/Submit Answer/i))
  await waitFor(() => { /* assertions */ })
})
```

### API Tests
API tests mock fetch calls to simulate server responses and validate request payloads.

```javascript
it('should apply SM-2 algorithm and update concept', async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ concept: updatedConcept }),
  })
  const response = await fetch('/api/concepts/1/review', { /* ... */ })
  expect(response.ok).toBe(true)
})
```

### Integration Tests
Integration tests verify complete workflows involving multiple components working together.

```javascript
it('should complete a full SM-2 review cycle', () => {
  const concept = { /* initial state */ }
  const review1 = applySM2(concept, 2)
  const review2 = applySM2(review1, 2)
  const review3 = applySM2(review2, 3)
  // Verify progression
})
```

## Mocking Strategy

### Global Fetch
API responses are mocked using `jest.fn()`:

```javascript
global.fetch = jest.fn().mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: mockData }),
})
```

### React Components
External dependencies (like recharts) are mocked at the jest config level:

```javascript
jest.mock('recharts', () => ({ /* simplified mock */ }))
```

### Custom Hooks
Hooks are tested using React Testing Library's `renderHook`:

```javascript
const { result } = renderHook(() => useChapterCheckpoints(...))
```

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should reset card"
```

### Run with Verbose Output
```bash
npm test -- --verbose
```

### Debug in Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Goals

- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

Check coverage with:
```bash
npm test -- --coverage
```

## Future Test Improvements

1. **E2E Tests** - Add Cypress/Playwright tests for full user flows
2. **Performance Tests** - Add benchmarks for SM-2 calculations
3. **Accessibility Tests** - Verify WCAG compliance of components
4. **Visual Regression Tests** - Snapshot tests for chart rendering
5. **Load Tests** - Test API under concurrent review requests

## Common Issues

### Tests Timeout
Increase Jest timeout in jest.config.js:
```javascript
jest.setTimeout(10000) // milliseconds
```

### Async Warnings
Always use `act()` and `waitFor()` for async operations in React tests.

### Fetch Not Mocked
Ensure `global.fetch` is reset in `beforeEach()`:
```javascript
beforeEach(() => {
  jest.clearAllMocks()
})
```

## Contributing Tests

When adding new features:
1. Write tests first (TDD approach)
2. Ensure at least 80% coverage
3. Test both happy path and error cases
4. Include integration scenarios
5. Document complex test logic

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [SM-2 Algorithm](https://en.wikipedia.org/wiki/SuperMemo#SM-2_algorithm)
- [Ebbinghaus Forgetting Curve](https://en.wikipedia.org/wiki/Forgetting_curve)
