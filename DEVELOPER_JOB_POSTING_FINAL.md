# 📱 Mobile App Developer - iOS & Android with In-App Purchases

## 🎯 Project Overview

**App:** Ember Dating App  
**Status:** Fully developed React web app ready for mobile deployment  
**Tech Stack:** React + Capacitor + FastAPI + MongoDB  
**Your Mission:** Build iOS & Android apps with working in-app payments  
**Timeline:** 2-3 weeks  
**Budget:** $3,000 - $5,000 USD (negotiable based on experience)

---

## 📋 What You'll Be Doing

### Primary Deliverables:

1. ✅ **Build Android App**
   - Configure and build production-ready Android app
   - Test on real Android devices
   - Submit to Google Play Store
   - Get app approved and live

2. ✅ **Build iOS App**
   - Configure and build production-ready iOS app
   - Test on real iPhone devices (via TestFlight)
   - Submit to Apple App Store
   - Get app approved and live

3. ✅ **Implement Google Play Billing**
   - Set up 7 in-app products in Google Play Console
   - Integrate Google Play Billing Library 5+
   - Connect to backend for purchase verification
   - Test purchases in sandbox environment
   - Make purchases work in production

4. ✅ **Implement Apple In-App Purchase**
   - Set up 7 in-app products in App Store Connect
   - Integrate StoreKit (Apple's IAP system)
   - Connect to backend for receipt validation
   - Test purchases via TestFlight
   - Make purchases work in production

5. ✅ **Backend Payment Verification**
   - Create API endpoints for purchase verification
   - Validate Apple receipts using App Store Server API
   - Validate Google purchases using Play Developer API
   - Grant user entitlements (premium access, roses, super likes)
   - Handle subscription renewals and cancellations

6. ✅ **Testing & Documentation**
   - Test all features on real devices
   - Test all 7 products (subscriptions and consumables)
   - Document build process
   - Fix any bugs found during testing

---

## 💰 In-App Products to Implement (7 Total)

### Subscriptions (3 products):

**1. Weekly Premium - $4.99**
- Product ID: `ember_weekly`
- Duration: 1 week
- Auto-renewable subscription
- Features: Unlimited likes, 5 Super Likes/day, 3 Roses/week, See who likes you, Standouts access

**2. Monthly Premium - $19.99**
- Product ID: `ember_monthly`
- Duration: 1 month
- Auto-renewable subscription
- Features: All weekly features + 5 Roses/week + Priority likes

**3. Yearly Premium - $149.99**
- Product ID: `ember_yearly`
- Duration: 1 year
- Auto-renewable subscription
- Features: All monthly features + Unlimited Super Likes + 10 Roses/week + Profile boost

### Consumables (4 products):

**4. 3 Roses Bundle - $2.99**
- Product ID: `ember_roses_3`
- Type: Consumable (can be purchased multiple times)
- Grants: 3 roses to user account

**5. 12 Roses Bundle - $9.99**
- Product ID: `ember_roses_12`
- Type: Consumable
- Grants: 12 roses to user account

**6. 5 Super Likes Bundle - $4.99**
- Product ID: `ember_super_likes_5`
- Type: Consumable
- Grants: 5 super likes to user account

**7. 15 Super Likes Bundle - $12.99**
- Product ID: `ember_super_likes_15`
- Type: Consumable
- Grants: 15 super likes to user account

---

## 🔧 Technical Requirements

### Required Skills:

**Must Have:**
- ✅ React Native or Capacitor experience (3+ projects)
- ✅ Android Studio proficiency
- ✅ Xcode proficiency (or access to Mac/MacinCloud)
- ✅ Google Play Billing Library 5+ integration experience
- ✅ Apple In-App Purchase (StoreKit) integration experience
- ✅ Published at least 2 apps on both Google Play and App Store
- ✅ Experience with in-app purchase implementation
- ✅ Backend API integration (REST APIs)
- ✅ Git/GitHub knowledge

**Nice to Have:**
- ✅ FastAPI or Python knowledge (for backend)
- ✅ MongoDB experience
- ✅ Dating app development experience
- ✅ RevenueCat SDK experience (optional)
- ✅ Firebase integration
- ✅ App store optimization (ASO) knowledge

---

## 📦 What You'll Receive

### Complete Project Package:

1. **GitHub Repository**
   - Full source code access
   - Repository: https://github.com/Ember-Dating-App/Ember-Dating-App
   - Branch: main

2. **Fully Developed App**
   - ✅ Complete React frontend (production-ready)
   - ✅ 73+ backend API endpoints (operational)
   - ✅ MongoDB Atlas database (configured)
   - ✅ Capacitor project (Android & iOS platforms added)
   - ✅ All features fully functional

3. **Mobile Configuration**
   - ✅ Capacitor installed and configured
   - ✅ Android project ready (`/frontend/android`)
   - ✅ iOS project ready (`/frontend/ios`)
   - ✅ App ID: `com.emberdating.app`
   - ✅ App Name: Ember Dating App
   - ✅ Icons and splash screens generated (55 icons, 32 splash screens)
   - ✅ Firebase config files placed
   - ✅ All permissions configured

4. **Comprehensive Documentation**
   - ✅ 15,000-word Android build guide
   - ✅ 12,000-word iOS build guide
   - ✅ 20,000-word payment integration guide (Apple IAP + Google Play Billing)
   - ✅ API documentation
   - ✅ Testing procedures
   - ✅ Troubleshooting guides

5. **Backend Access**
   - ✅ Backend URL: https://datenight-app-1.preview.emergentagent.com/api
   - ✅ MongoDB Atlas access (for payment records)
   - ✅ Premium plans endpoint already created
   - ✅ User authentication system ready

6. **Store Assets**
   - ✅ App icon: 512x512 PNG
   - ✅ Privacy Policy URL: https://emberdatingapp.org/privacy
   - ✅ Terms of Service URL: https://emberdatingapp.org/terms
   - ✅ Support email: ember.dating.app25@gmail.com

---

## 📱 Current App Features (Already Built)

**Authentication:**
- Email/password registration and login
- Google OAuth integration
- Apple Sign-In ready
- JWT authentication
- Session management

**Core Features:**
- AI-powered matching algorithm
- Discover feed with swipe interface
- Photo verification system
- Real-time messaging (with GIF support!)
- Video calling (WebRTC)
- Icebreaker games (6 games)
- Virtual gifts (15 types)
- Date suggestions (Google Places API)
- Ambassador program (female-only)
- Advanced filters
- Block and report system

**Premium Features (Need Payment Integration):**
- Premium subscriptions (3 tiers)
- Roses (virtual gifts)
- Super Likes
- See who likes you
- Unlimited likes
- Standouts access
- Profile boost

**Other:**
- Push notifications (Firebase configured)
- Location services
- Image uploads (Cloudinary)
- Support system
- Legal pages (Privacy Policy, Terms)

---

## 🎯 Your Step-by-Step Workflow

### Week 1: Android Development

**Day 1-2: Setup & Build**
- Clone repository
- Install dependencies
- Build web app (`yarn build`)
- Sync with Android (`npx cap sync android`)
- Open in Android Studio
- Configure app (bundle ID, version, signing)
- Build debug APK and test

**Day 3-4: Google Play Billing**
- Create 7 products in Google Play Console
- Install Google Play Billing Library
- Implement billing code (purchase flow, restore purchases)
- Create backend API endpoints for purchase verification
- Test in sandbox with test account
- Fix any issues

**Day 5-6: Store Submission**
- Build signed release AAB
- Create Google Play Console listing (screenshots, description)
- Upload AAB
- Submit for review
- Monitor review status

**Day 7: Buffer/Testing**
- Additional testing
- Fix any review issues
- Respond to Google feedback if needed

---

### Week 2: iOS Development

**Day 8-9: Setup & Build**
- Sync iOS project (`npx cap sync ios`)
- Open in Xcode (Mac or MacinCloud)
- Configure app (bundle ID, signing, capabilities)
- Add StoreKit capability
- Build for simulator and test
- Create archive for App Store

**Day 10-11: Apple In-App Purchase**
- Create 7 products in App Store Connect
- Configure subscription group
- Implement StoreKit code (purchase flow, restore)
- Create backend API endpoints for receipt validation
- Test via TestFlight with sandbox account
- Fix any issues

**Day 12-13: App Store Submission**
- Create App Store Connect listing (screenshots, description)
- Upload build via Xcode
- Complete app information
- Submit for review
- Monitor review status

**Day 14: Buffer/Testing**
- Additional testing
- Fix any review issues
- Respond to Apple feedback if needed

---

### Week 3: Finalization & Launch

**Day 15-16: Integration Testing**
- Test both apps on real devices
- Test all 7 products on both platforms
- Verify backend grants correct entitlements
- Test subscription renewals
- Test purchase restoration

**Day 17-18: Bug Fixes**
- Fix any bugs found
- Optimize performance
- Final testing

**Day 19-20: Launch & Monitoring**
- Both apps go live (after approval)
- Monitor for crashes
- Monitor purchase success rates
- Quick bug fixes if needed

**Day 21: Project Completion**
- Documentation of build process
- Handoff credentials and access
- Final payment release

---

## 🔐 Access You'll Need

### Client Will Provide:

1. **GitHub Access**
   - Repository: https://github.com/Ember-Dating-App/Ember-Dating-App
   - Read/write access to mobile branches

2. **Google Play Console**
   - Account access or collaboration invite
   - For creating products and submitting app

3. **Apple Developer Account**
   - Account access or collaboration invite
   - For creating products and submitting app

4. **Backend Access (if needed)**
   - For creating payment verification endpoints
   - API documentation provided

### You'll Create:

1. **Android Keystore**
   - For signing release builds
   - Will transfer to client securely

2. **iOS Certificates & Provisioning Profiles**
   - Via Xcode automatic signing
   - Or manual via Apple Developer portal

---

## 📊 Backend API Endpoints You'll Create

### Apple In-App Purchase Endpoints:

```
POST /api/billing/apple/verify-purchase
- Verify Apple receipt with App Store Server API
- Grant user entitlements (premium, roses, super likes)
- Return success/failure

POST /api/billing/apple/restore-purchases
- Restore user's previous purchases
- Re-grant entitlements if valid

POST /api/webhooks/apple-notifications
- Handle Apple Server Notifications
- Process subscription renewals, cancellations, refunds
- Update user entitlements accordingly

GET /api/billing/apple/subscription-status
- Check user's current subscription status
- Return expiry date, auto-renew status
```

### Google Play Billing Endpoints:

```
POST /api/billing/google/verify-purchase
- Verify purchase token with Google Play Developer API
- Grant user entitlements
- Acknowledge purchase
- Return success/failure

POST /api/billing/google/restore-purchases
- Restore user's previous purchases
- Re-grant entitlements if valid

POST /api/webhooks/google-rtdn
- Handle Google Real-Time Developer Notifications
- Process subscription events
- Update user entitlements

GET /api/billing/google/subscription-status
- Check user's current subscription status
- Return expiry date, auto-renew status
```

### Shared Endpoints:

```
GET /api/premium/plans
- Already exists! Returns all 7 products with pricing

GET /api/billing/user/entitlements
- Get user's current premium status
- Return: is_premium, premium_expires, roses_count, super_likes_count

POST /api/billing/test/grant-premium
- For testing only (development)
- Manually grant premium/items for testing
```

---

## 🧪 Testing Requirements

### Android Testing Checklist:
- [ ] App installs from APK
- [ ] All pages load correctly
- [ ] Login/register works
- [ ] Camera permission works
- [ ] Location permission works
- [ ] Can browse discover feed
- [ ] Can send messages
- [ ] Can purchase Weekly subscription (sandbox)
- [ ] Can purchase Monthly subscription (sandbox)
- [ ] Can purchase Yearly subscription (sandbox)
- [ ] Can purchase Roses bundle (sandbox)
- [ ] Can purchase Super Likes bundle (sandbox)
- [ ] Backend verifies purchases correctly
- [ ] User receives entitlements (premium status shows)
- [ ] Can restore purchases
- [ ] Push notifications work
- [ ] No crashes

### iOS Testing Checklist:
- [ ] App installs via TestFlight
- [ ] All pages load correctly
- [ ] Login/register works
- [ ] Camera permission works
- [ ] Location permission works
- [ ] Can browse discover feed
- [ ] Can send messages
- [ ] Can purchase Weekly subscription (sandbox)
- [ ] Can purchase Monthly subscription (sandbox)
- [ ] Can purchase Yearly subscription (sandbox)
- [ ] Can purchase Roses bundle (sandbox)
- [ ] Can purchase Super Likes bundle (sandbox)
- [ ] Backend validates receipts correctly
- [ ] User receives entitlements
- [ ] Can restore purchases
- [ ] Push notifications work
- [ ] No crashes

---

## 💵 Payment Structure

### Milestone-Based Payment:

**Milestone 1: 25% ($750 - $1,250)**
- Project kickoff and setup complete
- Android APK built and tested
- You've reviewed all materials
- Development environment ready

**Milestone 2: 25% ($750 - $1,250)**
- Android app submitted to Google Play
- Google Play Billing integrated and working
- Test build provided for client testing
- All 7 products purchasable in sandbox

**Milestone 3: 25% ($750 - $1,250)**
- iOS app submitted to App Store
- Apple In-App Purchase integrated and working
- TestFlight build provided for client testing
- All 7 products purchasable in sandbox

**Milestone 4: 25% ($750 - $1,250)**
- Both apps approved and live on stores
- All purchases working in production
- Backend verification functional
- Users can buy and receive entitlements
- No critical bugs
- Documentation provided

**Total: $3,000 - $5,000 USD**

---

## 📄 Deliverables

### Final Deliverables:

1. **Android App**
   - ✅ Live on Google Play Store
   - ✅ Signed AAB file
   - ✅ Keystore (securely transferred)
   - ✅ Build documentation

2. **iOS App**
   - ✅ Live on Apple App Store
   - ✅ IPA file (if needed)
   - ✅ Certificates and provisioning profiles
   - ✅ Build documentation

3. **Working In-App Purchases**
   - ✅ All 7 products configured in stores
   - ✅ Purchase flows working
   - ✅ Backend verification functional
   - ✅ Users receive entitlements
   - ✅ Restore purchases working

4. **Backend Code**
   - ✅ Payment verification endpoints
   - ✅ Webhook handlers
   - ✅ Committed to GitHub
   - ✅ API documentation

5. **Testing Evidence**
   - ✅ Screen recordings of purchases working
   - ✅ Test purchase receipts
   - ✅ Confirmation both apps are live

6. **Documentation**
   - ✅ Build process documented
   - ✅ How to update apps
   - ✅ How to add new products
   - ✅ Troubleshooting guide

---

## ⏰ Timeline

**Total Duration:** 2-3 weeks

**Week 1:** Android app + Google Play Billing  
**Week 2:** iOS app + Apple In-App Purchase  
**Week 3:** Testing, fixes, launch

**Faster delivery is appreciated and may earn a bonus!**

---

## 🎓 Experience Requirements

### Minimum Qualifications:

- ✅ **3+ years** mobile app development
- ✅ **Published 3+ apps** on both Google Play and App Store
- ✅ **2+ in-app purchase implementations** (proven examples required)
- ✅ **Capacitor or React Native** experience
- ✅ **Available full-time** for 2-3 weeks
- ✅ **English proficiency** (written and spoken)
- ✅ **Daily communication** via chat/video calls

### Portfolio Requirements:

**Please provide:**
1. Links to apps you've published (Google Play & App Store)
2. Examples of apps with in-app purchases you've implemented
3. GitHub profile or code samples
4. Your typical development process
5. Estimated timeline for this project
6. Your rate (fixed price or hourly)

---

## 🚀 How to Apply

### Your Proposal Should Include:

**1. Introduction (3-4 sentences)**
- Brief intro about yourself
- Years of mobile development experience
- Confirmation you've read and understand the requirements

**2. Relevant Experience**
- List 3 apps you've published with links
- Describe your in-app purchase experience
- Mention any dating/social apps you've built

**3. Technical Approach**
- How would you structure the payment integration?
- Which tools/libraries would you use?
- How would you test the in-app purchases?

**4. Timeline & Availability**
- When can you start?
- How long will it take? (realistic estimate)
- Your availability (hours per day)

**5. Pricing**
- Your fixed price for the entire project
- Or your hourly rate + estimated hours
- Payment schedule preference

**6. Questions**
- Any questions or clarifications needed?
- Anything unclear from this posting?

### Application Format:

```
Subject: Mobile Dev - iOS/Android + IAP | [Your Name]

Hi,

[Your introduction]

EXPERIENCE:
- App 1: [Link] - [Description]
- App 2: [Link] - [Description]  
- App 3: [Link] - [Description]

IN-APP PURCHASE EXPERIENCE:
[Describe your IAP implementation experience]

APPROACH:
[How you would implement the payments]

TIMELINE:
Start: [Date]
Completion: [X weeks]
Availability: [X hours/day]

PRICING:
$[Amount] fixed price
OR
$[Rate]/hour x [Hours] = $[Total]

QUESTIONS:
[Your questions]

Looking forward to working with you!
[Your Name]
```

---

## ❓ Frequently Asked Questions

**Q: Do I need a Mac for iOS development?**  
A: Yes, or you can use MacinCloud ($30-60/month) which provides cloud Mac access.

**Q: Will I need to purchase Google Play and Apple Developer accounts?**  
A: No, the client already has these or will provide access.

**Q: Can I use RevenueCat instead of native SDKs?**  
A: Yes, if you prefer! RevenueCat simplifies IAP implementation. Just ensure it meets all requirements.

**Q: What if the apps get rejected during review?**  
A: You're expected to fix issues and resubmit until approved (included in the fixed price).

**Q: Can I work part-time on this?**  
A: Yes, but must commit to completing within 3 weeks maximum.

**Q: Do I need dating app experience?**  
A: Not required, but nice to have. The app is already built - you're just packaging it.

**Q: Will I have access to the backend codebase?**  
A: Yes, full access to GitHub repository including backend (FastAPI/Python).

**Q: What payment processor knowledge do I need?**  
A: You need to know how to implement Apple In-App Purchase and Google Play Billing. No other payment processors involved.

**Q: Is testing included in the price?**  
A: Yes, thorough testing on real devices is expected and included.

---

## ✅ Success Criteria

### Project is complete when:

1. ✅ Android app live on Google Play Store
2. ✅ iOS app live on Apple App Store
3. ✅ All 7 in-app products configured in both stores
4. ✅ Users can purchase subscriptions on both platforms
5. ✅ Users can purchase consumables on both platforms
6. ✅ Backend successfully verifies purchases
7. ✅ Users receive correct entitlements (premium status, roses, super likes)
8. ✅ Restore purchases works on both platforms
9. ✅ No critical bugs
10. ✅ Apps achieve 4.0+ rating initially (no major complaints)

---

## 🎯 Why This is a Great Project

- ✅ **App is already built** - Just mobile packaging + payments
- ✅ **Clear requirements** - Detailed specs and documentation
- ✅ **Fixed scope** - No scope creep, everything defined
- ✅ **Good pay** - $3k-5k for 2-3 weeks work
- ✅ **Complete docs** - 47,000+ words of implementation guides
- ✅ **Responsive client** - Quick communication and decisions
- ✅ **Portfolio piece** - Dating app with payments for your portfolio
- ✅ **Clean code** - Well-organized React + Capacitor project

---

## 🔒 Confidentiality

- All project materials are confidential
- Non-disclosure agreement may be required
- Do not share client's codebase publicly
- Do not use client's work in your portfolio without permission

---

## 📞 Contact

**Preferred:** Apply through this job posting

**Questions?** Message before applying if you need clarification.

**Response Time:** Applications reviewed within 24 hours

---

## 🌟 Bonus Opportunities

**Performance Bonuses:**

- ✅ **Speed Bonus:** $500 if completed in 2 weeks or less
- ✅ **Quality Bonus:** $300 if both apps approved on first submission
- ✅ **Rating Bonus:** $200 if apps achieve 4.5+ rating in first week

**Future Work:**

- App updates and maintenance ($50-100/hour)
- New features implementation
- Performance optimization
- Analytics integration
- Additional payment processors (web version)

---

## 🎉 Ready to Build?

If you're an experienced mobile developer who:
- ✅ Has published apps on both stores
- ✅ Has implemented in-app purchases before
- ✅ Can commit to 2-3 weeks
- ✅ Wants to work on a real dating app

**Then apply now!**

Looking forward to launching Ember Dating App together! 🚀🔥

---

**Project Type:** Fixed Price  
**Experience Level:** Intermediate to Expert  
**Duration:** 2-3 weeks  
**Budget:** $3,000 - $5,000 USD  
**Location:** Remote (Worldwide)  
**Time Zone:** Any (async communication OK, daily check-ins required)

---

*This is a real project with a real budget. Serious applicants only. Provide portfolio links and relevant experience. Low-quality or generic proposals will not be considered.*
