# Ember Dating App - Product Requirements Document

## Original Problem Statement
Build a fully functioning dating app with a similar style of Hinge. The name of the app is called "Ember" and the font should be in Orbitron. But the rest of the app font should be in Manrope.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based + Emergent Google OAuth
- **AI Integration**: OpenAI GPT-4o-mini for match suggestions and conversation starters
- **Real-time**: WebSocket for messaging and notifications
- **Calling**: WebRTC with STUN + TURN servers for reliable video/voice calls
- **Payments**: Stripe Checkout for premium subscriptions

## User Personas
1. **Primary Users**: Singles (18-45) seeking meaningful relationships
2. **Power Users**: Active daters who engage daily with likes and messages
3. **Premium Users**: Users who pay for enhanced features
4. **Global Users**: Users who travel or want to match in different locations

## Core Requirements (Static)
1. User authentication (email/password + Google OAuth)
2. Profile creation with photos, prompts, and interests
3. Discover feed with profile cards
4. Like/comment on specific profile sections (Hinge-style)
5. Match system (mutual likes create matches)
6. Real-time messaging between matches
7. AI-powered features (most compatible, conversation starters)
8. Video/voice calling with TURN server support
9. Premium subscription model with Stripe
10. Location change feature (city, state, country)

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

### Phase 2 Features ✅
- [x] **WebSocket Real-time Messaging** - Live message delivery without polling
- [x] **Typing Indicators** - See when match is typing
- [x] **WebRTC Video/Voice Calling** - In-app calling with signaling server
- [x] **Incoming Call UI** - Answer/reject incoming calls
- [x] **Photo Upload** - Base64 photo upload to server
- [x] **Premium Subscription System** (Weekly/Monthly/Yearly)
- [x] **Super Likes** - 3x more likely to match (blue star button)
- [x] **Roses** - Stand out to someone special (🌹 button)
- [x] **Standouts Page** - AI-curated exceptional profiles
- [x] **Notifications System** - Real-time push notifications via WebSocket

### Phase 3 Features ✅ (Just Implemented)
- [x] **Stripe Payment Integration** - Real payment processing
  - Checkout session creation with server-side pricing
  - Payment status polling and webhook support
  - Automatic premium/addon application on payment success
  - Payment success/failure pages
- [x] **TURN Server Support** - Reliable video calling
  - STUN servers (Google)
  - TURN servers (openrelay.metered.ca) for NAT traversal
  - ICE servers endpoint for dynamic configuration
- [x] **Location Change Feature** - Change location anytime
  - PUT /api/profile/location endpoint
  - LocationPicker modal component
  - 20+ popular cities for quick selection
  - Custom city/state/country input
  - Location details stored (city, state, country, coordinates)

### Backend Endpoints

#### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google/session
- GET /api/auth/me
- POST /api/auth/logout

#### Profile
- PUT /api/profile
- GET /api/profile/{user_id}
- PUT /api/profile/notifications
- PUT /api/profile/location - **NEW**

#### Location
- GET /api/locations/popular - **NEW**

#### Discovery
- GET /api/discover
- GET /api/discover/most-compatible
- GET /api/discover/standouts

#### Likes & Matches
- POST /api/likes
- GET /api/likes/received
- DELETE /api/likes/{like_id}
- GET /api/matches
- DELETE /api/matches/{match_id}

#### Messaging
- GET /api/messages/{match_id}
- POST /api/messages

#### AI
- POST /api/ai/conversation-starters
- POST /api/ai/conversation-starters/{user_id}

#### Premium & Payments
- GET /api/premium/plans
- POST /api/payments/checkout - **NEW (Stripe)**
- GET /api/payments/status/{session_id} - **NEW**
- POST /api/webhook/stripe - **NEW**

#### Calling
- GET /api/calls/ice-servers - **NEW (TURN)**
- POST /api/calls/initiate
- POST /api/calls/{call_id}/answer
- POST /api/calls/{call_id}/reject
- POST /api/calls/{call_id}/end
- POST /api/calls/{call_id}/signal

#### Uploads
- POST /api/upload/photo
- POST /api/upload/photo/base64

#### Notifications
- GET /api/notifications
- PUT /api/notifications/read
- GET /api/notifications/unread-count

#### WebSocket
- WS /ws/{token}

## Technical Configuration

### Stripe (Production Setup Required)
```
STRIPE_API_KEY=sk_live_***REDACTED*** (or sk_test_***REDACTED*** for testing)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### TURN Servers (Current Config)
Using free openrelay.metered.ca servers. For production, consider:
- Twilio TURN
- Xirsys
- Self-hosted coturn

## Prioritized Backlog

### P0 - Production Ready
- [ ] Configure production Stripe API keys
- [ ] Set up Stripe webhooks
- [ ] Configure paid TURN server (Twilio/Xirsys)
- [ ] Cloud storage for photos (S3/Cloudinary)

### P1 - High Priority
- [ ] Location-based matching with distance filters
- [ ] Block/report user functionality
- [ ] Read receipts in messages
- [ ] Profile verification
- [ ] Push notifications (browser/mobile)

### P2 - Medium Priority
- [ ] Advanced filters (age, interests)
- [ ] Undo last pass
- [ ] Daily picks feature
- [ ] Date planning features

### P3 - Nice to Have
- [ ] Spotify/Instagram integration
- [ ] Analytics dashboard
- [ ] A/B testing for match algorithms
