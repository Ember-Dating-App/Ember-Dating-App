import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
          <h1 className="ml-4 text-xl font-bold text-white">Terms of Service</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 backdrop-blur-sm">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-6">
              Welcome to Ember. These Terms of Service govern your access to and use of the Ember mobile application, website, and any related services.
            </p>

            <p className="text-gray-300 mb-8">
              By creating an account or using Ember, you agree to be bound by these Terms. If you do not agree, you must not use the Service.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Eligibility</h2>
            <p className="text-gray-300 mb-4">
              You must be at least 18 years old and older to use Ember.
            </p>
            <p className="text-gray-300 mb-4">
              By using Ember, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>You are not prohibited from using the Service under any applicable laws.</li>
              <li>You will comply with these Terms and all applicable laws and regulations.</li>
            </ul>
            <p className="text-gray-300 mb-6">
              We may suspend or terminate accounts that we believe are being used in violation of this section.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Account Creation and Security</h2>
            <p className="text-gray-300 mb-4">
              To use Ember, you may need to create an account and provide certain information (such as your name, email address, and profile details). You agree that:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>All information you provide is accurate, current, and complete.</li>
              <li>You will keep your information updated as needed.</li>
            </ul>
            <p className="text-gray-300 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li>Maintaining the confidentiality of your login credentials.</li>
              <li>All activity that occurs under your account.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Purpose of the Service</h2>
            <p className="text-gray-300 mb-4">
              Ember is a dating and social connection platform designed to help people meet others for: Romantic relationships, Dating, Friendships and social connections.
            </p>
            <p className="text-gray-300 mb-6">
              We do not guarantee that you will meet a particular type of person, enter into a relationship, or achieve any specific outcome through Ember.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Intellectual Property</h2>
            <p className="text-gray-300 mb-4">
              The Ember name, logo, design, and all related trademarks, graphics, and user interfaces are owned by or licensed to Ember and are protected by copyright and other laws.
            </p>
            <p className="text-gray-300 mb-4">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li>Copy, modify, distribute, or create derivative works from the Service.</li>
              <li>Use Ember's trademarks without our prior written consent.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. User Conduct</h2>
            <p className="text-gray-300 mb-4">
              You agree not to do any of the following while using Ember: Harass, threaten, bully, or abuse any other user.
            </p>
            <p className="text-gray-300 mb-4">
              Post or share:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li>Illegal content</li>
              <li>Explicit sexual content or pornography</li>
              <li>Content that is hateful, discriminatory, or violent</li>
              <li>Content that violates another person's privacy or rights (including photos of others without consent)</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. User Content and License</h2>
            <p className="text-gray-300 mb-4">
              You retain ownership of the content you post on Ember, including photos, profile text, and messages. By posting or uploading User Content, you grant Ember a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>Use, store, display, reproduce, modify, and distribute your User Content</li>
              <li>For the purpose of operating, improving, promoting, and providing the Service.</li>
            </ul>
            <p className="text-gray-300 mb-4">
              You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li>You own or have the necessary rights to your User Content.</li>
              <li>Your User Content does not infringe any third party's rights or violate these Terms.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. In-App Communication and Safety</h2>
            <p className="text-gray-300 mb-4">
              Ember allows you to communicate with other users through in-app messaging and other features. You are solely responsible for your interactions with other users, both online and offline. Ember does not conduct background checks on users and does not guarantee the identity, intentions, or behavior of any user.
            </p>
            <p className="text-gray-300 mb-4">
              You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>Use caution when sharing personal information.</li>
              <li>Meet other users only in safe, public places and follow basic safety practices.</li>
            </ul>
            <p className="text-gray-300 mb-6">
              Ember is not responsible for any disputes, harm, or losses arising from interactions with other users, to the maximum extent permitted by law.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Subscriptions and Payments</h2>
            <p className="text-gray-300 mb-4">
              If Ember offers paid features or subscriptions:
            </p>
            <p className="text-gray-300 mb-4">
              Pricing, billing frequency, and included features will be displayed in the app at the time of purchase. Payments are processed through third-party payment providers (such as the Apple App Store or Google Play Store), and their terms may apply in addition to these Terms.
            </p>
            <p className="text-gray-300 mb-4">
              Unless otherwise stated:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-6 space-y-2">
              <li>Subscriptions automatically renew until cancelled.</li>
              <li>You can cancel at any time through your app store account settings.</li>
              <li>Fees are generally non-refundable, except where required by law or explicitly stated otherwise.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Third-Party Services and Links</h2>
            <p className="text-gray-300 mb-6">
              The Service may contain links to third-party websites, apps, or services. We do not control and are not responsible for third-party content, policies, or practices. Your use of third-party services is at your own risk and subject to their terms and privacy policies.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-gray-300 mb-4">
              To the maximum extent permitted by law:
            </p>
            <p className="text-gray-300 mb-4">
              The Service is provided on an "as is" and "as available" basis. We make no warranties or guarantees, express or implied, regarding:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>Availability, reliability, or accuracy of the Service</li>
              <li>The conduct, identity, or compatibility of users</li>
              <li>Any particular outcomes of using Ember (dates, relationships, etc.).</li>
            </ul>
            <p className="text-gray-300 mb-6">
              Your use of Ember is at your own risk.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">11. Limitation of Liability</h2>
            <p className="text-gray-300 mb-4">
              To the maximum extent permitted by law - Ember and its owners, employees, partners, and affiliates will not be liable for any:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of data, loss of use, loss of goodwill, or loss of opportunities</li>
              <li>Personal injury, emotional distress, or other damages arising from your use of or inability to use the Service or interactions with other users, online or offline.</li>
            </ul>
            <p className="text-gray-300 mb-6">
              Our total liability to you for any claim arising out of or relating to the Service is limited to the amount you paid to Ember (if any) in the 12 months before the event giving rise to the claim. Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">12. Termination</h2>
            <p className="text-gray-300 mb-4">
              You may stop using Ember and delete your account at any time through the app or by contacting us. We may suspend or terminate your account, or limit your access to the Service, at our discretion, including if:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>You violate these Terms or our policies</li>
              <li>We believe your behavior puts us, the Service, or other users at risk.</li>
              <li>We discontinue the Service.</li>
            </ul>
            <p className="text-gray-300 mb-6">
              Upon termination, the licenses granted to you will end, but certain sections of these Terms (such as intellectual property, disclaimers, and limitations of liability) will continue to apply.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">13. Changes to the Service and Terms</h2>
            <p className="text-gray-300 mb-4">
              We may modify or discontinue parts of the Service at any time. We may update these Terms from time to time. When we do:
            </p>
            <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
              <li>We will update the "Last updated" date at the top.</li>
              <li>In some cases we may provide additional notice (for example, in-app or by email).</li>
            </ul>
            <p className="text-gray-300 mb-6">
              Continued use of Ember after changes become effective means you accept the new Terms.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">14. Governing Law and Dispute Resolution</h2>
            <p className="text-gray-300 mb-6">
              These Terms are governed by the laws of the State of Michigan, without regard to its conflict of law rules. Any disputes arising out of or relating to these Terms or the Service will be resolved in the courts located in Michigan, unless applicable law requires otherwise.
            </p>

            <h2 className="text-2xl font-bold text-white mt-8 mb-4">15. Contact Information</h2>
            <p className="text-gray-300 mb-6">
              If you have any questions about these Terms of Service, please contact us via Support.
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
