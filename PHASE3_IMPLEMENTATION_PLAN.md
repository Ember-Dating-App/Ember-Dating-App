# Phase 3 Implementation Plan

## Overview
Implementing all 5 Phase 3 features for Ember Dating App to enhance user experience and engagement.

---

## Feature 1: Delete Account ✅

### Backend Changes
- **Endpoint**: `DELETE /api/account`
- **Functionality**:
  - Soft delete user account (mark as deleted)
  - Remove from discovery
  - Delete all matches
  - Anonymize messages
  - Optional: Hard delete after 30 days
  
### Frontend Changes
- Add "Delete Account" option in Settings
- Confirmation modal with warnings
- Password verification
- Logout after deletion

### Database Changes
- Add `deleted_at` field to users collection
- Update queries to filter deleted users

---

## Feature 2: Edit/Delete Messages ✅

### Backend Changes
- **Endpoints**:
  - `PUT /api/messages/{message_id}` - Edit message
  - `DELETE /api/messages/{message_id}` - Delete message
- **Business Rules**:
  - Edit within 15 minutes of sending
  - Show "edited" indicator
  - Delete any time (marks as deleted, doesn't remove)
  
### Frontend Changes
- Long-press menu on messages (mobile)
- Right-click menu (desktop)
- Edit modal with character limit
- "Edited" badge on edited messages
- "Message deleted" placeholder

### Database Changes
- Add `edited_at` field to messages
- Add `is_deleted` field to messages
- Store original message for history

---

## Feature 3: Photo Reordering 🎯

### Backend Changes
- **Endpoint**: `PUT /api/profile/photos/reorder`
- Accept array of photo URLs in new order
- Validate all photos belong to user

### Frontend Changes
- Drag & drop functionality using `react-beautiful-dnd` or HTML5 drag API
- Visual feedback during drag
- Save button after reordering
- Works in Profile edit page

### Libraries Needed
- Consider: @dnd-kit/core, @dnd-kit/sortable (modern, lightweight)
- Alternative: react-beautiful-dnd (popular but larger)

---

## Feature 4: Video Profile Loops 🎬

### Backend Changes
- **Endpoint**: `POST /api/upload/video`
- Video upload to Cloudinary
- Video validation (max 30 seconds, max 50MB)
- Generate thumbnail
- Store video URL in user profile

### Frontend Changes
- Video upload in profile setup & edit
- Video player with autoplay on profile cards
- Mute/unmute toggle
- Loop video continuously
- Fallback to photos if no video

### Cloudinary Configuration
- Video transformation: compress, format optimization
- Thumbnail generation
- Max duration: 30 seconds
- Formats: MP4, MOV, WebM

---

## Feature 5: Icebreaker Games 🎮

### Backend Changes
- **Collection**: `icebreaker_sessions`
- **Endpoints**:
  - `POST /api/icebreakers/start` - Start game with match
  - `POST /api/icebreakers/{session_id}/answer` - Submit answer
  - `GET /api/icebreakers/{session_id}` - Get game state
  
### Game Types
1. **Two Truths and a Lie** - Guess the lie
2. **Would You Rather** - Choose between options
3. **Quick Questions** - Rapid-fire Q&A
4. **Emoji Story** - Tell story with emojis

### Frontend Changes
- Icebreaker game button in match chat
- Game UI overlay/modal
- Real-time updates via WebSocket
- Score tracking
- Celebration animations

### Database Schema
```javascript
{
  session_id: uuid,
  match_id: uuid,
  game_type: string,
  started_by: user_id,
  status: 'active' | 'completed',
  questions: [],
  answers: {},
  score: {},
  created_at: datetime
}
```

---

## Implementation Order

1. ✅ **Delete Account** (30 mins)
   - Simple backend + frontend
   - Important for user control

2. ✅ **Edit/Delete Messages** (45 mins)
   - Enhances existing feature
   - High user value

3. ✅ **Photo Reordering** (40 mins)
   - Improves profile management
   - Moderate complexity

4. ✅ **Video Profile Loops** (60 mins)
   - Media enhancement
   - Requires Cloudinary setup

5. ✅ **Icebreaker Games** (90 mins)
   - Most complex feature
   - High engagement value

**Total Estimated Time**: 4-5 hours

---

## Technical Considerations

### Security
- Verify user owns content before edit/delete
- Rate limiting on uploads
- Video scanning for inappropriate content (Cloudinary moderation)

### Performance
- Lazy load videos
- Compress photos/videos
- Cache game questions
- WebSocket for real-time game updates

### UX
- Clear visual feedback for all actions
- Undo options where possible
- Confirmation dialogs for destructive actions
- Loading states for uploads

---

## Testing Strategy

### Unit Tests
- Backend endpoints validation
- Photo reordering logic
- Message edit time limits
- Video upload validation

### Integration Tests
- Full delete account flow
- Message edit/delete in chat
- Video upload and playback
- Icebreaker game complete flow

### Manual Testing
- Test on mobile and desktop
- Verify drag & drop on touch devices
- Video autoplay across browsers
- Real-time game updates

---

## Rollout Plan

1. Implement all features in development
2. Test each feature thoroughly
3. Deploy to staging
4. User acceptance testing
5. Production deployment
6. Monitor analytics and user feedback

---

## Success Metrics

- **Delete Account**: < 2% deletion rate (indicates user satisfaction)
- **Edit/Delete Messages**: Used by 30%+ of active users
- **Photo Reordering**: 60%+ users reorder at least once
- **Video Profiles**: 20%+ users add videos
- **Icebreaker Games**: Played in 40%+ of new matches

---

Let's build! 🚀
