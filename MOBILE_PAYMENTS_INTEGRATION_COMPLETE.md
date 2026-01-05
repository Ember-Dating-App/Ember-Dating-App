# 📱 Mobile Payments Integration - Complete Guide

## Overview

Complete integration playbooks for implementing mobile in-app purchases for the Ember Dating App across both iOS (Apple In-App Purchase) and Android (Google Play Billing) platforms.

---

## Payment Products

### Subscription Tiers (3 products)
1. **Weekly Premium** - $4.99/week
2. **Monthly Premium** - $19.99/month  
3. **Yearly Premium** - $149.99/year

### Add-On Products (4 products)
1. **3 Roses** - $2.99
2. **12 Roses** - $9.99
3. **5 Super Likes** - $4.99
4. **15 Super Likes** - $12.99

**Total Products:** 7 (3 subscriptions + 4 consumables)

---

## Integration Playbooks Created

### 1. Apple In-App Purchase Integration ✅
**Document:** See integration_playbook_expert_v2 output above

**Coverage:**
- App Store Connect setup and product configuration
- iOS StoreKit implementation with React Native/Capacitor
- FastAPI backend receipt validation using App Store Server API
- JWT authentication for Apple API
- Subscription lifecycle management (upgrades/downgrades)
- Purchase restoration
- Testing in sandbox environment
- Common pitfalls and solutions

**Key Technologies:**
- StoreKit (iOS)
- RevenueCat SDK (optional wrapper)
- App Store Server API
- JWT authentication
- MongoDB for transaction storage

---

### 2. Google Play Billing Integration ✅
**Document:** See integration_playbook_expert_v2 output above

**Coverage:**
- Google Play Console setup and product configuration
- Google Play Billing Library 5+ implementation  
- React Native/Capacitor client integration
- FastAPI backend purchase verification using Google Play Developer API
- Real-Time Developer Notifications (RTDN)
- Subscription management and state handling
- Purchase token validation
- Testing procedures
- Common pitfalls and solutions

**Key Technologies:**
- Google Play Billing Library 5+
- RevenueCat SDK (optional wrapper)
- Google Play Developer API
- Service account authentication
- MongoDB for purchase tracking

---

## Implementation Architecture

### Frontend (React Native/Capacitor)
```
Mobile App
├── Purchase Manager
│   ├── Product fetching
│   ├── Purchase initiation
│   ├── Purchase restoration
│   └── State management
├── UI Components
│   ├── Subscription tiers display
│   ├── Add-on products display
│   └── Purchase confirmation
└── API Integration
    ├── Send purchase tokens to backend
    └── Update user entitlements
```

### Backend (FastAPI + MongoDB)
```
API Server
├── Purchase Verification
│   ├── Apple receipt validation
│   ├── Google purchase token validation
│   └── Duplicate prevention
├── Entitlement Management
│   ├── Grant subscriptions
│   ├── Add consumables
│   └── Handle upgrades/downgrades
├── Webhook Handlers
│   ├── Apple Server Notifications
│   └── Google RTDN
└── Database Operations
    ├── Store transactions
    ├── Track subscriptions
    └── Update user entitlements
```

---

## Security Measures

### Authentication
- ✅ JWT tokens for API requests
- ✅ Server-side purchase validation only
- ✅ Never trust client-side claims

### Purchase Validation
- ✅ Verify every purchase token with Apple/Google servers
- ✅ Check purchase state and validity
- ✅ Detect and prevent duplicate tokens
- ✅ Acknowledge purchases within 3 days

### Data Protection
- ✅ Store credentials in environment variables
- ✅ Encrypt sensitive data at rest
- ✅ Use secure connections (HTTPS/TLS)
- ✅ Implement rate limiting

---

## Testing Strategy

### Sandbox Testing (iOS)
1. Create sandbox test accounts in App Store Connect
2. Configure StoreKit configuration file for local testing
3. Test all 7 products
4. Verify subscription renewals (accelerated)
5. Test purchase restoration
6. Test upgrade/downgrade flows

### License Testing (Android)
1. Add test accounts in Google Play Console
2. Upload APK to closed test track
3. Test all 7 products with test account
4. Verify subscription states
5. Test purchase restoration
6. Test RTDN notifications

### Backend Testing
1. Mock purchase tokens for unit tests
2. Integration tests with real API calls
3. Load testing for concurrent purchases
4. Security testing for token replay attacks

---

## Common Implementation Pitfalls

### Both Platforms
1. ❌ **Not acknowledging purchases** → Auto-refund after 3 days
2. ❌ **Client-side only validation** → Security vulnerability
3. ❌ **Missing error handling** → Poor user experience
4. ❌ **No purchase restoration** → Users lose access
5. ❌ **Ignoring linked tokens** → Subscription upgrade issues

### iOS Specific
1. ❌ **Missing In-App Purchase capability** → StoreKit fails
2. ❌ **Incorrect product IDs** → Products not found
3. ❌ **Not handling renewal failures** → Lost revenue
4. ❌ **Missing receipt validation** → Fraud risk

### Android Specific
1. ❌ **Missing BILLING permission** → Purchase flow breaks
2. ❌ **Not consuming consumables** → Can't repurchase
3. ❌ **Ignoring RTDN** → Out-of-sync subscription state
4. ❌ **Not handling linked purchase tokens** → Upgrade/downgrade issues

---

## Next Steps for Implementation

### Phase 1: Setup (Week 1)
1. ✅ Get integration playbooks (COMPLETE)
2. 🔜 Set up App Store Connect products
3. 🔜 Set up Google Play Console products
4. 🔜 Obtain API credentials (Apple & Google)
5. 🔜 Install dependencies in React Native/Capacitor app

### Phase 2: Frontend Implementation (Week 2)
1. 🔜 Initialize billing libraries
2. 🔜 Build subscription UI components
3. 🔜 Build add-on products UI
4. 🔜 Implement purchase flows
5. 🔜 Implement restore purchases

### Phase 3: Backend Implementation (Week 3)
1. 🔜 Set up MongoDB schemas
2. 🔜 Implement Apple receipt validation
3. 🔜 Implement Google purchase verification
4. 🔜 Build entitlement management system
5. 🔜 Set up webhook handlers

### Phase 4: Testing (Week 4)
1. 🔜 Sandbox testing (iOS)
2. 🔜 License testing (Android)
3. 🔜 Backend integration tests
4. 🔜 End-to-end user flows
5. 🔜 Security testing

### Phase 5: Launch (Week 5)
1. 🔜 Submit app for review (iOS & Android)
2. 🔜 Monitor initial rollout
3. 🔜 Set up alerts and monitoring
4. 🔜 Gradual rollout to users
5. 🔜 Full production release

---

## API Endpoints to Implement

### iOS Endpoints
```python
POST /api/billing/apple/verify-purchase
POST /api/billing/apple/verify-subscription  
POST /api/billing/apple/restore-purchases
POST /api/webhooks/apple-server-notifications
GET /api/billing/apple/subscription-status
```

### Android Endpoints
```python
POST /api/billing/google/verify-purchase
POST /api/billing/google/verify-subscription
POST /api/billing/google/restore-purchases
POST /api/webhooks/google-rtdn
GET /api/billing/google/subscription-status
```

### Shared Endpoints
```python
GET /api/billing/products
GET /api/billing/user/entitlements
POST /api/billing/subscription/upgrade
POST /api/billing/subscription/downgrade
POST /api/billing/subscription/cancel
```

---

## Database Schema

### Collections Needed

**transactions**
```javascript
{
  _id: ObjectId,
  user_id: String,
  product_id: String,
  transaction_id: String,
  platform: String, // "ios" | "android"
  purchase_token: String,
  amount: Number,
  currency: String,
  status: String, // "pending" | "verified" | "failed" | "refunded"
  purchase_date: Date,
  created_at: Date,
  updated_at: Date
}
```

**subscriptions**
```javascript
{
  _id: ObjectId,
  user_id: String,
  product_id: String,
  tier: String, // "weekly" | "monthly" | "yearly"
  platform: String,
  original_transaction_id: String,
  start_date: Date,
  renewal_date: Date,
  expiry_date: Date,
  is_active: Boolean,
  auto_renew_enabled: Boolean,
  created_at: Date,
  updated_at: Date
}
```

**user_entitlements**
```javascript
{
  _id: ObjectId,
  user_id: String,
  subscription_tier: String,
  subscription_expiry: Date,
  roses_balance: Number,
  super_likes_balance: Number,
  transaction_history: Array[String],
  created_at: Date,
  updated_at: Date
}
```

---

## Monitoring and Alerts

### Key Metrics to Track
1. Purchase success rate
2. Purchase verification failures
3. Subscription renewal rate
4. Subscription cancellation rate
5. Average revenue per user (ARPU)
6. Lifetime value (LTV)

### Alerts to Set Up
1. Purchase verification failures > 5%
2. Subscription renewal failures > 10%
3. API errors from Apple/Google
4. Webhook delivery failures
5. Duplicate purchase token attempts

---

## Resources

### Apple Documentation
- [App Store Connect In-App Purchases](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/)
- [StoreKit Documentation](https://developer.apple.com/documentation/storekit/)
- [App Store Server API](https://developer.apple.com/documentation/appstoreserverapi/)
- [Receipt Validation](https://developer.apple.com/documentation/storekit/validating-receipts-with-the-app-store)

### Google Documentation
- [Google Play Billing Overview](https://developer.android.com/google/play/billing)
- [Billing Library 5+](https://developer.android.com/google/play/billing/integrate)
- [Google Play Developer API](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases)
- [Real-Time Developer Notifications](https://developer.android.com/google/play/billing/rtdn-reference)

### Additional Resources
- RevenueCat SDK: https://www.revenuecat.com/
- Capacitor In-App Purchases Guide: https://capacitorjs.com/docs/guides/in-app-purchases
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/

---

## Support

For implementation questions or issues:
1. Review the comprehensive playbooks provided above
2. Check the official Apple/Google documentation
3. Test thoroughly in sandbox/test environments
4. Monitor logs and error messages carefully
5. Implement proper error handling for user-facing errors

---

## Summary

✅ **Complete integration playbooks created** for both iOS and Android
✅ **Security best practices** documented and emphasized
✅ **Testing procedures** outlined for both platforms
✅ **Common pitfalls** identified with solutions
✅ **Implementation roadmap** provided (5-week timeline)

**Next Action:** Begin Phase 1 setup by creating products in App Store Connect and Google Play Console

---

**Ready to monetize your Ember Dating App! 🔥💰**
