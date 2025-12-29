import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flame, Star, Flower2 } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const SwipeLimitIndicator = () => {
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/limits/swipes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLimits(response.data);
    } catch (error) {
      console.error('Error fetching limits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !limits) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
      {/* Swipes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-gray-700">Swipes</span>
        </div>
        <div className="text-sm">
          {limits.swipes.unlimited ? (
            <span className="text-orange-600 font-semibold">Unlimited</span>
          ) : (
            <span className={limits.swipes.remaining === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
              {limits.swipes.remaining}/{limits.swipes.max} left
            </span>
          )}
        </div>
      </div>

      {/* Super Likes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-700">Super Likes</span>
        </div>
        <div className="text-sm">
          <span className={limits.super_likes.remaining === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {limits.super_likes.remaining}/{limits.super_likes.max} left
          </span>
        </div>
      </div>

      {/* Roses */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flower2 className="w-5 h-5 text-pink-500" />
          <span className="font-medium text-gray-700">Roses</span>
        </div>
        <div className="text-sm">
          <span className={limits.roses.remaining === 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {limits.roses.remaining}/{limits.roses.max} left
          </span>
        </div>
      </div>

      {limits.swipes.remaining === 0 && !limits.swipes.unlimited && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Resets in 24 hours
          </p>
        </div>
      )}
    </div>
  );
};

export default SwipeLimitIndicator;