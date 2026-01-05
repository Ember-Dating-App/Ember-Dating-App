# 🎯 New Features Implementation Plan

## Features to Implement

### 1. Ambassador Program Updates ✅
**Requirements:**
- Hide spot count (remove current_count, available_slots from response)
- Hide entire Ambassador section in frontend when is_full = true
- Only ambassadors see their status regardless of full/not full

**Backend Changes:**
- Update `/api/ambassador/info` endpoint to return minimal info
- Remove total_limit, current_count, available_slots from response
- Keep only is_full and benefits

**Frontend Changes:**
- Update Profile.jsx to hide entire Ambassador section when is_full
- Keep Ambassador badge visible for current ambassadors

---

### 2. New User Boost Algorithm ✅
**Requirements:**
- New users (created within 48 hours) appear first in discover feed
- Increases their chances of getting matches quickly

**Backend Changes:**
- Modify `/api/discover` endpoint
- Add sorting logic: New users → Ambassadors → Regular users
- New user definition: created_at within last 48 hours

**Algorithm Priority:**
1. New Users (created < 48h ago) who are Ambassadors
2. New Users (created < 48h ago) who are not Ambassadors  
3. Established Ambassadors
4. Established regular users

---

### 3. GIF Support in Messaging ✅
**Requirements:**
- Add GIF picker in messaging interface
- Use Giphy API (free tier)
- Send GIFs as special message type
- Display GIFs inline in conversation

**Backend Changes:**
- Message schema already supports gif_url field (verify)
- No changes needed if schema supports it

**Frontend Changes:**
- Install @giphy/js-fetch-api
- Create GifPicker component
- Add GIF button to Messages.jsx
- Update message rendering to show GIFs

**Giphy API:**
- API Key: Use free tier (no registration needed for demo)
- Endpoint: https://api.giphy.com/v1/gifs/search

---

### 4. Legal Documents (Privacy Policy & Terms of Service) ✅
**Requirements:**
- Create Privacy Policy page
- Create Terms of Service page (with user's specific content)
- Add links in Settings page
- Premium look and feel
- Easy navigation

**Implementation:**
- Create `/app/frontend/src/pages/PrivacyPolicy.jsx`
- Create `/app/frontend/src/pages/TermsOfService.jsx`
- Add routes in App.js
- Add "Legal" section in Profile.jsx (Settings)
- Link to these pages from Login/Register pages

---

### 5. Support Channel in Settings ✅
**Requirements:**
- Form in Settings for users to contact support
- Categories: Feedback, Complaint, Bug Report, Feature Request, Account Issue, Safety Concern, Other
- Send to: ember.dating.app25@gmail.com (hidden from users)
- Store in database for tracking

**Backend Changes:**
- Create `/api/support/contact` endpoint
- Store support messages in MongoDB
- Send email notification (can be added later)
- Log to console for now

**Frontend Changes:**
- Create SupportForm component
- Add "Support" section in Profile.jsx
- Modal with form (type, subject, message)
- Success/error toast notifications

---

## Implementation Order

1. ✅ Backend: Ambassador info endpoint update
2. ✅ Backend: New user boost in discover algorithm
3. ✅ Backend: Support endpoint
4. ✅ Frontend: GIF support (install dependencies, create component)
5. ✅ Frontend: Legal pages (Privacy Policy, Terms of Service)
6. ✅ Frontend: Update Settings with Legal section and Support form
7. ✅ Frontend: Update Ambassador section visibility logic
8. ✅ Testing: Verify all features work correctly

---

## Code Locations

**Backend:**
- `/app/backend/server.py` - All API endpoints

**Frontend:**
- `/app/frontend/src/pages/Profile.jsx` - Settings page
- `/app/frontend/src/pages/Messages.jsx` - Messaging (add GIF support)
- `/app/frontend/src/pages/PrivacyPolicy.jsx` - NEW
- `/app/frontend/src/pages/TermsOfService.jsx` - NEW
- `/app/frontend/src/components/GifPicker.jsx` - NEW
- `/app/frontend/src/components/SupportForm.jsx` - NEW
- `/app/frontend/src/App.js` - Add routes

---

## Dependencies to Install

**Frontend:**
```bash
cd /app/frontend
yarn add @giphy/js-fetch-api
```

---

## Notes

- All features should maintain the premium dark theme
- Use shadcn UI components for consistency
- Ensure mobile responsiveness
- Add proper error handling
- Use toast notifications for user feedback
