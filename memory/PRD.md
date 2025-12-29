# Ember Dating App - Product Requirements Document

## Original Problem Statement
Build a fully functioning dating app with a similar style of Hinge. The name of the app is called "Ember" and the font should be in Orbitron. But the rest of the app font should be in Manrope.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with MongoDB
- **Authentication**: JWT-based + Emergent Google OAuth
- **AI Integration**: OpenAI GPT-4o-mini for match suggestions and conversation starters

## User Personas
1. **Primary Users**: Singles (18-45) seeking meaningful relationships
2. **Power Users**: Active daters who engage daily with likes and messages
3. **Casual Users**: Occasional browsers who check matches periodically

## Core Requirements (Static)
1. User authentication (email/password + Google OAuth)
2. Profile creation with photos, prompts, and interests
3. Discover feed with profile cards
4. Like/comment on specific profile sections (Hinge-style)
5. Match system (mutual likes create matches)
6. Real-time messaging between matches
7. AI-powered features (most compatible, conversation starters)
8. Video calling capability (infrastructure ready)

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

### Backend Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - JWT login
- POST /api/auth/google/session - Google OAuth
- GET /api/auth/me - Current user
- PUT /api/profile - Update profile
- GET /api/discover - Get profiles to discover
- GET /api/discover/most-compatible - AI-ranked matches
- POST /api/likes - Send like
- GET /api/likes/received - Get received likes
- GET /api/matches - Get all matches
- GET/POST /api/messages/{match_id} - Messaging
- POST /api/ai/conversation-starters/{user_id} - AI starters
- GET /api/prompts/library - Available prompts

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] WebRTC video/voice calling implementation
- [ ] Push notifications for new matches/messages
- [ ] Real-time messaging with WebSockets

### P1 - High Priority
- [ ] Photo upload to cloud storage (currently URL-based)
- [ ] Video profile recording/upload
- [ ] Block/report user functionality
- [ ] Read receipts in messages
- [ ] Typing indicators

### P2 - Medium Priority
- [ ] Location-based matching with distance filters
- [ ] Advanced filters (age, interests)
- [ ] Profile verification (photo verification)
- [ ] Super likes / roses (premium feature)
- [ ] Undo last pass

### P3 - Nice to Have
- [ ] Date planning features
- [ ] Spotify/Instagram integration
- [ ] Daily picks
- [ ] Standouts feature
- [ ] Analytics dashboard

## Next Tasks
1. Implement WebRTC for video/voice calling
2. Add WebSocket for real-time messaging
3. Implement photo upload to cloud storage
4. Add push notifications
5. Add block/report functionality
