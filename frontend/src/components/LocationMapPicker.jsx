import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Search, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker with premium styling
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(239, 68, 68)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3" fill="rgb(239, 68, 68)"/>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} icon={customIcon} /> : null;
}

// Component to handle map centering
function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

const LocationMapPicker = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation || [40.7128, -74.0060]); // Default to NYC
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locationName, setLocationName] = useState('');
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (initialLocation) {
      setPosition(initialLocation);
      reverseGeocode(initialLocation);
    } else {
      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newPos = [pos.coords.latitude, pos.coords.longitude];
            setPosition(newPos);
            reverseGeocode(newPos);
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }
    }
  }, [initialLocation]);

  useEffect(() => {
    if (position) {
      reverseGeocode(position);
    }
  }, [position]);

  const reverseGeocode = async (coords) => {
    try {
      const [lat, lng] = coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setLocationName(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 500);
  };

  const handleSelectSearchResult = (result) => {
    const newPos = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(newPos);
    setLocationName(result.display_name);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleConfirm = () => {
    if (position && locationName) {
      onSelectLocation({
        latitude: position[0],
        longitude: position[1],
        name: locationName,
        city: extractCity(locationName),
        country: extractCountry(locationName)
      });
      onClose();
    }
  };

  const extractCity = (displayName) => {
    const parts = displayName.split(',');
    return parts[0]?.trim() || '';
  };

  const extractCountry = (displayName) => {
    const parts = displayName.split(',');
    return parts[parts.length - 1]?.trim() || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-[80vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Select Your Location
            </DialogTitle>
          </DialogHeader>

          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for a city or address..."
                value={searchQuery}
                onChange={handleSearchInput}
                className="pl-10 h-12 bg-muted/50 border-muted focus:border-primary rounded-xl"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto bg-background border border-muted rounded-xl">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-muted last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{result.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={position}
              zoom={10}
              className="h-full w-full"
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
              <MapController center={position} />
            </MapContainer>

            {/* Selected Location Info */}
            {locationName && (
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm border border-muted rounded-xl p-4 shadow-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Selected Location:</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {locationName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Click on the map or search to select your location
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!position || !locationName}
                className="ember-gradient ember-glow"
              >
                Confirm Location
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationMapPicker;
