# 📱 Ember Mobile App - Technical Implementation Guide

## ✅ Capacitor Setup Complete!

### Installed Packages:
- ✅ @capacitor/core@6.1.2
- ✅ @capacitor/cli@6.1.2
- ✅ @capacitor/ios@6.1.2
- ✅ @capacitor/android@6.1.2

### Mobile Plugins Installed:
- ✅ @capacitor/camera - Photo capture for selfies
- ✅ @capacitor/geolocation - Location services
- ✅ @capacitor/push-notifications - Firebase push notifications
- ✅ @capacitor/app - App lifecycle events
- ✅ @capacitor/splash-screen - Launch screen
- ✅ @capacitor/status-bar - Status bar customization
- ✅ @capacitor/keyboard - Keyboard behavior
- ✅ @capacitor/haptics - Vibration feedback
- ✅ @capacitor/share - Share functionality
- ✅ @capacitor/filesystem - File operations

### Configuration Created:
✅ `capacitor.config.ts` - Main Capacitor configuration

---

## 🚀 Next Steps to Build Mobile Apps

### Step 1: Build the React App
```bash
cd /app/frontend
npm run build  # or yarn build
```

### Step 2: Add Native Platforms
```bash
# Add iOS platform (requires macOS)
npx cap add ios

# Add Android platform
npx cap add android
```

### Step 3: Sync Web Assets to Native Projects
```bash
npx cap sync
```

### Step 4: Open Native IDEs

**For iOS (requires macOS with Xcode):**
```bash
npx cap open ios
```

**For Android (requires Android Studio):**
```bash
npx cap open android
```

---

## 📱 Platform-Specific Requirements

### iOS Requirements:

#### 1. Development Machine:
- Mac with macOS 11+ (Big Sur or later)
- Xcode 13+ installed
- iOS Simulator
- CocoaPods installed

#### 2. Apple Developer Account:
- Individual or Organization account
- Cost: $99/year
- Sign up: https://developer.apple.com/programs/

#### 3. Certificates & Profiles:
- Development Certificate
- Distribution Certificate  
- App ID: com.ember.dating
- Provisioning Profiles (Development & Distribution)

#### 4. App Store Connect:
- Create app listing
- Set up TestFlight
- Prepare metadata

### Android Requirements:

#### 1. Development Machine:
- Windows, Mac, or Linux
- Android Studio installed
- Android SDK installed
- Java JDK 11+ installed

#### 2. Google Play Console Account:
- Cost: $25 (one-time)
- Sign up: https://play.google.com/console

#### 3. App Signing:
- Generate upload key
- Configure key signing
- Create keystore file

#### 4. Google Play Store:
- Create app listing
- Set up internal testing
- Prepare metadata

---

## 🎨 Required Assets

### App Icons

You'll need to create icons in these sizes:

**iOS:**
```
- 1024x1024 (App Store)
- 180x180 (iPhone 3x)
- 167x167 (iPad Pro)
- 152x152 (iPad 2x)
- 120x120 (iPhone 2x)
- 87x87 (iPhone 3x Settings)
- 80x80 (iPad 2x Settings)
- 76x76 (iPad)
- 60x60 (iPhone)
- 58x58 (iPhone Settings)
- 40x40 (iPad Spotlight)
- 29x29 (Settings)
```

**Android:**
```
- 512x512 (Google Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)
```

### Splash Screens

**iOS:**
```
- iPhone 14 Pro Max: 1290 x 2796
- iPhone 14 Pro: 1179 x 2556
- iPhone 14 Plus: 1284 x 2778
- iPhone 14: 1170 x 2532
- iPhone 13: 1170 x 2532
- iPhone SE: 750 x 1334
- iPad Pro 12.9": 2048 x 2732
- iPad Pro 11": 1668 x 2388
```

**Android:**
```
- xxxhdpi: 1280 x 1920
- xxhdpi: 960 x 1440
- xhdpi: 640 x 960
- hdpi: 480 x 720
- mdpi: 320 x 480
```

### Screenshots for App Stores

**iOS Screenshots (Required):**
```
- 6.7" Display (iPhone 14 Pro Max): 1290 x 2796
- 6.5" Display (iPhone 11 Pro Max): 1242 x 2688
- 5.5" Display (iPhone 8 Plus): 1242 x 2208
- iPad Pro 12.9" (2nd gen): 2048 x 2732
```

**Android Screenshots (Required):**
```
- Phone: 1080 x 1920 (16:9 ratio)
- 7" Tablet: 1024 x 1600
- 10" Tablet: 1280 x 1920
```

Minimum: 2 screenshots, Maximum: 8 screenshots per device type

---

## 🔧 Code Modifications Needed

### 1. Update Photo Upload for Mobile

Replace file input with Capacitor Camera:

```javascript
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt // Shows camera/gallery options
  });
  
  // image.dataUrl contains base64 image
  return image.dataUrl;
};
```

### 2. Update Location for Mobile

```javascript
import { Geolocation } from '@capacitor/geolocation';

const getCurrentLocation = async () => {
  const coordinates = await Geolocation.getCurrentPosition();
  return {
    latitude: coordinates.coords.latitude,
    longitude: coordinates.coords.longitude
  };
};
```

### 3. Add Push Notification Handling

```javascript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission
await PushNotifications.requestPermissions();

// Register for push notifications
await PushNotifications.register();

// Listen for registration
PushNotifications.addListener('registration', (token) => {
  console.log('Push token:', token.value);
  // Send token to backend
});

// Listen for notifications
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Notification received:', notification);
});
```

### 4. Handle App Lifecycle

```javascript
import { App } from '@capacitor/app';

App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    // App came to foreground
    // Refresh data, check for new matches, etc.
  }
});

App.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    App.exitApp();
  }
});
```

### 5. Add Splash Screen Control

```javascript
import { SplashScreen } from '@capacitor/splash-screen';

// Hide splash screen after app is ready
useEffect(() => {
  // After React app is loaded
  setTimeout(() => {
    SplashScreen.hide();
  }, 500);
}, []);
```

---

## 📄 iOS Configuration (Info.plist)

Add these permissions to `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Ember needs access to your camera to take photos for your profile and verification.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Ember needs access to your photo library to select photos for your profile.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Ember uses your location to show you potential matches nearby.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Ember uses your location to show you potential matches nearby.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Ember needs access to your microphone for video calls.</string>

<key>NSUserTrackingUsageDescription</key>
<string>This allows us to provide you with a better experience and personalized content.</string>
```

---

## 🤖 Android Configuration (AndroidManifest.xml)

Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Camera -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />

<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Storage -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Push Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

<!-- Vibration for haptic feedback -->
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 🔐 Firebase Setup for Push Notifications

### iOS:
1. Create iOS app in Firebase Console
2. Download `GoogleService-Info.plist`
3. Add to `ios/App/App/` directory
4. Enable Push Notifications in Xcode capabilities
5. Upload APNs certificate to Firebase

### Android:
1. Create Android app in Firebase Console
2. Download `google-services.json`
3. Add to `android/app/` directory
4. FCM automatically configured via google-services.json

---

## 💰 In-App Purchase Setup

### iOS (StoreKit):
1. Create products in App Store Connect
2. Configure SKUs matching your backend:
   - `com.ember.premium.weekly` - $4.99
   - `com.ember.premium.monthly` - $19.99
   - `com.ember.premium.yearly` - $149.99
   - `com.ember.roses.3` - $2.99
   - `com.ember.roses.12` - $9.99
   - `com.ember.superlikes.5` - $4.99
   - `com.ember.superlikes.15` - $12.99

3. Install plugin: `@capacitor-community/in-app-purchases`

### Android (Google Play Billing):
1. Create products in Google Play Console
2. Configure SKUs matching iOS
3. Set up billing library in app

---

## 🧪 Testing Strategy

### 1. Development Testing:
- iOS Simulator
- Android Emulator
- Chrome DevTools (mobile view)

### 2. Beta Testing:
- TestFlight (iOS) - Invite testers via email
- Internal Testing (Android) - Google Play Console

### 3. Physical Device Testing:
Test on real devices:
- iPhone (latest 3-4 models)
- iPad
- Android (Samsung, Google Pixel, OnePlus)
- Different screen sizes
- Different OS versions

### 4. Test Scenarios:
- [ ] Registration and login
- [ ] Profile setup with photos
- [ ] Verification (photo, phone, ID)
- [ ] Discover and swiping
- [ ] Matching
- [ ] Messaging
- [ ] Video calls
- [ ] Premium purchase flow
- [ ] Push notifications
- [ ] Location services
- [ ] Camera access
- [ ] Background/foreground transitions
- [ ] Network offline/online
- [ ] Deep linking

---

## 📦 Building for Production

### iOS Build:

```bash
# 1. Build React app
cd /app/frontend
npm run build

# 2. Sync with iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. In Xcode:
# - Select "Any iOS Device" or actual device
# - Product > Archive
# - Distribute App > App Store Connect
# - Upload to TestFlight
# - Submit for Review
```

### Android Build:

```bash
# 1. Build React app
cd /app/frontend
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio:
# - Build > Generate Signed Bundle/APK
# - Choose Android App Bundle
# - Create/select keystore
# - Build release AAB
# - Upload to Google Play Console
# - Submit for Review
```

---

## 📊 App Store Submission Checklist

### iOS App Store:

- [ ] App built and archived
- [ ] TestFlight beta testing complete
- [ ] App Store Connect app created
- [ ] Bundle ID registered: com.ember.dating
- [ ] App name: Ember
- [ ] Subtitle: Find Your Perfect Match
- [ ] App category: Social Networking
- [ ] Age rating: 17+ (Dating apps require this)
- [ ] Privacy Policy URL added
- [ ] Terms of Service URL added
- [ ] App screenshots uploaded (all required sizes)
- [ ] App preview video (optional but recommended)
- [ ] App description (4000 characters max)
- [ ] Keywords (100 characters max)
- [ ] Support URL
- [ ] Marketing URL
- [ ] Copyright info
- [ ] App Store Review Information (test account)
- [ ] In-App Purchases configured
- [ ] Build uploaded and selected

### Google Play Store:

- [ ] App built and signed
- [ ] Google Play Console app created
- [ ] Package name: com.ember.dating
- [ ] App name: Ember
- [ ] Short description (80 characters)
- [ ] Full description (4000 characters)
- [ ] App category: Dating
- [ ] Content rating completed
- [ ] Privacy Policy URL added
- [ ] Terms of Service URL added
- [ ] App screenshots uploaded (all required sizes)
- [ ] Feature graphic uploaded (1024x500)
- [ ] App icon uploaded (512x512)
- [ ] Short promotional video (optional)
- [ ] Pricing: Free (with in-app purchases)
- [ ] Countries/regions selected
- [ ] Content ratings obtained
- [ ] Target audience age group
- [ ] Internal testing track created
- [ ] Production release ready

---

## 🎯 Important Notes

### Dating App Specific:

1. **Age Restriction:**
   - Must be 17+ (iOS) / Mature 17+ (Android)
   - Implement age verification
   - Block users under 18

2. **Content Moderation:**
   - AI photo moderation
   - User reporting system
   - Quick response to violations
   - Community guidelines enforcement

3. **Privacy & Safety:**
   - Clear privacy policy
   - Data encryption
   - Secure authentication
   - Location privacy controls
   - Block/report functionality

4. **Review Guidelines:**
   - Apple: https://developer.apple.com/app-store/review/guidelines/
   - Google: https://play.google.com/about/developer-content-policy/

### Common Rejection Reasons:

- Incomplete privacy policy
- Missing age restrictions
- Inappropriate content
- Broken features during review
- Missing test account credentials
- Poor app performance
- Crashes or bugs
- Misleading descriptions

---

## ⚡ Performance Optimization

### For Mobile:

1. **Reduce Bundle Size:**
   - Code splitting
   - Lazy loading
   - Tree shaking
   - Remove unused dependencies

2. **Image Optimization:**
   - WebP format for photos
   - Lazy load images
   - Compress uploads
   - Use CDN (Cloudinary already configured)

3. **API Optimization:**
   - Implement caching
   - Reduce API calls
   - Use pagination
   - WebSocket for real-time features

4. **Network Handling:**
   - Offline mode
   - Request queuing
   - Retry logic
   - Loading states

---

## 🚀 Deployment Workflow

### Recommended Process:

1. **Development** → Test locally
2. **Staging** → Deploy to staging backend
3. **Beta** → TestFlight (iOS) + Internal Track (Android)
4. **Production** → App Store + Google Play

### Version Control:

- Use semantic versioning: 1.0.0, 1.0.1, 1.1.0
- Update version in:
  - `package.json`
  - `capacitor.config.ts`
  - iOS: `Info.plist` (CFBundleShortVersionString)
  - Android: `build.gradle` (versionName)

---

## 📞 Support Resources

### Documentation:
- Capacitor: https://capacitorjs.com/docs
- iOS Dev: https://developer.apple.com
- Android Dev: https://developer.android.com

### Communities:
- Capacitor Discord
- iOS Dev Forums
- Android Dev Community
- Stack Overflow

---

## ✅ Current Status

**Technical Setup:** ✅ COMPLETE
- Capacitor installed and configured
- All mobile plugins added
- Configuration file created

**Next Actions Required:**
1. Build React app: `npm run build`
2. Add platforms: `npx cap add ios` and `npx cap add android`
3. Create app icons and splash screens
4. Register Apple Developer Account
5. Register Google Play Console Account
6. Set up Firebase for push notifications
7. Configure in-app purchases
8. Test on simulators/emulators
9. Physical device testing
10. Submit to app stores

---

## 🔥 Ready to Build!

All technical setup is complete. The app is ready to be built for iOS and Android platforms.

**Estimated time to first beta release:** 4-6 weeks
**Estimated time to app store approval:** 2-4 weeks after submission

Let me know when you're ready to proceed with platform addition and native builds!
