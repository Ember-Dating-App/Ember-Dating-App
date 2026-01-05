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
            <p className="text-gray-300 mb-8">
              At Ember, we take your privacy seriously. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our dating app and services.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">1. Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, gender, sexual orientation</li>
              <li><strong>Profile Information:</strong> Photos, bio, interests, location, relationship preferences</li>
              <li><strong>Communication Data:</strong> Messages you send to other users, support inquiries</li>
              <li><strong>Payment Information:</strong> Processed securely through Apple App Store or Google Play Store</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2. Information We Collect Automatically</h3>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
              <li><strong>Usage Data:</strong> App features used, time spent, interactions with other users</li>
              <li><strong>Location Data:</strong> Approximate location to show nearby matches (with your permission)</li>
              <li><strong>Log Data:</strong> IP address, access times, pages viewed, app crashes</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li>Create and manage your account</li>
              <li>Show your profile to potential matches</li>
              <li>Enable communication between users</li>
              <li>Provide customer support</li>
              <li>Process payments and subscriptions</li>
              <li>Improve and personalize your experience</li>
              <li>Ensure safety and prevent fraud or abuse</li>
              <li>Send you notifications about matches, messages, and updates</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">How We Share Your Information</h2>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-3">We share your information with:</h3>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li><strong>Other Users:</strong> Your profile, photos, and bio are visible to other users based on your settings</li>
              <li><strong>Service Providers:</strong> Cloud hosting, analytics, payment processing, customer support</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights and safety</li>
            </ul>

            <p className="text-gray-300 mb-6">
              We <strong>do not</strong> sell your personal information to third parties for marketing purposes.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Your Rights and Choices</h2>
            <p className="text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Update:</strong> Correct or update your information in the app</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Opt-Out:</strong> Disable location services or push notifications</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Data Security</h2>
            <p className="text-gray-300 mb-6">
              We implement industry-standard security measures to protect your information, including encryption, secure servers, and access controls. However, no system is 100% secure, and we cannot guarantee absolute security of your data.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Data Retention</h2>
            <p className="text-gray-300 mb-6">
              We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will delete your information within 30 days, except where we need to retain it for legal compliance, dispute resolution, or fraud prevention.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Age Restrictions</h2>
            <p className="text-gray-300 mb-6">
              Ember is only for users 18 years of age and older. We do not knowingly collect information from anyone under 18. If we learn that we have collected information from someone under 18, we will delete it immediately.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Third-Party Links and Services</h2>
            <p className="text-gray-300 mb-6">
              Our app may contain links to third-party websites or services (such as social media platforms). We are not responsible for the privacy practices of these third parties. Please review their privacy policies before sharing your information.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">International Data Transfers</h2>
            <p className="text-gray-300 mb-6">
              Your information may be processed and stored in countries other than where you live. We ensure appropriate safeguards are in place to protect your information in compliance with applicable data protection laws.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Changes to This Policy</h2>
            <p className="text-gray-300 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the app. Continued use of Ember after changes take effect means you accept the updated policy.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have questions about this Privacy Policy or want to exercise your rights, please contact us through the Support section in the app settings.
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
