# Ember Dating App - Complete Feature Implementation Plan

## Overview
Implementing P1, P2, P3 features + major improvements with new business rules.

---

## 🎯 PHASE 1 - Core Business Rules & Security (PRIORITY)
**Timeline: Start immediately**
**External APIs Needed: Twilio (SMS), Cloudinary (already integrated)**

### 1.1 Profile Verification System ⭐ CRITICAL
**Backend:**
- Add verification fields to user schema:
  - `verification_status`: "unverified" | "pending" | "verified"
  - `verification_methods`: Array of completed methods
  - `photo_verification`: {status, selfie_url, verified_at}
  - `phone_verification`: {status, phone, verified_at, code, expires_at}
  - `id_verification`: {status, id_photo_url, verified_at}
- Create endpoints:
  - POST `/api/verification/photo` - Upload selfie with pose
  - POST `/api/verification/phone/send` - Send SMS code
  - POST `/api/verification/phone/verify` - Verify SMS code
  - POST `/api/verification/id` - Upload ID document
  - GET `/api/verification/status` - Check current verification status
- Add middleware to block unverified users from main app features

**Frontend:**
- Create VerificationGate component (blocks app access)
- VerificationWizard with 3 steps:
  - Photo verification (selfie capture + pose matching)
  - Phone verification (SMS input)
  - ID verification (document upload)
- Show progress (at least 1 of 3 required)
- Success screen after verification

**Business Rule:** Users cannot access discover, matches, messages until verified

---

### 1.2 Daily Swipe Limit System
**Backend:**
- Add to user schema:
  - `swipe_limit`: {count: 0, last_reset: Date, daily_max: 10}
  - `super_like_limit`: {count: 0, last_reset: Date, daily_max: 3}
  - `rose_limit`: {count: 0, last_reset: Date, daily_max: 1}
- Create middleware to check limits before actions
- Reset counters every 24 hours
- Premium users: unlimited swipes
- Endpoints:
  - GET `/api/limits/swipes` - Get remaining swipes
  - POST `/api/discover/pass` - Count left swipe toward limit

**Frontend:**
- Show swipe counter in discover feed
- "Out of swipes" modal with premium upsell
- Different counters for swipes, super likes, roses
- Visual indicators (e.g., "3/10 swipes left today")

**Business Rule:** 
- Free users: 10 swipes/day (includes passes and likes)
- Super likes: 3/day separate counter
- Roses: 1/day separate counter
- Premium: Unlimited

---

### 1.3 Auto-Disconnect Matches
**Backend:**
- Add to matches schema:
  - `first_message_sent`: boolean
  - `matched_at`: Date
  - `disconnect_warnings_sent`: Array of timestamps
- Background job (runs every hour):
  - Find matches with no messages
  - Send warning at 3h mark
  - Send warning at 6h mark
  - Auto-disconnect at 12h
- POST `/api/matches/disconnect-expired` - Manual trigger for testing
- Store disconnected matches in `disconnected_matches` collection (prevent rematch)

**Frontend:**
- Warning notifications at 3h and 6h
- "Match expired" UI when disconnected
- Message: "You can find them again in Discover, but both must like each other again"

**Business Rule:**
- 12 hours after match with no messages = auto-disconnect
- Warnings at 3h and 6h
- Cannot rematch (must both like again if they reappear in discover)

---

### 1.4 Block/Report User Functionality
**Backend:**
- Create `blocks` collection: {blocker_id, blocked_id, created_at}
- Create `reports` collection: {reporter_id, reported_id, reason, details, created_at, status}
- Endpoints:
  - POST `/api/users/block` - Block user
  - GET `/api/users/blocked` - Get blocked list
  - POST `/api/users/unblock` - Unblock user
  - POST `/api/users/report` - Report user
- Filter blocked users from discover, matches, messages

**Frontend:**
- Block/Report options in profile menu
- Report reasons: Inappropriate content, Harassment, Fake profile, Scam, Other
- Confirmation dialogs
- Blocked users list in settings

---

### 1.5 Read Receipts in Messages
**Backend:**
- Add to messages schema:
  - `read_at`: Date | null
  - `delivered_at`: Date
- WebSocket event: "message_read"
- PUT `/api/messages/{message_id}/read` - Mark as read

**Frontend:**
- Double checkmark icons (delivered vs read)
- Gray checkmark = delivered
- Blue checkmark = read
- Auto-mark as read when chat is opened
- Show read status below message

---

## 🚀 PHASE 2 - Enhanced Matching & Discovery
**Timeline: After Phase 1**
**External APIs Needed: None**

### 2.1 Location-Based Matching with Distance
**Backend:**
- Add geospatial indexing to users collection
- Add `max_distance` to user preferences (default: 50 miles)
- Modify `/api/discover` to filter by distance
- Calculate distance using MongoDB $geoNear
- Add endpoint: PUT `/api/preferences/distance` - Set max distance

**Frontend:**
- Distance filter slider in settings (1-100 miles)
- Show distance on profile cards (e.g., "3 miles away")
- LocationPicker already exists (from Phase 3)

---

### 2.2 Advanced Filters
**Backend:**
- Add to user preferences:
  - `age_range`: {min, max}
  - `height_range`: {min, max}
  - `education_level`: Array
  - `interests`: Array
- Endpoint: PUT `/api/preferences/filters`
- Modify discover endpoint to apply all filters

**Frontend:**
- Filters modal in discover page
- Sliders for age and height
- Multi-select for education and interests
- "Apply Filters" button
- Show active filter count badge

---

### 2.3 Undo Last Pass (Rewind)
**Backend:**
- Add to user schema:
  - `last_passed_user_id`: string
  - `last_passed_at`: Date
- Store last pass for 1 hour
- POST `/api/discover/undo` - Undo last pass
- Return undone profile to discover feed

**Frontend:**
- Rewind button (circular arrow icon)
- Show only if last pass was <1 hour ago
- Animate profile card returning
- Success toast: "Profile brought back!"

---

### 2.4 Daily Picks (AI-Curated)
**Backend:**
- Create `daily_picks` collection: {user_id, picked_users: Array, date, generated_at}
- Generate 10 picks daily using AI:
  - Compatibility score based on interests, location, activity
  - Use OpenAI to analyze profile compatibility
- Endpoint: GET `/api/discover/daily-picks`
- Regenerate at midnight

**Frontend:**
- "Daily Picks" tab in discover
- Special badge/crown icon
- Swipeable cards
- "Check back tomorrow" when exhausted

---

### 2.5 Premium: See Who Liked You & Sent Roses
**Backend:**
- Modify GET `/api/likes/received` to include user details for premium users
- Add endpoint: GET `/api/likes/roses-received` - Get roses sent to you
- Check premium status before returning detailed data

**Frontend:**
- "Likes You" tab (premium only)
- Grid of profile cards who liked you
- "Roses" tab showing who sent roses
- Premium upsell modal for free users
- Click profile to match instantly

---

## 🎨 PHASE 3 - Profile & UX Improvements
**Timeline: After Phase 2**
**External APIs Needed: None**

### 3.1 Photo Reordering (Drag & Drop)
**Backend:**
- Photos array already exists
- PUT `/api/profile/photos/reorder` - Update photo order

**Frontend:**
- Drag and drop interface in profile edit
- Visual indicators for dragging
- Save order on drop
- Update profile immediately

---

### 3.2 Delete Account
**Backend:**
- POST `/api/account/delete` - Soft delete
- Mark account as deleted, remove from discovery
- Keep data for 30 days (recovery period)
- Background job to permanently delete after 30 days

**Frontend:**
- "Delete Account" in settings
- Confirmation modal with password
- Warning about data loss
- 30-day recovery notice

---

### 3.3 Edit/Delete Messages
**Backend:**
- Add to messages schema:
  - `edited_at`: Date | null
  - `deleted_at`: Date | null
- PUT `/api/messages/{message_id}` - Edit message
- DELETE `/api/messages/{message_id}` - Delete message
- WebSocket events for real-time updates

**Frontend:**
- Long-press message for options menu
- Edit: Show input with current text
- Delete: "Message deleted" placeholder
- Show "edited" indicator

---

### 3.4 Video Profile Loops
**Backend:**
- Add `video_profile_url` to user schema
- POST `/api/upload/video-profile` - Upload short video (max 15s)
- Use Cloudinary video upload

**Frontend:**
- Video upload in profile setup
- 15-second recording/upload limit
- Auto-play on profile view (muted, looping)
- Video player controls

---

### 3.5 Icebreaker Games
**Backend:**
- Create `icebreakers` collection with questions/games
- Example games:
  - "Two Truths and a Lie"
  - "This or That"
  - "Would You Rather"
- Endpoints:
  - GET `/api/icebreakers/random` - Get random game
  - POST `/api/matches/{match_id}/icebreaker` - Send game invite

**Frontend:**
- "Play a game" button in chat
- Game UI overlays
- Share results in chat
- Fun animations

---

## 🌐 PHASE 4 - External Integrations (Requires API Credentials)
**Timeline: After Phase 3, when credentials are ready**

### 4.1 Restaurant & Date Ideas (Google Places + Yelp)
**Requirements:**
- Google Places API key
- Yelp Fusion API key

**Backend:**
- Integration with both APIs
- Endpoints:
  - GET `/api/dates/restaurants` - Get nearby restaurants
  - GET `/api/dates/ideas` - Get date ideas by category
  - GET `/api/dates/recommendations/{match_id}` - Personalized suggestions
- Cache results for performance

**Frontend:**
- "Plan a Date" section in match profile
- Restaurant cards with photos, ratings, distance
- Date idea categories (dinner, coffee, activities, etc.)
- Share date plan in chat

---

### 4.2 Spotify Integration
**Requirements:**
- Spotify Developer App credentials
- OAuth flow setup

**Backend:**
- Spotify OAuth integration
- Store: top artists, genres, favorite songs
- Calculate music taste match percentage
- Endpoints:
  - GET `/api/integrations/spotify/auth` - Start OAuth
  - POST `/api/integrations/spotify/callback` - Handle callback
  - GET `/api/profile/{user_id}/music-match` - Get compatibility

**Frontend:**
- "Connect Spotify" button in profile
- Display top artists (3-5)
- Music match percentage badge
- Genre tags

---

### 4.3 Instagram Integration
**Requirements:**
- Instagram Basic Display API credentials

**Backend:**
- Instagram OAuth integration
- Fetch 9 recent photos
- Store Instagram username and photo URLs
- Endpoints:
  - GET `/api/integrations/instagram/auth`
  - POST `/api/integrations/instagram/callback`

**Frontend:**
- "Connect Instagram" button
- 3x3 grid of recent photos
- Instagram username display
- Link to Instagram profile

---

### 4.4 Firebase Cloud Messaging (Push Notifications)
**Requirements:**
- Firebase project setup
- FCM server key

**Backend:**
- Firebase Admin SDK integration
- Store FCM tokens per user
- Send push notifications for:
  - New matches
  - New messages
  - Match expiring soon (3h, 6h warnings)
  - Daily picks ready
- Endpoint: POST `/api/notifications/register-token`

**Frontend:**
- Request notification permission
- Register FCM token
- Handle incoming notifications
- Notification settings page

---

### 4.5 Virtual Date Features
**Backend:**
- Watch together: Synchronized video player
- Games: Integration with online games
- Endpoints for session management

**Frontend:**
- "Virtual Date" button in match profile
- Video sync player
- Game embeds
- Shared activities

---

## 📊 Implementation Summary

**Total Features:** 20+
**Estimated Development Time:** 
- Phase 1: 8-12 hours (most critical)
- Phase 2: 6-8 hours
- Phase 3: 6-8 hours
- Phase 4: 8-10 hours (plus external API setup)

**Testing Strategy:**
- Test each feature incrementally
- Use testing agent after each phase
- Validate business rules thoroughly

**Priority Order:**
1. Phase 1 (Verification, limits, auto-disconnect) - CRITICAL
2. Phase 2 (Enhanced matching)
3. Phase 3 (UX improvements)
4. Phase 4 (External integrations - when ready)

---

## 🔄 Next Steps
1. Start with Phase 1 implementation
2. Test thoroughly after each major feature
3. Get user credentials for Phase 4 when ready
4. Deploy incrementally
