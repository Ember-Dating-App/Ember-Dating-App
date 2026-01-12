import { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Search, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GoogleMapPicker = ({ isOpen, onClose, onSelectLocation, initialLocation }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [predictions, setPredictions] = useState([]);
  
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && mapRef.current && !map) {
      initializeMap();
    }
  }, [isOpen]);

  const initializeMap = async () => {
    try {
      const loader = new Loader({
        apiKey: 'AIzaSyB9zrvM6dvLBA2CsfAkQCBS2vsQ4qPFBe4', // Your Google API key
        version: 'weekly',
        libraries: ['places']
      });

      const google = await loader.load();
      
      // Initial position (user's location or default)
      const initialPos = initialLocation 
        ? { lat: initialLocation[0], lng: initialLocation[1] }
        : { lat: 40.7128, lng: -74.0060 }; // NYC default

      // Create map with premium dark styling
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: initialPos,
        zoom: 12,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{"color": "#212121"}]
          },
          {
            "elementType": "labels.icon",
            "stylers": [{"visibility": "off"}]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#757575"}]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#212121"}]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [{"color": "#757575"}]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#757575"}]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{"color": "#181818"}]
          },
          {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#616161"}]
          },
          {
            "featureType": "road",
            "elementType": "geometry.fill",
            "stylers": [{"color": "#2c2c2c"}]
          },
          {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#8a8a8a"}]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{"color": "#000000"}]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#3d3d3d"}]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true
      });

      setMap(mapInstance);

      // Initialize services
      const autocomplete = new google.maps.places.AutocompleteService();
      const places = new google.maps.places.PlacesService(mapInstance);
      setAutocompleteService(autocomplete);
      setPlacesService(places);

      // Create marker
      const markerInstance = new google.maps.Marker({
        map: mapInstance,
        position: initialPos,
        draggable: true,
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3
        }
      });

      setMarker(markerInstance);

      // Handle marker drag
      markerInstance.addListener('dragend', () => {
        const position = markerInstance.getPosition();
        handleLocationSelect(position.lat(), position.lng());
      });

      // Handle map clicks
      mapInstance.addListener('click', (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        markerInstance.setPosition(event.latLng);
        handleLocationSelect(lat, lng);
      });

      // Get initial location name
      if (initialLocation) {
        handleLocationSelect(initialPos.lat, initialPos.lng);
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const handleLocationSelect = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      
      if (result.results[0]) {
        const address = result.results[0];
        const addressComponents = address.address_components;
        
        let city = '';
        let country = '';
        
        addressComponents.forEach(component => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        });

        setSelectedLocation({
          latitude: lat,
          longitude: lng,
          name: address.formatted_address,
          city: city || address.formatted_address.split(',')[0],
          country: country
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    
    if (!value || value.length < 3 || !autocompleteService) {
      setPredictions([]);
      return;
    }

    autocompleteService.getPlacePredictions(
      { input: value },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setPredictions(predictions || []);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  const handleSelectPrediction = (prediction) => {
    if (!placesService) return;

    placesService.getDetails(
      { placeId: prediction.place_id },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          map.setCenter({ lat, lng });
          map.setZoom(14);
          marker.setPosition({ lat, lng });
          
          handleLocationSelect(lat, lng);
          setSearchQuery('');
          setPredictions([]);
        }
      }
    );
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-[85vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MapPin className="w-6 h-6 text-primary" />
              Select Your Location
            </DialogTitle>
          </DialogHeader>

          {/* Search Bar */}
          <div className="p-4 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a city or place..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-12 bg-background border-muted focus:border-primary rounded-xl"
              />
            </div>

            {/* Autocomplete Results */}
            {predictions.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto bg-background border border-muted rounded-xl shadow-lg">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelectPrediction(prediction)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-muted last:border-0 flex items-start gap-3"
                  >
                    <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {prediction.structured_formatting.main_text}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm border border-muted rounded-xl p-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Selected Location:</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {selectedLocation.name}
                    </p>
                    {selectedLocation.city && selectedLocation.country && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedLocation.city}, {selectedLocation.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex justify-between items-center bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Click on the map or search to select your location
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedLocation}
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

export default GoogleMapPicker;
