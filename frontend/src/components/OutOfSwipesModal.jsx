import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';

const OutOfSwipesModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    navigate('/premium');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            You're Out of Swipes!
          </h2>
          <p className="text-gray-600 mb-6">
            Free users get 10 swipes per day. Upgrade to Premium for unlimited swipes and more!
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Unlimited swipes daily</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">See who liked you</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">See who sent you roses</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Priority in discover feed</span>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all mb-3"
          >
            Upgrade to Premium
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium"
          >
            Maybe Later
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Your swipes will reset in 24 hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default OutOfSwipesModal;