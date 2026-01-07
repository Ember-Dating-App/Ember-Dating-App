# Test Profiles Guide - Ember Dating App

## ✅ Setup Complete

### Your Test Account
- **Email:** testauth@ember.test
- **Password:** TestPass123
- **Profile:** Complete and verified
- **Matches:** 5 active matches ready for testing

---

## 👥 Test Profiles Created (All Female)

### 1. Emma Wilson
- **Email:** emma.test@ember.app
- **Password:** TestPass123
- **Age:** 26
- **Location:** New York, NY
- **Bio:** Adventure seeker 🌍 | Coffee addict ☕ | Dog mom 🐕
- **Interests:** Travel, Hiking, Coffee, Dogs, Food
- **Status:** Profile complete, verified, matched with you

### 2. Sophie Chen
- **Email:** sophie.test@ember.app
- **Password:** TestPass123
- **Age:** 24
- **Location:** San Francisco, CA
- **Bio:** Tech enthusiast 💻 | Yoga lover 🧘‍♀️ | Foodie
- **Interests:** Technology, Yoga, Food, Travel, Photography
- **Status:** Profile complete, verified, matched with you

### 3. Maya Rodriguez
- **Email:** maya.test@ember.app
- **Password:** TestPass123
- **Age:** 28
- **Location:** Los Angeles, CA
- **Bio:** Artist by day 🎨 | Dancer by night 💃 | Beach lover 🌊
- **Interests:** Art, Dancing, Beach, Music, Movies
- **Status:** Profile complete, verified, matched with you

### 4. Isabella Martinez
- **Email:** isabella.test@ember.app
- **Password:** TestPass123
- **Age:** 27
- **Location:** Miami, FL
- **Bio:** Fitness coach 💪 | Marathon runner 🏃‍♀️ | Plant mom 🌱
- **Interests:** Fitness, Running, Cooking, Reading, Wine
- **Status:** Profile complete, verified, matched with you

### 5. Olivia Taylor
- **Email:** olivia.test@ember.app
- **Password:** TestPass123
- **Age:** 25
- **Location:** Austin, TX
- **Bio:** Music lover 🎵 | Bookworm 📚 | Cat person 🐱
- **Interests:** Music, Reading, Movies, Gaming, Travel
- **Status:** Profile complete, verified, matched with you

---

## 🧪 Testing Guide

### Test Voice Messages
1. Login as **testauth@ember.test** (password: TestPass123)
2. Navigate to **Matches** page
3. Click on any of the 5 matches
4. In the message input area, click the **🎤 Microphone button**
5. Start recording (you'll see animated waveform)
6. Record for a few seconds (max 2 minutes)
7. Click **Stop** and preview your recording
8. Click **Send** to send the voice message
9. Voice message will appear in chat with waveform visualization
10. Click **Play** button to play it back

### Test Map Location Picker
1. Stay logged in as **testauth@ember.test**
2. Navigate to **Discover** page
3. Click the **Filters/Sliders icon** to open Advanced Filters
4. Scroll to the **"Change Location"** section
5. Click **"Select Location on Map"** button
6. Interactive map will open with OpenStreetMap
7. **Try searching:** Type "Paris" in the search bar and select result
8. **Try clicking:** Click anywhere on the map to select location
9. Verify location name appears at bottom
10. Click **"Confirm Location"** to save
11. Verify city/country fields are auto-filled
12. Click **"Apply Filters"** to save changes

### Test Authentication Persistence
1. After logging in, refresh the page (F5)
2. Verify you stay logged in
3. Navigate between pages
4. Verify session persists

---

## 🎯 Features to Test

### Voice Messages Features:
- ✅ Recording duration (max 2 minutes)
- ✅ Real-time waveform visualization
- ✅ Audio preview before sending
- ✅ Playback with waveform
- ✅ 24-hour auto-deletion (happens automatically)
- ✅ Recording indicator (other user sees when you're recording)

### Map Location Features:
- ✅ Search by city/address
- ✅ Click/touch to select location
- ✅ Reverse geocoding (shows location name)
- ✅ Auto-fill city/country fields
- ✅ Coordinate storage for distance calculations
- ✅ Manual typing still works as fallback

---

## 📝 Notes

- All test profiles have completed profiles and are verified
- Matches are pre-created so you can start messaging immediately
- You can also login as any of the 5 female profiles to test from their perspective
- All accounts use the same password: **TestPass123**
- Voice messages will auto-delete after 24 hours (background task runs hourly)
- No API keys needed for the map (uses free OpenStreetMap)

---

## 🐛 Troubleshooting

**Can't see Matches page?**
- Make sure you're logged in as testauth@ember.test
- Profile should be complete (already done)

**Voice recording not working?**
- Grant microphone permissions when browser asks
- Check browser console for errors

**Map not loading?**
- Check internet connection (map loads from OpenStreetMap)
- Check browser console for errors

**Still having issues?**
- Check `/var/log/supervisor/backend.err.log` for backend errors
- Check browser console for frontend errors
- Verify services are running: `sudo supervisorctl status`

---

## 🚀 Ready to Test!

You now have everything set up to fully test:
1. ✅ Authentication (fixed and working)
2. ✅ Voice messages (record, send, receive, playback)
3. ✅ Map location picker (search, click, select, save)

Happy testing! 🎉
