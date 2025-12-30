import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Star, DollarSign, Send, Search, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';

export default function DateSuggestionsModal({ open, onClose, matchId, onSendSuggestion }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('restaurant');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Get user's location
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, [open]);

  // Fetch categories
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/places/categories`, {
        headers,
        withCredentials: true
      });
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const searchPlaces = async () => {
    if (!searchQuery.trim() && selectedCategory === 'all') {
      toast.error('Please enter a search term or select a category');
      return;
    }

    setLoading(true);
    try {
      const params = {
        query: searchQuery || selectedCategory,
        place_type: selectedCategory,
        ...(userLocation && {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 10000 // 10km
        })
      };

      const response = await axios.get(`${API}/places/search`, {
        params,
        headers,
        withCredentials: true
      });

      setPlaces(response.data.places || []);
      
      if (response.data.places.length === 0) {
        toast.info('No places found. Try a different search.');
      }
    } catch (error) {
      console.error('Error searching places:', error);
      toast.error('Failed to search places');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSuggestion = async (place) => {
    try {
      // Extract photo URL if available
      let photoUrl = null;
      if (place.photos && place.photos.length > 0) {
        const photoName = place.photos[0].name;
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?key=${API_KEY}&maxHeightPx=400&maxWidthPx=400`;
      }

      const placeData = {
        id: place.id,
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress || '',
        rating: place.rating || 0,
        priceLevel: place.priceLevel || 'PRICE_LEVEL_UNSPECIFIED',
        photo_url: photoUrl,
        maps_url: place.googleMapsUri || '',
        website_url: place.websiteUri || '',
        types: place.types || []
      };

      const response = await axios.post(
        `${API}/messages/date-suggestion`,
        {
          match_id: matchId,
          place_data: placeData,
          message: `How about we check out ${placeData.name}? 📍`
        },
        { headers, withCredentials: true }
      );

      toast.success('Date suggestion sent!');
      onSendSuggestion(response.data);
      onClose();
    } catch (error) {
      console.error('Error sending suggestion:', error);
      toast.error('Failed to send suggestion');
    }
  };

  const getPriceLevelSymbol = (priceLevel) => {
    const levels = {
      'PRICE_LEVEL_FREE': 'Free',
      'PRICE_LEVEL_INEXPENSIVE': '$',
      'PRICE_LEVEL_MODERATE': '$$',
      'PRICE_LEVEL_EXPENSIVE': '$$$',
      'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$',
      'PRICE_LEVEL_UNSPECIFIED': 'N/A'
    };
    return levels[priceLevel] || 'N/A';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Suggest a Date Spot</DialogTitle>
              <DialogDescription>
                Find the perfect place for your date
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Controls */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label>Search for a place</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
                    placeholder="e.g., Italian restaurants, coffee shops..."
                    className="pl-10 bg-muted border-border"
                  />
                </div>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={searchPlaces}
              disabled={loading}
              className="w-full ember-gradient"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Places
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {places.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">
                {places.length} places found
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {places.map((place) => (
                  <Card
                    key={place.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPlace(place)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {place.displayName?.text || 'Unknown'}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {place.formattedAddress}
                          </p>

                          <div className="flex items-center gap-3 mt-2">
                            {place.rating && (
                              <div className="flex items-center gap-1 text-xs">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{place.rating.toFixed(1)}</span>
                                {place.userRatingCount && (
                                  <span className="text-muted-foreground">
                                    ({place.userRatingCount})
                                  </span>
                                )}
                              </div>
                            )}

                            {place.priceLevel && place.priceLevel !== 'PRICE_LEVEL_UNSPECIFIED' && (
                              <div className="flex items-center gap-1 text-xs">
                                <DollarSign className="w-3 h-3 text-green-500" />
                                <span>{getPriceLevelSymbol(place.priceLevel)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendSuggestion(place);
                          }}
                          className="ember-gradient shrink-0"
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!loading && places.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Search for places to suggest for your date</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
