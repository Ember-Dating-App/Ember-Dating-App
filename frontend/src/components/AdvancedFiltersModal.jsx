import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Sliders, ChevronDown, ChevronUp, User, Heart, Compass, 
  GraduationCap, MapPin, Ruler, Users, Sparkles 
} from 'lucide-react';
import LocationPicker from './LocationPicker';

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
  const [location, setLocation] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedEthnicity, setExpandedEthnicity] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    dating: true,
    lifestyle: true,
    background: true
  });

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
      
      // Also fetch current user location
      const userResponse = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userResponse.data.location) {
        setLocation(userResponse.data.location);
      }
      if (userResponse.data.location_details) {
        setLocationDetails(userResponse.data.location_details);
      }
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl max-w-4xl w-full relative my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 backdrop-blur-xl border-b border-white/10 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg">
                <Sliders className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Advanced Filters</h2>
                <p className="text-sm text-gray-400 mt-0.5">Customize your match preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Personal Section */}
          <div className="bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 group-hover:shadow-lg transition-all">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Personal</h3>
                  <p className="text-xs text-gray-400">Age, Distance, Height, Gender</p>
                </div>
              </div>
              {expandedSections.personal ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.personal && (
              <div className="p-6 space-y-6 bg-gray-900/30 border-t border-white/5">
                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Age Range
                  </label>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold ember-text-gradient">{filters.age_min}</span>
                      <span className="text-gray-500">to</span>
                      <span className="text-2xl font-bold ember-text-gradient">{filters.age_max}</span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="18"
                          max="100"
                          value={filters.age_min}
                          onChange={(e) => setFilters({ ...filters, age_min: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">Minimum</p>
                      </div>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="18"
                          max="100"
                          value={filters.age_max}
                          onChange={(e) => setFilters({ ...filters, age_max: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">Maximum</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Distance */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Maximum Distance
                  </label>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-center mb-3">
                      <span className="text-3xl font-bold ember-text-gradient">{filters.max_distance}</span>
                      <span className="text-gray-400 ml-2">miles</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={filters.max_distance}
                      onChange={(e) => setFilters({ ...filters, max_distance: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                </div>

                {/* Height Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Height Range
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={filters.height_min || ''}
                      onChange={(e) => setFilters({ ...filters, height_min: e.target.value ? parseInt(e.target.value) : null })}
                      className="flex-1 px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Min Height</option>
                      {heightOptions.map(h => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </select>
                    <select
                      value={filters.height_max || ''}
                      onChange={(e) => setFilters({ ...filters, height_max: e.target.value ? parseInt(e.target.value) : null })}
                      className="flex-1 px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Gender Preference
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {genderOptions.map((gender) => (
                      <button
                        key={gender}
                        onClick={() => toggleArrayItem('genders', gender)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.genders || []).includes(gender)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dating Preferences Section */}
          <div className="bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('dating')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-600 group-hover:shadow-lg transition-all">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Dating Preferences</h3>
                  <p className="text-xs text-gray-400">Purpose, Religion, Languages</p>
                </div>
              </div>
              {expandedSections.dating ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.dating && (
              <div className="p-6 space-y-6 bg-gray-900/30 border-t border-white/5">
                {/* Dating Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Dating Purpose
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {datingPurposeOptions.map((purpose) => (
                      <button
                        key={purpose}
                        onClick={() => toggleArrayItem('dating_purposes', purpose)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.dating_purposes || []).includes(purpose)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {purpose}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Religion
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {religionOptions.map((religion) => (
                      <button
                        key={religion}
                        onClick={() => toggleArrayItem('religions', religion)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.religions || []).includes(religion)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {religion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {languageOptions.map((language) => (
                      <button
                        key={language}
                        onClick={() => toggleArrayItem('languages', language)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.languages || []).includes(language)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lifestyle Section */}
          <div className="bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('lifestyle')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 group-hover:shadow-lg transition-all">
                  <Compass className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Lifestyle</h3>
                  <p className="text-xs text-gray-400">Children, Politics, Pets, Interests</p>
                </div>
              </div>
              {expandedSections.lifestyle ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.lifestyle && (
              <div className="p-6 space-y-6 bg-gray-900/30 border-t border-white/5">
                {/* Children */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Children
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {childrenOptions.map((child) => (
                      <button
                        key={child}
                        onClick={() => toggleArrayItem('children_preference', child)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.children_preference || []).includes(child)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {child}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Political View */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Political View
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {politicalOptions.map((political) => (
                      <button
                        key={political}
                        onClick={() => toggleArrayItem('political_views', political)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.political_views || []).includes(political)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {political}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pets */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Pets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {petOptions.map((pet) => (
                      <button
                        key={pet}
                        onClick={() => toggleArrayItem('pets', pet)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.pets || []).includes(pet)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {pet}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Interests
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleArrayItem('specific_interests', interest)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.specific_interests || []).includes(interest)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Background Section */}
          <div className="bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('background')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 group-hover:shadow-lg transition-all">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Background</h3>
                  <p className="text-xs text-gray-400">Education, Ethnicity</p>
                </div>
              </div>
              {expandedSections.background ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.background && (
              <div className="p-6 space-y-6 bg-gray-900/30 border-t border-white/5">
                {/* Education */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Education Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {educationOptions.map((edu) => (
                      <button
                        key={edu}
                        onClick={() => toggleArrayItem('education_levels', edu)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          (filters.education_levels || []).includes(edu)
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-white/10'
                        }`}
                      >
                        {edu}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ethnicity */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Ethnicity
                  </label>
                  <div className="space-y-2">
                    {Object.keys(ethnicityData).map((ethnicity) => (
                      <div key={ethnicity} className="bg-gray-800/30 rounded-xl overflow-hidden border border-white/10">
                        {/* Main ethnicity button */}
                        <button
                          onClick={() => {
                            toggleEthnicity(ethnicity);
                            setExpandedEthnicity(expandedEthnicity === ethnicity ? null : ethnicity);
                          }}
                          className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
                            (filters.ethnicities || []).includes(ethnicity)
                              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
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
                          <div className="p-4 bg-gray-900/50 border-t border-white/5">
                            <div className="flex flex-wrap gap-2">
                              {ethnicityData[ethnicity].map((subEthnicity) => (
                                <button
                                  key={subEthnicity}
                                  onClick={() => toggleArrayItem('sub_ethnicities', subEthnicity)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    (filters.sub_ethnicities || []).includes(subEthnicity)
                                      ? 'bg-orange-500 text-white shadow-lg'
                                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-white/10'
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
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent p-6 pt-8">
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3.5 bg-gray-800/50 border border-white/10 rounded-xl font-semibold text-white hover:bg-gray-700/50 transition-all"
            >
              Reset All
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFiltersModal;
