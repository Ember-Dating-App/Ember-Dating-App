import React, { useState, useEffect } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';

const gf = new GiphyFetch('sckj2hpF4djqRdj7EOOj3VoKuwTJ4bSN'); // Free demo key

export default function GifPicker({ isOpen, onClose, onSelectGif }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTrendingGifs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        searchGifs(searchTerm);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      loadTrendingGifs();
    }
  }, [searchTerm]);

  const loadTrendingGifs = async () => {
    setLoading(true);
    try {
      const { data } = await gf.trending({ limit: 20, rating: 'g' });
      setGifs(data);
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query) => {
    if (!query.trim()) {
      loadTrendingGifs();
      return;
    }
    setLoading(true);
    try {
      const { data } = await gf.search(query, { limit: 20, rating: 'g' });
      setGifs(data);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGifSelect = (gif) => {
    onSelectGif({
      url: gif.images.fixed_width.url,
      id: gif.id,
      width: gif.images.fixed_width.width,
      height: gif.images.fixed_width.height
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white">Choose a GIF</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Search Input */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>

        {/* GIF Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white">Loading GIFs...</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifSelect(gif)}
                  className="relative group rounded-xl overflow-hidden hover:ring-4 hover:ring-orange-500 transition-all"
                >
                  <img
                    src={gif.images.fixed_width.url}
                    alt={gif.title}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-400">Powered by GIPHY</p>
        </div>
      </div>
    </div>
  );
}
