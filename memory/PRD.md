# Ember Dating App - Product Requirements Document

## Original Problem Statement
Build a fully functioning dating app with a similar style of Hinge. The name of the app is called "Ember" and the font should be in Orbitron. But the rest of the app font should be in Manrope.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based + Emergent Google OAuth
- **AI Integration**: OpenAI GPT-4o-mini for match suggestions and conversation starters
- **Real-time**: WebSocket for messaging and notifications
- **Calling**: WebRTC infrastructure for video/voice calls

## User Personas
1. **Primary Users**: Singles (18-45) seeking meaningful relationships
2. **Power Users**: Active daters who engage daily with likes and messages
3. **Premium Users**: Users who pay for enhanced features

## Core Requirements (Static)
1. User authentication (email/password + Google OAuth)
2. Profile creation with photos, prompts, and interests
3. Discover feed with profile cards
4. Like/comment on specific profile sections (Hinge-style)
5. Match system (mutual likes create matches)
6. Real-time messaging between matches
7. AI-powered features (most compatible, conversation starters)
8. Video/voice calling
9. Premium subscription model

## What's Been Implemented (December 2024)

### MVP Features ✅
- [x] Landing page with Orbitron/Manrope fonts, ember color scheme
- [x] User registration and login (JWT auth)
- [x] Google OAuth integration (Emergent Auth)
- [x] Profile setup wizard (basics, photos, prompts, interests)
- [x] Discover feed with profile cards
- [x] Like functionality with comments on specific sections
- [x] Match system (mutual likes)
- [x] Messaging system
- [x] AI-powered "Most Compatible" suggestions
- [x] AI conversation starters
- [x] Profile editing
- [x] Bottom navigation
- [x] Responsive design

### Phase 2 Features ✅ (Implemented)
- [x] **WebSocket Real-time Messaging** - Live message delivery without polling
- [x] **Typing Indicators** - See when match is typing
- [x] **WebRTC Video/Voice Calling** - In-app calling with signaling server
- [x] **Incoming Call UI** - Answer/reject incoming calls
- [x] **Photo Upload** - Base64 photo upload to server
- [x] **Premium Subscription System**
  - Weekly ($9.99), Monthly ($29.99), Yearly ($149.99) plans
  - Unlimited likes for premium users
  - Priority likes
  - Profile boost
- [x] **Super Likes** - 3x more likely to match (blue star button)
- [x] **Roses** - Stand out to someone special (🌹 button)
- [x] **Standouts Page** - AI-curated exceptional profiles
- [x] **Notifications System** - Real-time push notifications via WebSocket
- [x] **Premium Purchase Flow** (mocked payment)

### Backend Endpoints
#### Auth
- POST /api/auth/register - User registration
- POST /api/auth/login - JWT login
- POST /api/auth/google/session - Google OAuth
- GET /api/auth/me - Current user
- POST /api/auth/logout - Logout

#### Profile
- PUT /api/profile - Update profile
- GET /api/profile/{user_id} - Get profile
- PUT /api/profile/notifications - Update notification settings

#### Discovery
- GET /api/discover - Get profiles to discover
- GET /api/discover/most-compatible - AI-ranked matches
- GET /api/discover/standouts - AI-curated standouts

#### Likes & Matches
- POST /api/likes - Send like (regular, super_like, rose)
- GET /api/likes/received - Get received likes
- DELETE /api/likes/{like_id} - Reject like
- GET /api/matches - Get all matches
- DELETE /api/matches/{match_id} - Unmatch

#### Messaging
- GET /api/messages/{match_id} - Get messages
- POST /api/messages - Send message

#### AI
- POST /api/ai/conversation-starters - Get generic starters
- POST /api/ai/conversation-starters/{user_id} - Get personalized starters

#### Premium
- GET /api/premium/plans - Get subscription plans
- POST /api/premium/purchase - Purchase premium
- POST /api/premium/purchase-roses - Buy roses
- POST /api/premium/purchase-super-likes - Buy super likes

#### Calling
- POST /api/calls/initiate - Start a call
- POST /api/calls/{call_id}/answer - Answer call
- POST /api/calls/{call_id}/reject - Reject call
- POST /api/calls/{call_id}/end - End call
- POST /api/calls/{call_id}/signal - WebRTC signaling

#### Notifications
- GET /api/notifications - Get notifications
- PUT /api/notifications/read - Mark as read
- GET /api/notifications/unread-count - Unread count

#### Uploads
- POST /api/upload/photo - Upload photo file
- POST /api/upload/photo/base64 - Upload base64 photo

#### WebSocket
- WS /ws/{token} - Real-time messaging & notifications

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Stripe payment integration for real payments
- [ ] Push notifications (browser/mobile)
- [ ] TURN server for WebRTC reliability

### P1 - High Priority
- [ ] Cloud storage for photos (S3/Cloudinary)
- [ ] Video profile recording
- [ ] Block/report user functionality
- [ ] Read receipts in messages
- [ ] Profile verification (photo verification)

### P2 - Medium Priority
- [ ] Location-based matching with distance filters
- [ ] Advanced filters (age, interests)
- [ ] Undo last pass
- [ ] Daily picks feature
- [ ] Date planning features

### P3 - Nice to Have
- [ ] Spotify/Instagram integration
- [ ] Analytics dashboard
- [ ] A/B testing for match algorithms
- [ ] Machine learning for better compatibility

## Technical Notes
- Premium purchases are currently MOCKED (no real payment processing)
- Video calling uses STUN servers only (may need TURN for reliability)
- Photos stored locally on server (should move to cloud storage)
- WebSocket requires valid JWT token for authentication
