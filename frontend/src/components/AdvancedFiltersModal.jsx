import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Sliders } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const AdvancedFiltersModal = ({ isOpen, onClose, onApply }) => {
  const [filters, setFilters] = useState({
    age_min: 18,
    age_max: 100,
    max_distance: 50,
    height_min: null,
    height_max: null,
    education_levels: [],
    specific_interests: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFilters();
    }
  }, [isOpen]);

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem('ember_token');
      const response = await axios.get(`${API_BASE}/api/preferences/filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilters({ ...filters, ...response.data });
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ember_token');
      await axios.put(
        `${API_BASE}/api/preferences/filters`,
        filters,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onApply?.();
      onClose();
    } catch (error) {
      console.error('Error saving filters:', error);
      alert('Failed to save filters');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      age_min: 18,
      age_max: 100,
      max_distance: 50,
      height_min: null,
      height_max: null,
      education_levels: [],
      specific_interests: []
    });
  };

  if (!isOpen) return null;

  const educationOptions = [
    'High School',
    'Some College',
    'Bachelors',
    'Masters',
    'PhD',
    'Trade School'
  ];

  const interestOptions = [
    'Travel', 'Fitness', 'Music', 'Movies', 'Reading',
    'Cooking', 'Sports', 'Art', 'Gaming', 'Photography',
    'Dancing', 'Hiking', 'Yoga', 'Food', 'Wine'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Sliders className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-gray-800">Advanced Filters</h2>
        </div>

        <div className="space-y-6">
          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range: {filters.age_min} - {filters.age_max}
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={filters.age_min}
                  onChange={(e) => setFilters({ ...filters, age_min: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Min: {filters.age_min}</p>
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={filters.age_max}
                  onChange={(e) => setFilters({ ...filters, age_max: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Max: {filters.age_max}</p>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Distance: {filters.max_distance} miles
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={filters.max_distance}
              onChange={(e) => setFilters({ ...filters, max_distance: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Height Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height Range (inches)
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Min (e.g., 60)"
                value={filters.height_min || ''}
                onChange={(e) => setFilters({ ...filters, height_min: e.target.value ? parseInt(e.target.value) : null })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <input
                type="number"
                placeholder="Max (e.g., 72)"
                value={filters.height_max || ''}
                onChange={(e) => setFilters({ ...filters, height_max: e.target.value ? parseInt(e.target.value) : null })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Level
            </label>
            <div className="flex flex-wrap gap-2">
              {educationOptions.map((edu) => (
                <button
                  key={edu}
                  onClick={() => {
                    const current = filters.education_levels || [];
                    if (current.includes(edu)) {
                      setFilters({ ...filters, education_levels: current.filter(e => e !== edu) });
                    } else {
                      setFilters({ ...filters, education_levels: [...current, edu] });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.education_levels || []).includes(edu)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {edu}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => {
                    const current = filters.specific_interests || [];
                    if (current.includes(interest)) {
                      setFilters({ ...filters, specific_interests: current.filter(i => i !== interest) });
                    } else {
                      setFilters({ ...filters, specific_interests: [...current, interest] });
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.specific_interests || []).includes(interest)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleReset}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFiltersModal;