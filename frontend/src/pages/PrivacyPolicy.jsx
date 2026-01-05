import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-bold text-white">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 backdrop-blur-sm">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mt-4 mb-4">1. Introduction</h2>
            <p className="text-gray-300 mb-4">
              Welcome to Ember Dating App. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and share your information when you use our mobile application and services.
            </p>
            <p className="text-gray-300 mb-6">
              <strong>Age Requirement:</strong> Ember Dating App is only available to users who are 18 years of age or older. If you are under 18, you may not use our services.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, gender</li>
              <li><strong>Profile Information:</strong> Photos, bio, height, education, interests, dating preferences</li>
              <li><strong>Verification Data:</strong> Selfies for photo verification, phone number for SMS verification, government ID for identity verification</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store credit card details)</li>
              <li><strong>Communications:</strong> Messages you send through our platform, reports, and customer support inquiries</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Information We Collect Automatically</h3>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li><strong>Location Data:</strong> Approximate location based on IP address or precise location if you grant permission</li>
              <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
              <li><strong>Usage Data:</strong> App features you use, profiles you view, swipes, likes, matches</li>
              <li><strong>Log Data:</strong> IP address, access times, app crashes, performance data</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li><strong>Social Media:</strong> If you connect with Google or Apple Sign-In, we receive basic profile information</li>
              <li><strong>Payment Processors:</strong> Transaction confirmations from Stripe</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li>Create and manage your account</li>
              <li>Provide our dating services and match you with other users</li>
              <li>Process payments and subscriptions</li>
              <li>Send you notifications about matches, messages, and app updates</li>
              <li>Verify your identity and maintain platform safety</li>
              <li>Improve our services and develop new features</li>
              <li>Prevent fraud and enforce our terms of service</li>
              <li>Comply with legal obligations</li>
              <li>Respond to your inquiries and provide customer support</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Sharing Your Information</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 With Other Users</h3>
            <p className="text-gray-300 mb-6">
              Your profile information (photos, bio, interests) is visible to other users. Your exact location is never shared; we only show approximate distance.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 With Service Providers</h3>
            <p className="text-gray-300 mb-2">
              We share information with:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li><strong>Cloudinary:</strong> For image hosting and processing</li>
              <li><strong>Stripe:</strong> For payment processing</li>
              <li><strong>Firebase:</strong> For push notifications</li>
              <li><strong>Google Maps:</strong> For location services</li>
              <li><strong>OpenAI:</strong> For AI-powered features</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.3 For Legal Reasons</h3>
            <p className="text-gray-300 mb-2">
              We may disclose information if required by law, to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li>Comply with legal processes</li>
              <li>Enforce our terms of service</li>
              <li>Protect our rights and safety</li>
              <li>Prevent fraud or illegal activities</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.4 Business Transfers</h3>
            <p className="text-gray-300 mb-6">
              If Ember Dating App is involved in a merger, acquisition, or sale, your information may be transferred to the new entity.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement appropriate security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>Encryption of data in transit (HTTPS/SSL)</li>
              <li>Secure storage of sensitive information</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>
            <p className="text-gray-300 mb-6">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.1 Access and Update</h3>
            <p className="text-gray-300 mb-6">
              You can access and update your profile information through the app settings.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2 Delete Your Account</h3>
            <p className="text-gray-300 mb-6">
              You can delete your account at any time through app settings. This will remove your profile and personal data.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.3 Location Services</h3>
            <p className="text-gray-300 mb-6">
              You can disable location services in your device settings, but this may limit app functionality.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.4 Marketing Communications</h3>
            <p className="text-gray-300 mb-6">
              You can opt out of marketing emails by clicking the unsubscribe link or adjusting notification preferences in the app.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Data Retention</h2>
            <p className="text-gray-300 mb-6">
              We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your data within 30 days, except where we need to retain it for legal compliance.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-300 mb-6">
              Our services are not intended for anyone under 18. We do not knowingly collect information from children. If we learn that we have collected data from someone under 18, we will delete it immediately.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-300 mb-6">
              Your information may be processed in countries other than where you live. We take steps to ensure that your data receives adequate protection.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-300 mb-6">
              We may update this privacy policy from time to time. We will notify you of significant changes by posting the new policy and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">11. Contact Us</h2>
            <p className="text-gray-300 mb-6">
              If you have questions about this privacy policy or our data practices, please contact us through the Support section in your app settings.
            </p>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-sm text-gray-500 text-center">
                Last updated: January 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
