# ConceptAI Visual Explainer — Dev Reference

## Status
- Part 1 ✅ Confusion detection + visual panel scaffold (AIChatSidebar.jsx)
- Part 2 ⬜ API route /api/ai/explain
- Part 3 ⬜ Visual rendering components
- Part 4 ⬜ Feedback + LearningInsight DB model
- Part 5 ⬜ Proactive detection in WatchPageClient

## Key State (AIChatSidebar)
| state | type | purpose |
|-------|------|---------|
| confusedMsgIds | Set<string> | user msg IDs that matched CONFUSION_PATTERNS |
| visualMode | {assistantMsgId, concept, typeIndex} \| null | active visual panel |
| visualContent | object \| null | parsed JSON from /api/ai/explain |
| visualLoading | boolean | spinner while fetching |
| visualError | string \| null | error message |

## Flow
1. User types confused message → `pendingConfusedText` ref captures it
2. After messages update → match to real msg id → add to `confusedMsgIds`
3. Assistant reply renders → "✨ Show me visually" button appears below it
4. Click → `triggerVisual(assistantMsgId, concept, typeIndex)` → POST /api/ai/explain
5. Response renders inline below triggering assistant bubble

## EXPLAIN_TYPES cycle
`["diagram", "analogy", "walkthrough"]`
"Try differently" button increments typeIndex mod 3.

## Props AIChatSidebar now accepts
```js
{ contentId, hasTranscript, videoTitle, videoTranscript }
```
videoTranscript is sliced to first 3000 chars before sending to API.

## Part 2 contract (/api/ai/explain)
POST body: `{ concept, videoTranscript, videoTitle, explanationType }`
Success: `{ success: true, data: { type, title, ...typeSpecificFields } }`
Error:   `{ success: false, message: string }`

## Part 3 drop-in point
In AIChatSidebar line ~210 replace the placeholder `{visualContent && ...}` block
with `<VisualExplainer data={visualContent} onTryDifferent={handleTryDifferent} />`
