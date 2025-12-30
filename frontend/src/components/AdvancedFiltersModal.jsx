import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const AdvancedFiltersModal = ({ isOpen, onClose, onApply }) => {
  const [filters, setFilters] = useState({
    age_min: 18,
    age_max: 100,
    max_distance: 50,
    height_min: null,
    height_max: null,
    education_levels: [],
    specific_interests: [],
    genders: [],
    dating_purposes: [],
    religions: [],
    languages: [],
    children_preference: [],
    political_views: [],
    pets: [],
    ethnicities: [],
    sub_ethnicities: []
  });
  const [loading, setLoading] = useState(false);
  const [expandedEthnicity, setExpandedEthnicity] = useState(null);

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
      specific_interests: [],
      genders: [],
      dating_purposes: [],
      religions: [],
      languages: [],
      children_preference: [],
      political_views: [],
      pets: [],
      ethnicities: [],
      sub_ethnicities: []
    });
  };

  const toggleArrayItem = (key, item) => {
    const current = filters[key] || [];
    if (current.includes(item)) {
      setFilters({ ...filters, [key]: current.filter(i => i !== item) });
    } else {
      setFilters({ ...filters, [key]: [...current, item] });
    }
  };

  const toggleEthnicity = (ethnicity) => {
    toggleArrayItem('ethnicities', ethnicity);
    // If deselecting main ethnicity, remove all sub-ethnicities
    if ((filters.ethnicities || []).includes(ethnicity)) {
      const subEthnicitiesToRemove = ethnicityData[ethnicity] || [];
      setFilters({
        ...filters,
        ethnicities: (filters.ethnicities || []).filter(e => e !== ethnicity),
        sub_ethnicities: (filters.sub_ethnicities || []).filter(
          se => !subEthnicitiesToRemove.includes(se)
        )
      });
    }
  };

  if (!isOpen) return null;

  // Data
  const educationOptions = [
    'High School', 'Some College', 'Bachelors', 'Masters', 'PhD', 'Trade School'
  ];

  const interestOptions = [
    'Travel', 'Fitness', 'Music', 'Movies', 'Reading',
    'Cooking', 'Sports', 'Art', 'Gaming', 'Photography',
    'Dancing', 'Hiking', 'Yoga', 'Food', 'Wine'
  ];

  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other'];

  const datingPurposeOptions = [
    'Long-term Relationship', 'Short-term Relationship',
    'Casual Dating', 'Friendship', 'Not Sure Yet'
  ];

  const religionOptions = [
    'Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Judaism',
    'Sikhism', 'Agnostic', 'Atheist', 'Spiritual', 'Other'
  ];

  const languageOptions = [
    'English', 'Spanish', 'Mandarin', 'Hindi', 'Arabic',
    'Portuguese', 'French', 'German', 'Japanese', 'Korean',
    'Italian', 'Russian', 'Vietnamese', 'Tagalog', 'Other'
  ];

  const childrenOptions = [
    'Have children', 'Don\'t have children',
    'Want children someday', 'Don\'t want children',
    'Open to children'
  ];

  const politicalOptions = [
    'Liberal', 'Moderate', 'Conservative', 'Apolitical', 'Other'
  ];

  const petOptions = [
    'Have dogs', 'Have cats', 'Have other pets',
    'Love pets but don\'t have', 'Not a pet person', 'Allergic to pets'
  ];

  const ethnicityData = {
    'Asian': [
      'Chinese', 'Japanese', 'Korean', 'Filipino', 'Thai',
      'Indian', 'Pakistani', 'Bangladeshi', 'Taiwanese', 'Indonesian',
      'Cambodian', 'Vietnamese', 'Malaysian', 'Singaporean', 'Sri Lankan',
      'Burmese', 'Nepalese', 'Mongolian', 'Other Asian'
    ],
    'Black': [
      'African American', 'Caribbean', 'Nigerian', 'Ghanaian',
      'Kenyan', 'Ethiopian', 'South African', 'Jamaican',
      'Haitian', 'Trinidadian', 'Other African', 'Other Caribbean'
    ],
    'Hispanic/Latino': [
      'Mexican', 'Puerto Rican', 'Cuban', 'Colombian',
      'Salvadoran', 'Dominican', 'Guatemalan', 'Honduran',
      'Peruvian', 'Venezuelan', 'Argentinian', 'Chilean',
      'Ecuadorian', 'Costa Rican', 'Panamanian', 'Other Latin American'
    ],
    'White/Caucasian': [
      'American', 'British', 'Irish', 'German', 'Italian',
      'French', 'Polish', 'Russian', 'Greek', 'Spanish',
      'Portuguese', 'Dutch', 'Scandinavian', 'Eastern European',
      'Other European'
    ],
    'Arab/Middle Eastern': [
      'Lebanese', 'Egyptian', 'Saudi Arabian', 'Emirati',
      'Jordanian', 'Palestinian', 'Syrian', 'Iraqi',
      'Moroccan', 'Tunisian', 'Algerian', 'Iranian',
      'Turkish', 'Other Middle Eastern'
    ],
    'Other': [
      'Mixed/Multiracial', 'Native American', 'Pacific Islander',
      'Aboriginal Australian', 'Maori', 'Indigenous',
      'Prefer not to say'
    ]
  };

  // Height options (4'0" to 7'0")
  const heightOptions = [];
  for (let feet = 4; feet <= 7; feet++) {
    for (let inches = 0; inches < 12; inches++) {
      const totalInches = feet * 12 + inches;
      if (totalInches >= 48 && totalInches <= 84) {
        heightOptions.push({
          value: totalInches,
          label: `${feet}'${inches}"`
        });
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="sticky top-0 float-right text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6 clear-both">
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

          {/* Height Range - Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height Range
            </label>
            <div className="flex gap-4">
              <select
                value={filters.height_min || ''}
                onChange={(e) => setFilters({ ...filters, height_min: e.target.value ? parseInt(e.target.value) : null })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Min Height</option>
                {heightOptions.map(h => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
              <select
                value={filters.height_max || ''}
                onChange={(e) => setFilters({ ...filters, height_max: e.target.value ? parseInt(e.target.value) : null })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Max Height</option>
                {heightOptions.map(h => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <div className="flex flex-wrap gap-2">
              {genderOptions.map((gender) => (
                <button
                  key={gender}
                  onClick={() => toggleArrayItem('genders', gender)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.genders || []).includes(gender)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Dating Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dating Purpose
            </label>
            <div className="flex flex-wrap gap-2">
              {datingPurposeOptions.map((purpose) => (
                <button
                  key={purpose}
                  onClick={() => toggleArrayItem('dating_purposes', purpose)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.dating_purposes || []).includes(purpose)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {purpose}
                </button>
              ))}
            </div>
          </div>

          {/* Religion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Religion
            </label>
            <div className="flex flex-wrap gap-2">
              {religionOptions.map((religion) => (
                <button
                  key={religion}
                  onClick={() => toggleArrayItem('religions', religion)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.religions || []).includes(religion)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {religion}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Languages
            </label>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((language) => (
                <button
                  key={language}
                  onClick={() => toggleArrayItem('languages', language)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.languages || []).includes(language)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Children */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Children
            </label>
            <div className="flex flex-wrap gap-2">
              {childrenOptions.map((child) => (
                <button
                  key={child}
                  onClick={() => toggleArrayItem('children_preference', child)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.children_preference || []).includes(child)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {child}
                </button>
              ))}
            </div>
          </div>

          {/* Political View */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Political View
            </label>
            <div className="flex flex-wrap gap-2">
              {politicalOptions.map((political) => (
                <button
                  key={political}
                  onClick={() => toggleArrayItem('political_views', political)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.political_views || []).includes(political)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {political}
                </button>
              ))}
            </div>
          </div>

          {/* Pets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pets
            </label>
            <div className="flex flex-wrap gap-2">
              {petOptions.map((pet) => (
                <button
                  key={pet}
                  onClick={() => toggleArrayItem('pets', pet)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    (filters.pets || []).includes(pet)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pet}
                </button>
              ))}
            </div>
          </div>

          {/* Ethnicity - Hierarchical */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ethnicity
            </label>
            <div className="space-y-2">
              {Object.keys(ethnicityData).map((ethnicity) => (
                <div key={ethnicity} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Main ethnicity button */}
                  <button
                    onClick={() => {
                      toggleEthnicity(ethnicity);
                      setExpandedEthnicity(expandedEthnicity === ethnicity ? null : ethnicity);
                    }}
                    className={`w-full px-4 py-2 flex items-center justify-between transition-colors ${
                      (filters.ethnicities || []).includes(ethnicity)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{ethnicity}</span>
                    {expandedEthnicity === ethnicity ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {/* Sub-ethnicities */}
                  {expandedEthnicity === ethnicity && (
                    <div className="p-3 bg-white border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {ethnicityData[ethnicity].map((subEthnicity) => (
                          <button
                            key={subEthnicity}
                            onClick={() => toggleArrayItem('sub_ethnicities', subEthnicity)}
                            className={`px-2 py-1 rounded-full text-xs transition-colors ${
                              (filters.sub_ethnicities || []).includes(subEthnicity)
                                ? 'bg-orange-400 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {subEthnicity}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
                  onClick={() => toggleArrayItem('education_levels', edu)}
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
                  onClick={() => toggleArrayItem('specific_interests', interest)}
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
        <div className="flex gap-3 mt-8 sticky bottom-0 bg-white pt-4">
          <button
            onClick={handleReset}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset All
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
