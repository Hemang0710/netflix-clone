# AI-Powered Study Groups — Test Cases & What to Add

**Date:** April 28, 2026  
**Feature:** Study Groups (Feature #2)

---

## Manual Test Cases

### Group Discovery & Creation

#### TC-001: User Creates First Group
**Precondition:** No study groups exist for a video  
**Steps:**
1. Visit watch page for any video
2. Click "👥 Groups" tab
3. Observe "No study groups yet" message with "Create Study Group" button
4. Click "Create Study Group"

**Expected:**
- System auto-matches user to a new group
- View switches to chat
- AI welcome message appears: "Welcome to the [Topic] study group..."
- Member list shows current user with skill level
- ✅ *Should pass*

**Notes:** Tests the initial group creation flow and AI welcome prompt.

---

#### TC-002: User Joins Existing Group
**Precondition:** At least one active study group exists for the video  
**Steps:**
1. Visit watch page for video with groups
2. Click "👥 Groups" tab
3. See group cards with member count and avatars
4. Click "Join Group" on a specific group

**Expected:**
- Group is not full (member count < maxMembers)
- View switches to chat
- User appears in member list
- Last messages from group are visible
- ✅ *Should pass*

**Notes:** Tests joining an existing group via card button.

---

#### TC-003: User Uses Auto-Match
**Precondition:** Multiple groups exist, user not in any  
**Steps:**
1. Visit video with 3+ groups (varying skill levels)
2. Click "👥 Groups" tab
3. Click "🤖 Auto-Match Me to a Group" button

**Expected:**
- System matches user to closest group by embedding distance
- Chat view opens
- User appears in new group's member list
- ✅ *Should pass*

**Notes:** Tests the cosine distance matching algorithm. User should match to group with similar skill level.

---

#### TC-004: User Already in Group Returns Existing
**Precondition:** User already joined a group for this video  
**Steps:**
1. User joins Group A for Video X
2. User closes chat and goes back to list (back button)
3. User clicks "Auto-Match Me to a Group" again
4. OR navigates away and back to same video

**Expected:**
- System finds existing membership
- Returns same group (groupId unchanged)
- `isNewGroup: false` in response
- User doesn't duplicate in member list
- ✅ *Should pass*

**Notes:** Tests the membership uniqueness check.

---

### Chat & Messaging

#### TC-005: Send Basic Message
**Precondition:** User is in a study group  
**Steps:**
1. In chat view, type "What are decorators?"
2. Click "Send" button
3. Wait for message to appear

**Expected:**
- Message appears immediately in chat (before AI response)
- Message bubble styled as current user (indigo background)
- Helpful button shows with count = 0
- ✅ *Should pass*

**Notes:** Tests basic message persistence and UI.

---

#### TC-006: AI Responds to Help-Seeking
**Precondition:** User is in a study group  
**Steps:**
1. Type message: "I'm stuck on decorators, can someone help?"
2. Click "Send"
3. Wait 2-3 seconds

**Expected:**
- User message appears first
- AI response appears below (purple background, "🤖 AI Tutor" label)
- AI response is contextual (mentions decorators, offers guidance)
- Message not flagged (no moderation issue)
- ✅ *Should pass*

**Notes:** Tests AI trigger logic ("help" keyword), AI response generation, and message styling.

---

#### TC-007: Multiple AI Trigger Keywords
**Precondition:** User is in a study group  
**Steps:**
1. Send: "How do I use decorators?"
2. Send: "I'm confused about this"
3. Send: "stuck on line 5?"
4. Send: "Can someone explain this?"

**Expected:**
- Messages with "how to", "confused", "stuck", "?" trigger AI responses
- Each AI response is unique and relevant
- All messages appear in order
- ✅ *Should pass*

**Notes:** Tests keyword matching ("how to", "confused", "stuck", "?").

---

#### TC-008: Message Without Help Trigger (No AI)
**Precondition:** User is in a study group  
**Steps:**
1. Send: "I'm using a decorator in my code"
2. Send: "Decorators are really cool"
3. Send: "Thanks everyone for the explanations!"

**Expected:**
- Messages appear in chat
- NO AI response generated
- Helpful button visible on both messages
- ✅ *Should pass*

**Notes:** Tests that AI only responds to help-seeking, not all messages.

---

#### TC-009: Helpful Vote Increments
**Precondition:** Group has multiple messages  
**Steps:**
1. See AI message with "👍 Helpful (0)"
2. Click helpful button
3. Observe count

**Expected:**
- Count increments to 1
- No page reload needed
- Count persists on refresh
- Multiple users can vote (no deduplication in MVP)
- ✅ *Should pass*

**Notes:** Tests helpful voting logic. Note: MVP doesn't track per-user votes, so same user can vote multiple times (acceptable for now).

---

#### TC-010: Message Moderation - Toxicity Flagging
**Precondition:** User is in a study group  
**Steps:**
1. Send message with profanity: "This is f***ing stupid"
2. Send aggressive message: "You're an idiot"
3. Send spam-like message: "BUY NOW!!! CLICK HERE!!!"

**Expected:**
- Messages appear in chat (not deleted, still visible)
- "Helpful" button is hidden or disabled on flagged messages
- Moderation score > 0.7 (inspectable in DB)
- `isFlagged = true` in database
- ✅ *Should pass*

**Notes:** Tests toxicity detection. Messages are flagged but visible (can be admin-reviewed later).

---

### Real-Time & Polling

#### TC-011: Polling Fetches New Messages
**Precondition:** Two browsers open to same group  
**Steps:**
1. Browser A: Send "Hello from A"
2. Wait 5-7 seconds
3. Browser B: Observe message appears

**Expected:**
- Message appears in Browser B without manual refresh
- Timing is ~5 seconds (polling interval)
- Message bubble shows correct sender (Browser A)
- ✅ *Should pass*

**Notes:** Tests 5-second polling and cross-browser message sync.

---

#### TC-012: Auto-Scroll to Latest Message
**Precondition:** Chat has multiple messages  
**Steps:**
1. Scroll up to see old messages
2. User sends new message
3. Observe scroll position

**Expected:**
- Chat auto-scrolls to bottom
- New message is visible
- ✅ *Should pass*

**Notes:** Tests `useRef` auto-scroll on message updates.

---

#### TC-013: Member List Updates on New Join
**Precondition:** Group open in Browser A, second user ready  
**Steps:**
1. Browser A: Observe member list (e.g., 2 users)
2. Browser B (new user): Join same group
3. Browser A: Wait 5-7 seconds

**Expected:**
- Member list in Browser A updates to 3 users
- New member avatar appears
- ✅ *Should pass*

**Notes:** Tests member list polling sync.

---

### Edge Cases

#### TC-014: Group Full - Can't Join
**Precondition:** Group has 5 members (maxMembers = 5)  
**Steps:**
1. New user clicks "Join Group" on full group

**Expected:**
- Button shows "Group Full" and is disabled
- User cannot join
- System creates new group instead (if using auto-match)
- ✅ *Should pass*

**Notes:** Tests group capacity check.

---

#### TC-015: Empty Group Message
**Precondition:** User in chat, message input focused  
**Steps:**
1. Leave message input empty
2. Click "Send"

**Expected:**
- Nothing happens (button disabled or no-op)
- No error message shown
- ✅ *Should pass*

**Notes:** Tests empty message validation.

---

#### TC-016: Leave and Rejoin Same Group
**Precondition:** User in study group  
**Steps:**
1. User clicks "← Back to Groups"
2. User rejoins same group

**Expected:**
- User is still a member (no explicit leave endpoint)
- Same messages visible
- User appears once in member list
- ✅ *Should pass*

**Notes:** Tests that "back" doesn't delete membership.

---

#### TC-017: Rapid Message Sending
**Precondition:** User in chat  
**Steps:**
1. Send message 1
2. Send message 2
3. Send message 3 (rapid, < 1 second apart)

**Expected:**
- All three messages saved
- All appear in order
- No duplicates
- ✅ *Should pass*

**Notes:** Tests concurrent message handling.

---

### Database & Persistence

#### TC-018: Messages Persist Across Sessions
**Precondition:** User sends messages in group, closes browser  
**Steps:**
1. User sends: "Hello group"
2. Close browser tab
3. Re-open same video
4. Click "👥 Groups" tab
5. Join same group again

**Expected:**
- Old message "Hello group" still visible
- New messages (if any from other users) also visible
- ✅ *Should pass*

**Notes:** Tests message persistence in database.

---

#### TC-019: User Can't Send After Leaving Video
**Precondition:** User in study group  
**Steps:**
1. User navigates away from watch page
2. Returns to watch page for different video
3. Manually tries to POST to previous group's messages endpoint

**Expected:**
- User is not a member of that group (different contentId)
- 403 Forbidden response
- ✅ *Should pass*

**Notes:** Tests membership validation on message POST.

---

## API Test Cases

### Test via curl or Postman

#### API-001: GET /api/study-groups?contentId=1
```bash
curl "http://localhost:3000/api/study-groups?contentId=1"
```
**Expected:** 200, groups array (empty if no groups)

---

#### API-002: POST /api/study-groups/find-or-create (New User)
```bash
curl -X POST "http://localhost:3000/api/study-groups/find-or-create" \
  -H "Content-Type: application/json" \
  -b "auth=<JWT>" \
  -d '{
    "contentId": 1,
    "skillLevel": "intermediate",
    "quizScore": 75
  }'
```
**Expected:** 200, `{ "success": true, "data": { "groupId": 201, "isNewGroup": true, ... } }`

---

#### API-003: POST /api/study-groups/find-or-create (Existing Member)
```bash
curl -X POST "http://localhost:3000/api/study-groups/find-or-create" \
  -H "Content-Type: application/json" \
  -b "auth=<JWT>" \
  -d '{ "contentId": 1, "skillLevel": "intermediate", "quizScore": 75 }'
```
**Expected:** 200, `{ "success": true, "data": { "groupId": 201, "isNewGroup": false, ... } }`  
(Same groupId as before)

---

#### API-004: GET /api/study-groups/[groupId]
```bash
curl "http://localhost:3000/api/study-groups/201" \
  -b "auth=<JWT>"
```
**Expected:** 200, group object with members array + messages array (last 100)

---

#### API-005: POST /api/study-groups/[groupId]/messages
```bash
curl -X POST "http://localhost:3000/api/study-groups/201/messages" \
  -H "Content-Type: application/json" \
  -b "auth=<JWT>" \
  -d '{ "message": "Help! I don'\''t understand decorators" }'
```
**Expected:** 200, `{ "success": true, "data": { "message": {...}, "aiResponse": "..." } }`

---

#### API-006: POST /api/study-groups/[groupId]/messages/[messageId]/helpful
```bash
curl -X POST "http://localhost:3000/api/study-groups/201/messages/5001/helpful" \
  -b "auth=<JWT>"
```
**Expected:** 200, updated message object with `helpfulCount` incremented

---

## What to Add (Future Enhancements)

### High Priority

1. **Leave Group Endpoint**
   - `DELETE /api/study-groups/[groupId]/members/[userId]`
   - Removes user from group, hides group from their list
   - Deletes group if no members left

2. **Group Admin & Moderation**
   - First user to create group becomes admin
   - Admin can kick users, delete messages, configure group settings
   - UI: Admin panel in group header

3. **Pagination for Messages**
   - Current: Last 100 messages only
   - Add: `?limit=50&offset=0` query params to messages endpoint
   - Component: "Load earlier messages" button

4. **Skill Level Input in UI**
   - Current: Hardcoded "intermediate" + 0 quiz score
   - Add: Small form in StudyGroupPanel to select skill level and input quiz score
   - Better matching accuracy

### Medium Priority

5. **WebSocket for Real-Time Chat**
   - Replace 5-second polling with WebSocket
   - Instant message delivery
   - Use Socket.io or similar

6. **Study Group Analytics**
   - /api/study-groups/[groupId]/analytics
   - Most helpful members, message count, activity heatmap
   - Admin dashboard to view stats

7. **Group Description & Rules**
   - Let creators add description + house rules
   - Display in group header
   - Enforce moderation rules

8. **Scheduled Group Sessions**
   - "Join at 2 PM tomorrow" — group scheduled for specific time
   - Calendar integration
   - Notifications

### Nice-to-Have

9. **File & Image Sharing**
   - Upload code snippets, diagrams, photos
   - Store in S3, display inline
   - /api/study-groups/[groupId]/attachments

10. **Direct Messaging Between Peers**
    - Private 1-on-1 chat
    - Separate from group chat
    - /api/messages/[userId]/[targetUserId]

11. **Study Group Templates**
    - "Coding Study" (code review focus)
    - "Discussion" (debate focus)
    - "Q&A" (question/answer focus)
    - Different UI layouts per template

12. **Mobile PWA Push Notifications**
    - Notify user when AI responds, peer replies, etc.
    - Use service worker + Web Push API
    - Respect user preferences

---

## Testing Tools & Setup

### Prerequisites
```bash
# Ensure dev server is running
npm run dev

# Ensure database migrations applied
npx prisma migrate dev --name add_study_groups

# Create test user accounts (or use existing)
# Make sure you have a JWT token to use in requests
```

### Manual Testing
- Open http://localhost:3000 in two browsers side-by-side
- Use Different videos/users to test various scenarios
- Use browser DevTools Network tab to observe API calls and polling frequency

### Automated Testing (Future)
- Unit tests for embedding/distance functions
- Integration tests for API routes (jest + supertest)
- E2E tests for user flows (Playwright/Cypress)

---

## Known Limitations (MVP)

1. ⚠️ **No persistent auth context in components** — StudyGroupPanel fetches `/api/auth/me` on mount. For better perf, pass `currentUserId` from parent.

2. ⚠️ **Polling every 5 seconds** — Not ideal for 100+ concurrent users. Upgrade to WebSocket for scale.

3. ⚠️ **AI responses are always non-streaming** — 1-2 second delay. Consider streaming for better UX.

4. ⚠️ **No message editing or deletion** — Users can't fix typos.

5. ⚠️ **No group admin features** — Anyone can join, no moderation.

6. ⚠️ **Embedding is 2D** — Very simple similarity. Could use multi-dimensional embeddings for better matching.

---

## Success Criteria

✅ **Feature is production-ready when:**
- All TC-001 through TC-018 pass
- API endpoints respond with correct status codes
- Messages persist to database
- AI responds within 2 seconds
- Polling syncs messages across browsers
- No memory leaks on long polling
- Mobile responsive layout works

✅ **Feature is scalable when:**
- WebSocket upgrade implemented
- Message pagination added
- 100+ concurrent users tested
- Database indexed for fast queries

---

## Checklist for Go-Live

- [ ] Prisma migration applied to production database
- [ ] API routes deployed to production
- [ ] React components bundled and deployed
- [ ] WatchPageClient.jsx updated in production
- [ ] All manual test cases passed (TC-001 to TC-018)
- [ ] API test cases passed
- [ ] Performance tested (polling frequency, message latency)
- [ ] Moderation works (toxicity detection)
- [ ] Mobile layout tested
- [ ] Error handling tested (offline, network failure, server error)
- [ ] User authentication verified
- [ ] Database backups configured
- [ ] Monitoring/logging set up for API errors

---

## Summary

Study Groups are **feature-complete for MVP** with:
- ✅ Group creation & auto-matching
- ✅ Real-time peer chat (polling)
- ✅ AI tutor responses
- ✅ Message moderation
- ✅ Helpful voting
- ✅ Database persistence

**Next:** Run the migration, execute manual test cases, then gather user feedback on the feature before prioritizing enhancements from the "What to Add" section.
