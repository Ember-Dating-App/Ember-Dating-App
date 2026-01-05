# 🤖 Complete Android App Build & Publish Guide

## 📋 Overview

This guide will walk you through building and publishing your Ember Dating App on Google Play Store. The Android project is already configured and ready to build!

---

## ✅ Prerequisites Checklist

### Software Requirements:
- [ ] **Android Studio** (Latest version - Arctic Fox or newer)
  - Download: https://developer.android.com/studio
  - Size: ~1GB download, ~3GB installed
  - Installation time: 15-30 minutes

- [ ] **Java JDK 11 or higher** (Usually comes with Android Studio)
  - Android Studio includes JDK
  - Verify: `java -version`

### Account Requirements:
- [ ] **Google Play Console Account** ($25 one-time fee)
  - Sign up: https://play.google.com/console/signup
  - Payment: Credit/debit card
  - Processing: Instant after payment

### What You Already Have:
- ✅ Android project configured in `/app/frontend/android`
- ✅ Capacitor installed and configured
- ✅ App ID: `com.mycompany.emberdatingapp`
- ✅ App Name: `Ember Dating App`
- ✅ All icons and splash screens generated

---

## 🎯 Phase 1: Install Android Studio (If Not Installed)

### Step 1: Download Android Studio

1. Go to https://developer.android.com/studio
2. Click "Download Android Studio"
3. Accept terms and download

### Step 2: Install Android Studio

**Windows:**
1. Run the `.exe` installer
2. Follow installation wizard
3. Choose "Standard" installation
4. Wait for SDK components to download (15-30 min)

**Mac:**
1. Open the `.dmg` file
2. Drag Android Studio to Applications
3. Open Android Studio
4. Follow setup wizard

**Linux:**
1. Extract the `.tar.gz` file
2. Run `studio.sh` from the `bin` directory
3. Follow setup wizard

### Step 3: Configure Android Studio

1. Open Android Studio
2. Go to: **Tools → SDK Manager**
3. Ensure these are installed:
   - ✅ Android SDK Platform 33 (Android 13)
   - ✅ Android SDK Platform 34 (Android 14)
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools

---

## 🔧 Phase 2: Prepare Your App for Build

### Step 1: Build the Web App

Run these commands in your terminal:

```bash
# Navigate to frontend directory
cd /app/frontend

# Install dependencies (if not already done)
yarn install

# Build the production web app
yarn build

# This creates an optimized build in /app/frontend/build
```

**Expected output:**
```
✓ Compiled successfully
✓ Build complete in XX seconds
```

### Step 2: Sync with Capacitor

```bash
# Still in /app/frontend directory

# Sync the built web app to Android
npx cap sync android

# This copies your web build to the Android project
```

**What this does:**
- Copies `/app/frontend/build` to Android's `assets/www` folder
- Updates Android dependencies
- Syncs Capacitor plugins

---

## 📱 Phase 3: Configure Android App Details

### Step 1: Update App ID (Important!)

The app ID needs to be unique. Let's change it from the default.

**File: `/app/frontend/capacitor.config.ts`**

Change line 4 from:
```typescript
appId: 'com.mycompany.emberdatingapp',
```

To:
```typescript
appId: 'com.emberdating.app',
```

**Also update in: `/app/frontend/android/app/build.gradle`**

Around line 7, change:
```gradle
namespace "com.mycompany.emberdatingapp"
defaultConfig {
    applicationId "com.mycompany.emberdatingapp"
```

To:
```gradle
namespace "com.emberdating.app"
defaultConfig {
    applicationId "com.emberdating.app"
```

### Step 2: Update App Name and Version

**File: `/app/frontend/android/app/build.gradle`**

Find and update these lines (around line 10-12):
```gradle
versionCode 1
versionName "1.0.0"
```

Keep as is for first release, or update version as needed.

### Step 3: Add Permissions

**File: `/app/frontend/android/app/src/main/AndroidManifest.xml`**

Ensure these permissions are present (they should already be there):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 🏗️ Phase 4: Build the Android App

### Step 1: Open Project in Android Studio

```bash
# From /app/frontend directory
npx cap open android
```

This will launch Android Studio with your Android project.

**Alternative:** 
- Open Android Studio manually
- Click "Open" → Navigate to `/app/frontend/android` → Click "OK"

### Step 2: Wait for Gradle Sync

When Android Studio opens:
1. Wait for "Gradle sync" to complete (bottom status bar)
2. This takes 2-5 minutes on first open
3. You'll see "Gradle build finished" when done

**If you see errors:**
- Click "File → Sync Project with Gradle Files"
- Wait for sync to complete

### Step 3: Build APK for Testing

1. In Android Studio menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait 2-5 minutes for build
3. You'll see: "APK(s) generated successfully"
4. Click "locate" to find the APK

**APK Location:**
```
/app/frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Test on Device or Emulator

**Option A: Physical Device (Recommended)**
1. Enable Developer Options on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"
2. Connect phone via USB
3. In Android Studio, select your device from dropdown
4. Click green "Run" button ▶️
5. App installs and launches on your phone

**Option B: Emulator**
1. In Android Studio: **Tools → Device Manager**
2. Click "Create Device"
3. Select a phone (e.g., Pixel 5)
4. Select system image (Android 13 or 14)
5. Click "Finish"
6. Click green "Run" button ▶️
7. Emulator launches with your app

### Step 5: Test Thoroughly

Test these critical features:
- [ ] Login/Register
- [ ] Profile setup
- [ ] Photo upload (Camera permission)
- [ ] Location services (Location permission)
- [ ] Discover feed
- [ ] Messaging
- [ ] GIF picker
- [ ] Video calls
- [ ] Push notifications (if configured)

---

## 🔐 Phase 5: Create Signed Release Build

To publish on Google Play, you need a signed release build.

### Step 1: Generate Keystore (First Time Only)

A keystore is like a digital signature for your app.

**Option A: Using Android Studio (Easier)**
1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Select "Android App Bundle"
3. Click "Create new..." under Key store path
4. Fill in the form:
   - **Key store path:** `/app/frontend/android/ember-release-key.jks`
   - **Password:** Create a strong password (SAVE THIS!)
   - **Key alias:** ember-app-key
   - **Key password:** Same as keystore password (or different, SAVE THIS!)
   - **Validity:** 25 years
   - **Certificate:**
     - First and Last Name: Your Name
     - Organizational Unit: Ember Dating
     - Organization: Ember
     - City: Your City
     - State: Your State
     - Country Code: US (or your country)
5. Click "OK"

**Option B: Using Command Line**

```bash
cd /app/frontend/android

keytool -genkey -v -keystore ember-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias ember-app-key
```

Enter password when prompted (and SAVE IT!)

### Step 2: Save Keystore Information

**CRITICAL: Save these in a secure location!**

Create a file: `/app/keystore-info.txt` (DO NOT COMMIT TO GIT!)

```
Keystore Location: /app/frontend/android/ember-release-key.jks
Keystore Password: [YOUR_PASSWORD]
Key Alias: ember-app-key
Key Password: [YOUR_KEY_PASSWORD]
```

**⚠️ If you lose this keystore, you can NEVER update your app again!**

### Step 3: Build Signed App Bundle

**What is AAB?**
- Android App Bundle (.aab) is the publishing format for Google Play
- Google Play generates optimized APKs for each device
- Smaller download sizes for users

**Build the AAB:**

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Select "Android App Bundle"
3. Click "Next"
4. Select your keystore:
   - Key store path: Browse to `ember-release-key.jks`
   - Key store password: [Enter password]
   - Key alias: ember-app-key
   - Key password: [Enter key password]
5. Click "Next"
6. Select "release" build variant
7. Check both signature versions (V1 and V2)
8. Click "Finish"
9. Wait 2-5 minutes

**AAB Location:**
```
/app/frontend/android/app/build/outputs/bundle/release/app-release.aab
```

**File size:** Should be 15-30 MB

---

## 📝 Phase 6: Create Google Play Console Listing

### Step 1: Create Google Play Developer Account

1. Go to: https://play.google.com/console/signup
2. Sign in with your Google account
3. Accept Developer Distribution Agreement
4. Pay $25 registration fee (one-time)
5. Complete account details

**Processing time:** Instant after payment

### Step 2: Create New App

1. In Play Console, click "Create app"
2. Fill in details:
   - **App name:** Ember Dating App
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (with in-app purchases)
3. Check declarations:
   - [ ] Privacy Policy available
   - [ ] Export laws compliant
4. Click "Create app"

### Step 3: Complete App Information

#### Dashboard → Store settings

**Store listing:**
1. **App name:** Ember Dating App
2. **Short description** (80 chars max):
   ```
   AI-powered dating app with video calls, games, and meaningful connections
   ```

3. **Full description** (4000 chars max):
   ```
   🔥 Find Your Perfect Match with Ember Dating App

   Ember is the modern dating app that uses AI to help you find meaningful connections. Whether you're looking for love, friendship, or something in between, Ember makes it easy to meet amazing people.

   ✨ KEY FEATURES:

   🤖 AI-Powered Matching
   Our advanced algorithm learns your preferences and suggests compatible matches based on interests, values, and personality.

   📸 Verified Profiles
   Photo verification and identity checks ensure you're talking to real people, making Ember one of the safest dating platforms.

   💬 Rich Messaging
   Send messages, GIFs, voice notes, and more. Express yourself with our fun conversation starters and icebreaker games.

   📹 Video Calls
   Take your connection to the next level with built-in video calls. No need to exchange phone numbers!

   🎮 Icebreaker Games
   Play fun games with your matches to break the ice and learn more about each other.

   🎁 Virtual Gifts
   Send roses, super likes, and other virtual gifts to show someone you're interested.

   🗺️ Date Suggestions
   Get personalized date ideas based on your location and shared interests.

   👑 Premium Features
   Upgrade to unlock unlimited likes, see who likes you, access standout profiles, and more.

   🎖️ Ambassador Program
   Join our exclusive community and get free premium access while representing Ember.

   💡 WHY CHOOSE EMBER?

   - Safe & verified community (18+ only)
   - Privacy-focused with end-to-end encryption
   - No catfishing with mandatory photo verification
   - Meaningful connections, not just swipes
   - Active moderation and user support
   - Regular updates and new features

   🌟 SUCCESS STORIES

   Thousands of couples have found love on Ember. Join them today!

   📱 DOWNLOAD NOW

   Create your profile in minutes and start meeting incredible people near you. Your perfect match is waiting!

   ---

   Privacy Policy: https://emberdatingapp.org/privacy
   Terms of Service: https://emberdatingapp.org/terms
   Support: Contact us through the app
   ```

4. **App icon:** 512x512 PNG (already generated at `/app/frontend/public/icon-512.png`)

5. **Feature graphic:** 1024x500 PNG
   - Create using Canva or Figma
   - Use Ember branding (orange/pink gradient)
   - Include app name and tagline

6. **Screenshots:** (At least 2, up to 8 per device type)
   - Phone screenshots: 1080x1920 or similar
   - Take from Android emulator or device
   - Show key features: Discover, Messaging, Profile, Video Call

   **Required screenshots to capture:**
   - Landing/Login screen
   - Discover feed with profiles
   - Profile setup screens
   - Messaging interface (with GIF)
   - Match screen
   - Profile settings
   - Video call interface
   - Icebreaker game

**How to take screenshots in Android Studio:**
1. Run app in emulator
2. Click camera icon 📷 in emulator toolbar
3. Screenshots save to: Studio → Captures

7. **Video** (Optional but recommended):
   - 30 seconds max
   - Show app in action
   - Can use screen recording tool

#### Store settings → Contact details

1. **Email:** ember.dating.app25@gmail.com
2. **Phone:** (Optional)
3. **Website:** https://emberdatingapp.org
4. **Privacy Policy URL:** https://emberdatingapp.org/privacy

#### Store settings → App category

1. **Category:** Dating
2. **Tags:** dating, relationships, social, meeting people

#### Store settings → Store settings

1. **Ads:** No (you don't serve ads)
2. **Contains ads:** No

### Step 4: Content Rating

1. Go to: **Policy → App content → Content rating**
2. Click "Start questionnaire"
3. **Select category:** Dating
4. **Answer questions honestly:**
   - Does your app contain violence? No
   - Does your app contain sexual content? Some (dating context)
   - Does your app contain profanity? Potentially (user-generated)
   - Does your app facilitate dating? Yes
   - Age restriction: 18+
5. Review and submit
6. You'll get rating: **Mature 17+** or **Adults Only 18+**

### Step 5: Target Audience

1. Go to: **Policy → App content → Target audience**
2. **Age groups:** 18 years and older
3. Save

### Step 6: Privacy Policy

1. Go to: **Policy → App content → Privacy Policy**
2. **Privacy Policy URL:** https://emberdatingapp.org/privacy
3. Save

### Step 7: App Access

1. Go to: **Policy → App content → App access**
2. **All features available:** Yes
3. Save

### Step 8: Data Safety

This is CRITICAL for Google Play approval.

1. Go to: **Policy → App content → Data safety**
2. Click "Start"

**Data collection:**
- **Does your app collect user data?** Yes
- **Is data encrypted in transit?** Yes
- **Can users request data deletion?** Yes

**Data types collected:**
- Personal info: Name, email, phone number, date of birth
- Photos and videos: Profile pictures
- Location: Approximate location
- Messages: User communications
- Device info: Device ID, crash logs

**Data usage:**
- App functionality
- Analytics
- Personalization
- Account management

**Data sharing:**
- With service providers only
- No third-party sharing

3. Review and save

### Step 9: Government Requirements

1. Go to: **Policy → App content → Government requirements**
2. Complete any required declarations for your country
3. Save

---

## 🚀 Phase 7: Upload and Publish

### Step 1: Create Release

1. Go to: **Release → Production**
2. Click "Create new release"

### Step 2: Upload AAB

1. Click "Upload" button
2. Select your `app-release.aab` file
3. Wait for upload to complete (1-2 minutes)
4. Google Play will analyze your app

**If you see warnings:**
- Review and address if critical
- Most warnings can be ignored for first release

### Step 3: Release Notes

Enter what's new (keep simple for v1.0):

```
Version 1.0.0

Welcome to Ember Dating App!

🔥 Features:
- AI-powered matching
- Verified profiles
- Video calls
- Icebreaker games
- GIF messaging
- Virtual gifts
- Premium subscriptions

Thank you for downloading Ember! Find your perfect match today.
```

### Step 4: Set Rollout Percentage

For first release:
- **Option A:** 100% (full release to everyone)
- **Option B:** 10-20% (gradual rollout) - recommended for safety

### Step 5: Review and Publish

1. Review all information
2. Click "Review release"
3. Fix any errors or warnings
4. Click "Start rollout to Production"
5. Confirm

**Congratulations! Your app is submitted! 🎉**

---

## ⏰ Phase 8: Wait for Review

### What Happens Next:

1. **Pending publication:** Immediate
2. **Under review:** 1-48 hours (usually 4-8 hours)
3. **Publishing:** 1-2 hours
4. **Live on Google Play:** Usually within 24 hours!

### You'll Receive Emails:

1. "We're reviewing your app" (immediately)
2. "Your app is approved" or "Issues found" (within 24 hours)
3. "Your app is live" (after approval)

### If Rejected:

**Common rejection reasons:**
1. **Privacy Policy missing/incorrect**
   - Solution: Ensure URL is accessible: https://emberdatingapp.org/privacy

2. **Permissions not explained**
   - Solution: Add permission descriptions in AndroidManifest.xml

3. **Content rating incorrect**
   - Solution: Ensure 18+ rating for dating app

4. **Broken functionality**
   - Solution: Test thoroughly before submission

5. **Misleading screenshots**
   - Solution: Use actual app screenshots, no mockups

**How to fix:**
1. Read the rejection email carefully
2. Make required changes
3. Build new AAB
4. Upload to new release
5. Resubmit

---

## 📊 Phase 9: After Launch

### Monitor Your App:

**Day 1-7:**
- Check crash reports daily
- Monitor user reviews
- Respond to feedback
- Track installs (in Play Console dashboard)

**Ongoing:**
- Update app every 2-4 weeks
- Fix bugs reported
- Add new features
- Improve based on reviews

### Key Metrics to Track:

1. **Installs:** How many people downloaded
2. **Active users:** Daily/monthly active users
3. **Retention:** How many users come back
4. **Rating:** Star rating (aim for 4.0+)
5. **Reviews:** User feedback
6. **Crashes:** App stability (aim for <1% crash rate)

### Responding to Reviews:

- Reply to all 1-star and 2-star reviews
- Thank 5-star reviewers
- Address issues mentioned
- Show you care about users

---

## 💰 Next Steps: Add Google Play Billing

Once your app is live, add in-app purchases:

1. Go to: **Monetize → Products → In-app products**
2. Create 7 products:
   - `ember_weekly` - Weekly Premium - $4.99
   - `ember_monthly` - Monthly Premium - $19.99
   - `ember_yearly` - Yearly Premium - $149.99
   - `ember_roses_3` - 3 Roses - $2.99
   - `ember_roses_12` - 12 Roses - $9.99
   - `ember_super_likes_5` - 5 Super Likes - $4.99
   - `ember_super_likes_15` - 15 Super Likes - $12.99

3. Implement Google Play Billing using the playbook in:
   `/app/MOBILE_PAYMENTS_INTEGRATION_COMPLETE.md`

4. Update app and release v1.1.0 with payments

---

## 📋 Troubleshooting

### Build Errors:

**"Gradle sync failed"**
- Solution: File → Invalidate Caches and Restart

**"SDK not found"**
- Solution: Open SDK Manager, install Android SDK

**"Keystore not found"**
- Solution: Check keystore path, regenerate if needed

**"Permission denied"**
- Solution: On Linux/Mac, run `chmod +x gradlew`

### Upload Errors:

**"Version code already exists"**
- Solution: Increment versionCode in build.gradle

**"Signature issue"**
- Solution: Make sure you're using the same keystore

**"Bundle too large"**
- Solution: Enable code shrinking in build.gradle

---

## ✅ Final Checklist Before Publishing

- [ ] App builds without errors
- [ ] Tested on physical device
- [ ] All features working
- [ ] Privacy Policy accessible
- [ ] Terms of Service accessible
- [ ] App icon looks good
- [ ] Screenshots prepared (minimum 2)
- [ ] Feature graphic created
- [ ] Store listing complete
- [ ] Content rating submitted
- [ ] Data safety completed
- [ ] Signed AAB generated
- [ ] Google Play Developer account active
- [ ] Keystore backed up securely

---

## 🎉 Success!

Once your app is live on Google Play:

1. Share the link: `https://play.google.com/store/apps/details?id=com.emberdating.app`
2. Promote on social media
3. Ask friends to download and review
4. Monitor feedback
5. Keep improving

**Total Time to Publish:** 1-3 days
- Build: 2-4 hours
- Store listing: 2-3 hours
- Review: 4-24 hours
- Live: Within 24 hours

---

## 📞 Need Help?

If you get stuck:
1. Check Android Studio logs (View → Tool Windows → Logcat)
2. Google the error message
3. Check Stack Overflow
4. Ask in Android development forums
5. Or let me know and I'll help troubleshoot!

**You've got this! Let's get Ember on Google Play! 🚀**
