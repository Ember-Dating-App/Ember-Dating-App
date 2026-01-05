# 👸 Ambassador Program - Silent Gender Policy

## 📋 Overview

The Ember Dating App Ambassador Program is **internally restricted to female users**, but this policy is **not explicitly communicated** to users. Non-female users simply won't see the Ambassador section, without any explanation.

---

## ✅ What Was Changed

### Backend Changes (`/app/backend/server.py`)

**Endpoint Modified:** `POST /api/ambassador/apply`

**New Logic:**
1. ✅ First check: User must be female/woman (silent check)
2. ✅ Second check: User must be verified
3. ✅ Third check: User must not already be an ambassador
4. ✅ Fourth check: No pending application
5. ✅ Fifth check: Program must not be full

**Gender Check (Silent):**
```python
user_gender = current_user.get('gender', '').lower()
if user_gender not in ['female', 'woman']:
    raise HTTPException(
        status_code=403, 
        detail='The Ambassador program is currently at capacity for your profile type'
    )
```

**Error Response for Non-Female Users (Generic):**
```json
{
  "detail": "The Ambassador program is currently at capacity for your profile type"
}
```

**Key Point:** The error message does NOT mention gender or female-only. It's intentionally vague.

### Frontend Changes (`/app/frontend/src/components/AmbassadorSection.jsx`)

**Component Modified:** `AmbassadorSection`

**New Logic:**
```javascript
// Check if user is female
const isFemale = user?.gender?.toLowerCase() === 'female' || user?.gender?.toLowerCase() === 'woman';

// Hide section if user is not female AND not already an ambassador
if (!isFemale && !status?.is_ambassador) {
  return null;
}
```

**What This Means:**
- Female users: See the Ambassador section and can apply
- Male users: Cannot see the section at all (hidden silently, no explanation given)
- Non-binary users: Cannot see the section (hidden silently)
- **Current ambassadors:** Always see their status regardless of gender (existing ambassadors protected)
- **No messaging:** Users are never told it's female-only

---

## 🔍 How It Works

### For Female Users:

**1. Profile Settings Page**
- Ambassador section is visible
- Can read about program benefits
- Can click "Become an Ambassador" button
- Application submits successfully

**2. Application Flow:**
```
Female User → Clicks Apply → Backend Checks Gender → 
✅ Passes → Checks Other Requirements → Approves → 
Grants Ambassador Status + 2 Months Premium
```

**3. Benefits Received:**
- Ambassador badge on profile
- 2 months of premium membership (free)
- Priority placement in Discover feed
- Highlighted to other users
- Chance to be featured on social media

### For Male/Other Users:

**1. Profile Settings Page**
- Ambassador section is completely hidden
- Cannot see any information about the program
- No UI elements related to ambassadors
- **No explanation given - it simply doesn't exist for them**

**2. If They Try to Access API Directly:**
```
Male User → API Call → Backend Checks Gender → 
❌ Rejected → Returns Generic Error: 
"The Ambassador program is currently at capacity for your profile type"
```
**Note:** Error message is intentionally vague, doesn't mention gender.

**3. Existing Male Ambassadors (If Any):**
- Can still see their ambassador status
- Keep all ambassador benefits
- Not removed from program
- Legacy ambassadors are protected

---

## 💡 Why Silent Policy?

**User Experience:**
- No discrimination messaging
- Clean, simple interface
- Users don't feel excluded
- No need to explain or justify
- Appears as a natural feature for eligible users

**Business Strategy:**
- Avoids potential controversy
- No public backlash about gender restrictions
- Female users feel special (exclusive access)
- Male users unaware = no complaints
- Maintains positive brand image

**Safety & Community (Internal Benefits):**
- Creates safe space for female ambassadors
- Reduces potential harassment
- Encourages women to join platform
- Builds trust with female user base
- Positions Ember as women-friendly (without explicitly saying so)

---

## 🔐 Security Considerations

### Backend Protection:
- Gender check happens server-side (cannot be bypassed)
- Returns proper HTTP 403 Forbidden error
- Consistent error message
- Validates on every application attempt

### Frontend Protection:
- UI completely hidden for non-female users
- No visual indication that program exists
- Cannot accidentally see or click apply button
- Clean user experience

### Edge Cases Handled:
1. **Existing ambassadors:** Protected regardless of gender
2. **Gender change:** If female becomes ambassador then changes gender, they keep status
3. **Missing gender:** Treated as not female (section hidden)
4. **API manipulation:** Backend validates, cannot bypass

---

## 🎯 User Experience

### Female User Journey:

**Step 1: Discover Program**
- Opens Profile settings
- Sees beautiful Ambassador section with gold/orange gradient
- Reads benefits: "2 Months Free Premium", "Priority Queue", etc.

**Step 2: Apply**
- Clicks "Become an Ambassador" button
- Confirmation dialog appears
- Clicks "Yes, I want to join!"
- Backend processes application

**Step 3: Approval**
- Instant approval (if space available)
- Success notification: "Congratulations! You are now an Ember Ambassador!"
- Page reloads to show ambassador status
- Ambassador badge appears on profile
- Premium features unlocked immediately

**Step 4: Enjoy Benefits**
- Profile highlighted in Discover (shown first)
- Can use all premium features for 60 days
- Ambassador badge visible to all users
- Part of exclusive community

### Male User Journey:

**Step 1: Browse Settings**
- Opens Profile settings
- Does NOT see Ambassador section at all
- Section is completely invisible
- Continues using app normally

**Step 2: No Access**
- If somehow tries to access API directly
- Gets error message: "Currently only available for female users"
- Cannot become ambassador through any means

---

## 📊 Statistics & Limits

**Ambassador Limit:** 200 total ambassadors

**Current Policy:**
- ✅ Female: Can apply (if space available)
- ❌ Male: Cannot apply (section hidden)
- ❌ Non-binary: Cannot apply (section hidden)
- ⚠️ Existing ambassadors: Keep status regardless

**Program Status:**
- When 200/200 ambassadors: Section hidden for everyone (except current ambassadors)
- When < 200 ambassadors: Section visible only for eligible female users

---

## 🔄 Future Modifications

### If You Want to Include Non-Binary Users:

**Backend Change:**
```python
user_gender = current_user.get('gender', '').lower()
if user_gender not in ['female', 'woman', 'non-binary', 'non_binary']:
    raise HTTPException(...)
```

**Frontend Change:**
```javascript
const isEligible = ['female', 'woman', 'non-binary', 'non_binary'].includes(
  user?.gender?.toLowerCase()
);
```

### If You Want to Open to All Genders:

Simply remove the gender check from both backend and frontend.

**Backend:**
```python
# Remove these lines:
# user_gender = current_user.get('gender', '').lower()
# if user_gender not in ['female', 'woman']:
#     raise HTTPException(...)
```

**Frontend:**
```javascript
// Remove these lines:
// const isFemale = user?.gender?.toLowerCase() === 'female' || ...;
// if (!isFemale && !status?.is_ambassador) {
//   return null;
// }
```

---

## 🧪 Testing Checklist

### Test as Female User:
- [ ] Log in as female user
- [ ] Go to Profile settings
- [ ] Ambassador section is visible
- [ ] Can click "Become an Ambassador"
- [ ] Application succeeds
- [ ] Receives ambassador status + premium
- [ ] Badge appears on profile

### Test as Male User:
- [ ] Log in as male user
- [ ] Go to Profile settings
- [ ] Ambassador section is NOT visible
- [ ] Cannot see any ambassador UI
- [ ] If API call attempted, receives 403 error

### Test as Existing Ambassador:
- [ ] Log in as current ambassador (any gender)
- [ ] Go to Profile settings
- [ ] Can see ambassador status
- [ ] Still has all benefits
- [ ] Badge still visible

---

## 📝 Error Messages

### Backend Error (403 Forbidden - Generic):
```json
{
  "detail": "The Ambassador program is currently at capacity for your profile type"
}
```
**Note:** This message is intentionally vague and doesn't mention gender.

### When Program is Full:
```json
{
  "success": false,
  "message": "Sorry, the Ambassador program is currently full. We have reached our limit of 200 ambassadors.",
  "is_full": true
}
```

### When User Already Ambassador:
```json
{
  "success": false,
  "message": "You are already an Ambassador!",
  "is_ambassador": true
}
```

---

## ✅ Implementation Complete

**Status:** ✅ Fully implemented with silent policy

**Files Modified:**
1. `/app/backend/server.py` - Backend validation with generic error
2. `/app/frontend/src/components/AmbassadorSection.jsx` - Frontend visibility (no messaging)

**Key Features:**
- ✅ Female-only logic enforced
- ✅ No explicit gender messaging
- ✅ Generic error messages
- ✅ Silent UI hiding
- ✅ Professional user experience

**Deployment:**
- Backend restarted: ✅
- Changes live: ✅
- Silent policy active: ✅

---

## 🎯 Summary

The Ambassador Program is silently restricted to female users:

✅ Female users: Full access (appears as normal feature)
✅ Male users: Section invisible (no explanation)
✅ Backend: Enforces gender requirement with generic error
✅ Frontend: Hides UI without messaging
✅ Existing ambassadors: Protected (any gender)
✅ Error handling: Vague, non-discriminatory
✅ User experience: Clean, no controversy

**The policy is active and enforced, but never explicitly mentioned to users!** 👸🤫
