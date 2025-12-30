import React from 'react';
import { Heart, MessageCircle, Camera, Sparkles } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function Tips() {
  const tips = [
    {
      id: 1,
      title: 'Be Yourself',
      description: 'Authenticity is attractive. Share your true interests, hobbies, and personality. Don\'t try to be someone you\'re not - the right match will appreciate the real you.',
      image: 'https://customer-assets.emergentagent.com/job_86477646-2e90-46fb-b067-2b904774d798/artifacts/hpaczc2s_flower%20girl.jpg',
      icon: Heart,
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 2,
      title: 'Start Conversations',
      description: 'Don\'t wait for others to message first! Take the initiative and send a thoughtful message. Reference something from their profile to show you\'re genuinely interested.',
      image: 'https://customer-assets.emergentagent.com/job_86477646-2e90-46fb-b067-2b904774d798/artifacts/p28a490f_coffee.jpg',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 3,
      title: 'Choose Great Photos',
      description: 'Your photos are your first impression. Use clear, high-quality images that show your face and personality. Include a mix of close-ups and full-body shots in different settings.',
      image: 'https://customer-assets.emergentagent.com/job_86477646-2e90-46fb-b067-2b904774d798/artifacts/ov9tla8k_6426.webp',
      icon: Camera,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: 4,
      title: 'Be Open-Minded',
      description: 'Give people a chance even if they don\'t match your "perfect type." Some of the best relationships come from unexpected connections. Stay positive and keep an open heart.',
      image: 'https://customer-assets.emergentagent.com/job_86477646-2e90-46fb-b067-2b904774d798/artifacts/1pnlz88h_couple.jpg',
      icon: Sparkles,
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-['Orbitron'] text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
              EMBER
            </span>
          </div>
          <h1 className="text-lg font-semibold text-gray-800">Dating Tips</h1>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Make the Most of Ember
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Follow these expert tips to increase your matches, start great conversations, and find meaningful connections.
          </p>
        </div>
      </div>

      {/* Tips Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tips.map((tip, index) => (
            <div
              key={tip.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={tip.image}
                  alt={tip.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className={`absolute top-4 right-4 w-12 h-12 bg-gradient-to-r ${tip.color} rounded-full flex items-center justify-center shadow-lg`}>
                  <tip.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {tip.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Tips Section */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Quick Tips for Success
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-800">Update Regularly</p>
                <p className="text-sm text-gray-600">Keep your profile fresh with new photos and prompts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-800">Be Respectful</p>
                <p className="text-sm text-gray-600">Treat everyone with kindness and respect</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-800">Stay Safe</p>
                <p className="text-sm text-gray-600">Meet in public places and trust your instincts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-800">Be Patient</p>
                <p className="text-sm text-gray-600">Finding the right person takes time - stay positive!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-800">Ask Questions</p>
                <p className="text-sm text-gray-600">Show genuine interest in getting to know them</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-800">Have Fun</p>
                <p className="text-sm text-gray-600">Enjoy the journey and don't take it too seriously</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">Ready to Find Your Match?</h3>
          <p className="mb-6 opacity-90">
            Put these tips into action and start making meaningful connections today!
          </p>
          <button
            onClick={() => window.location.href = '/discover'}
            className="bg-white text-orange-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            Start Swiping
          </button>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
