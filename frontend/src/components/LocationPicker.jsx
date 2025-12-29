import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 
  'France', 'Spain', 'Italy', 'Netherlands', 'Japan', 'Singapore', 
  'UAE', 'India', 'Brazil', 'Mexico'
];

export default function LocationPicker({ open, onOpenChange, onLocationUpdate }) {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [popularLocations, setPopularLocations] = useState([]);
  const [city, setCity] = useState(user?.location_details?.city || '');
  const [state, setState] = useState(user?.location_details?.state || '');
  const [country, setCountry] = useState(user?.location_details?.country || 'United States');
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (open) {
      fetchPopularLocations();
    }
  }, [open]);

  const fetchPopularLocations = async () => {
    try {
      const response = await axios.get(`${API}/locations/popular`, { headers, withCredentials: true });
      setPopularLocations(response.data.locations);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleSave = async () => {
    if (!city.trim() || !country.trim()) {
      toast.error('Please enter a city and country');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API}/profile/location`, {
        city: city.trim(),
        state: state.trim() || null,
        country: country.trim()
      }, { headers, withCredentials: true });

      setUser(response.data);
      toast.success('Location updated!');
      onLocationUpdate?.(response.data);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const selectPopularLocation = (loc) => {
    setCity(loc.city);
    setState(loc.state || '');
    setCountry(loc.country);
  };

  const filteredLocations = popularLocations.filter(loc => 
    loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Change Your Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current location */}
          {user?.location && (
            <div className="bg-muted rounded-xl p-3">
              <p className="text-sm text-muted-foreground">Current location</p>
              <p className="font-medium">{user.location}</p>
            </div>
          )}

          {/* Manual input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
                className="bg-muted/50 border-muted rounded-xl"
                data-testid="city-input"
              />
            </div>

            <div className="space-y-2">
              <Label>State/Province</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="NY (optional)"
                className="bg-muted/50 border-muted rounded-xl"
                data-testid="state-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Country *</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-muted/50 border-muted rounded-xl" data-testid="country-select">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Popular locations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Popular Cities</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 h-8 w-40 bg-muted/50 border-muted rounded-full text-sm"
                  data-testid="search-location-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {filteredLocations.map((loc, i) => (
                <button
                  key={i}
                  onClick={() => selectPopularLocation(loc)}
                  className={`text-left p-2 rounded-xl text-sm transition-colors ${
                    city === loc.city && country === loc.country
                      ? 'bg-primary/20 border border-primary/50'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  data-testid={`location-${loc.city.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <p className="font-medium truncate">{loc.city}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {loc.state ? `${loc.state}, ` : ''}{loc.country}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !city.trim() || !country.trim()}
              className="flex-1 ember-gradient rounded-full"
              data-testid="save-location-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Location'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
