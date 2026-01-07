import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Sliders, ChevronDown, ChevronUp, User, Heart, Compass, 
  GraduationCap, MapPin, Ruler, Users, Sparkles, Search, Map
} from 'lucide-react';
import LocationMapPicker from './LocationMapPicker';

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
  
  // Location picker states
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('United States');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  const COUNTRIES = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
    'France', 'Spain', 'Italy', 'Netherlands', 'Japan', 'Singapore', 
    'UAE', 'India', 'Brazil', 'Mexico'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const details = userResponse.data.location_details;
        setLocationDetails(details);
        setCity(details.city || '');
        setState(details.state || '');
        setCountry(details.country || 'United States');
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ember_token');
      
      // Save filters
      await axios.put(
        `${API_BASE}/api/preferences/filters`,
        filters,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Save location if changed
      if (city.trim() && country.trim()) {
        await axios.put(
          `${API_BASE}/api/profile/location`,
          {
            city: city.trim(),
            state: state.trim() || null,
            country: country.trim(),
            latitude: selectedCoordinates?.latitude || null,
            longitude: selectedCoordinates?.longitude || null
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      onApply?.();
      onClose();
    } catch (error) {
      console.error('Error saving filters:', error);
      alert('Failed to save filters');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationData) => {
    setCity(locationData.city);
    setState(''); // Can be extracted from locationData if needed
    setCountry(locationData.country);
    setSelectedCoordinates({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gradient-to-br from-black via-gray-950 to-black rounded-3xl max-w-4xl w-full relative my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-orange-500/20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 backdrop-blur-xl border-b border-orange-500/30 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg shadow-orange-500/30">
                <Sliders className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Advanced Filters</h2>
                <p className="text-sm text-gray-400 mt-0.5">Customize your match preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-orange-500/20 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Personal Section */}
          <div className="bg-black/40 rounded-2xl border border-orange-500/20 overflow-hidden shadow-xl backdrop-blur-sm">
            <button
              onClick={() => toggleSection('personal')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-orange-500/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">Personal</h3>
                  <p className="text-xs text-gray-400">Age, Distance, Location, Height, Gender</p>
                </div>
              </div>
              {expandedSections.personal ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.personal && (
              <div className="p-6 space-y-6 bg-black/60 border-t border-orange-500/20">
                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Age Range
                  </label>
                  <div className="bg-black/40 rounded-xl p-4 border border-orange-500/20 backdrop-blur-sm">
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
                          className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
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
                          className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
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
                  <div className="bg-black/40 rounded-xl p-4 border border-orange-500/20 backdrop-blur-sm">
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
                      className="w-full h-2 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Change Location
                  </label>
                  <div className="bg-black/40 rounded-xl p-4 border border-orange-500/20 backdrop-blur-sm space-y-3">
                    {location && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-3">
                        <p className="text-xs text-gray-400">Current Location</p>
                        <p className="text-sm text-white font-medium">{location}</p>
                      </div>
                    )}
                    
                    {/* Map Button */}
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                    >
                      <Map className="w-5 h-5" />
                      Select Location on Map
                    </button>
                    
                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-black text-gray-500">or type manually</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Enter city"
                        className="w-full px-3 py-2 bg-gradient-to-br from-black via-gray-950 to-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">State/Province (Optional)</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Enter state"
                        className="w-full px-3 py-2 bg-gradient-to-br from-black via-gray-950 to-black border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Country *</label>
                      <div className="relative">
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-3 py-2 bg-black border border-orange-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none cursor-pointer transition-all dark-select"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1rem',
                            colorScheme: 'dark'
                          }}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c} className="bg-black text-white">{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {(city !== (locationDetails?.city || '') || 
                      state !== (locationDetails?.state || '') || 
                      country !== (locationDetails?.country || '')) && city.trim() && country.trim() && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mt-2">
                        <p className="text-xs text-green-400">
                          Location will be updated to: {city}{state ? `, ${state}` : ''}, {country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Height Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Height Range
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <select
                        value={filters.height_min || ''}
                        onChange={(e) => setFilters({ ...filters, height_min: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none cursor-pointer shadow-lg hover:shadow-orange-500/20 transition-all dark-select"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1.25rem',
                          colorScheme: 'dark'
                        }}
                      >
                        <option value="" className="bg-black text-gray-400">Min Height</option>
                        {heightOptions.map(h => (
                          <option key={h.value} value={h.value} className="bg-black text-white">{h.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 relative">
                      <select
                        value={filters.height_max || ''}
                        onChange={(e) => setFilters({ ...filters, height_max: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-4 py-3 bg-black border border-orange-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none cursor-pointer shadow-lg hover:shadow-orange-500/20 transition-all dark-select"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23f97316' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.75rem center',
                          backgroundSize: '1.25rem',
                          colorScheme: 'dark'
                        }}
                      >
                        <option value="" className="bg-black text-gray-400">Max Height</option>
                        {heightOptions.map(h => (
                          <option key={h.value} value={h.value} className="bg-black text-white">{h.label}</option>
                        ))}
                      </select>
                    </div>
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
          <div className="bg-black/40 rounded-2xl border border-orange-500/20 overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('dating')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-orange-500/10 transition-all group"
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
              <div className="p-6 space-y-6 bg-black/60 border-t border-orange-500/20">
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
          <div className="bg-black/40 rounded-2xl border border-orange-500/20 overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('lifestyle')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-orange-500/10 transition-all group"
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
              <div className="p-6 space-y-6 bg-black/60 border-t border-orange-500/20">
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
          <div className="bg-black/40 rounded-2xl border border-orange-500/20 overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('background')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-orange-500/10 transition-all group"
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
              <div className="p-6 space-y-6 bg-black/60 border-t border-orange-500/20">
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
                            : 'bg-black/40 text-gray-300 hover:bg-gray-900/50 border border-orange-500/20'
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
                      <div key={ethnicity} className="bg-gray-800/30 rounded-xl overflow-hidden border border-orange-500/20">
                        {/* Main ethnicity button */}
                        <button
                          onClick={() => {
                            toggleEthnicity(ethnicity);
                            setExpandedEthnicity(expandedEthnicity === ethnicity ? null : ethnicity);
                          }}
                          className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
                            (filters.ethnicities || []).includes(ethnicity)
                              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                              : 'bg-black/40 text-gray-300 hover:bg-gray-900/50'
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
                          <div className="p-4 bg-gray-900/50 border-t border-orange-500/20">
                            <div className="flex flex-wrap gap-2">
                              {ethnicityData[ethnicity].map((subEthnicity) => (
                                <button
                                  key={subEthnicity}
                                  onClick={() => toggleArrayItem('sub_ethnicities', subEthnicity)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    (filters.sub_ethnicities || []).includes(subEthnicity)
                                      ? 'bg-orange-500 text-white shadow-lg'
                                      : 'bg-gray-900/50 text-gray-300 hover:bg-gray-600/50 border border-orange-500/20'
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
        <div className="sticky bottom-0 bg-gradient-to-t from-black via-black to-transparent p-6 pt-8 border-t border-orange-500/20">
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3.5 bg-black/60 border border-orange-500/30 rounded-xl font-semibold text-white hover:bg-orange-500/10 hover:border-orange-500/50 transition-all shadow-lg"
            >
              Reset All
            </button>
            <button
              onClick={handleApply}
              disabled={loading}
              className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-orange-500/25"
            >
              {loading ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Location Map Picker */}
      <LocationMapPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={handleLocationSelect}
        initialLocation={selectedCoordinates ? [selectedCoordinates.latitude, selectedCoordinates.longitude] : null}
      />
    </div>
  );
};

export default AdvancedFiltersModal;
