import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Crown, Sparkles, Heart, X } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const DailyPicksTab = () => {
  const navigate = useNavigate();
  const [picks, setPicks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyPicks();
  }, []);

  const fetchDailyPicks = async () => {
    try {
      const token = localStorage.getItem('ember_token');
      const response = await axios.get(`${API_BASE}/api/discover/daily-picks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPicks(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Profile verification required');
        navigate('/verification');
      } else {
        toast.error('Failed to load daily picks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentProfile) return;

    try {
      const token = localStorage.getItem('ember_token');
      const response = await axios.post(
        `${API_BASE}/api/likes`,
        { liked_user_id: currentProfile.user_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.match) {
        toast.success(`It's a match with ${currentProfile.name}!`, {
          action: {
            label: 'Message',
            onClick: () => navigate(`/messages/${response.data.match.match_id}`)
          }
        });
      } else {
        toast.success('Like sent!');
      }

      nextProfile();
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Daily swipe limit reached');
      } else {
        toast.error('Failed to send like');
      }
    }
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < picks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(picks.length);
    }
  };

  const currentProfile = picks[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your daily picks...</p>
        </div>
      </div>
    );
  }

  if (picks.length === 0 || currentIndex >= picks.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No More Daily Picks!</h2>
          <p className="text-gray-600 mb-6">
            You've seen all your curated picks for today. Check back tomorrow for fresh matches!
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-semibold"
          >
            Browse More Profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white py-6 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6" />
            <h1 className="text-xl font-bold">Daily Picks</h1>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {picks.length}
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Photo */}
          <div className="relative h-96">
            <img
              src={currentProfile.photos?.[0] || 'https://via.placeholder.com/400x600'}
              alt={currentProfile.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1 rounded-full text-white text-sm font-semibold flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Daily Pick
            </div>
          </div>

          {/* Info */}
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">
              {currentProfile.name}, {currentProfile.age}
            </h2>
            {currentProfile.location && (
              <p className="text-gray-600 mb-4">{currentProfile.location}</p>
            )}
            {currentProfile.bio && (
              <p className="text-gray-700 mb-4">{currentProfile.bio}</p>
            )}
            {currentProfile.interests && currentProfile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {currentProfile.interests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 p-6 pt-0">
            <button
              onClick={handlePass}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center gap-2 transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
              <span className="font-semibold text-gray-700">Pass</span>
            </button>
            <button
              onClick={handleLike}
              className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg rounded-full flex items-center justify-center gap-2 transition-all"
            >
              <Heart className="w-6 h-6 text-white" />
              <span className="font-semibold text-white">Like</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPicksTab;