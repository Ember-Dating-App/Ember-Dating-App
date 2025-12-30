import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, Star, ArrowLeft } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import VerifiedBadge from '@/components/VerifiedBadge';

export default function Standouts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [standouts, setStandouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchStandouts();
  }, []);

  const fetchStandouts = async () => {
    try {
      const response = await axios.get(`${API}/discover/standouts`, { headers, withCredentials: true });
      setStandouts(response.data);
    } catch (error) {
      toast.error('Failed to load standouts');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRose = async (profileId) => {
    if (!user?.is_premium && (user?.roses || 0) <= 0) {
      toast.error('No roses available', {
        action: {
          label: 'Get Roses',
          onClick: () => navigate('/premium')
        }
      });
      return;
    }

    try {
      const response = await axios.post(`${API}/likes`, {
        liked_user_id: profileId,
        like_type: 'rose'
      }, { headers, withCredentials: true });

      if (response.data.match) {
        toast.success("It's a match!");
      } else {
        toast.success('Rose sent!');
      }

      // Remove from standouts
      setStandouts(standouts.filter(s => s.user_id !== profileId));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send rose');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="standouts-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/discover')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-semibold">Standouts</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Premium Banner (if not premium) */}
      {!user?.is_premium && (
        <div className="pt-20 px-4">
          <div 
            onClick={() => navigate('/premium')}
            className="bg-gradient-to-r from-primary/20 to-ember-red/20 rounded-2xl p-4 mb-4 cursor-pointer border border-primary/30"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-primary" />
              <div>
                <p className="font-semibold">Get Premium to see all Standouts</p>
                <p className="text-sm text-muted-foreground">Unlock unlimited access</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standouts Grid */}
      <main className={`${!user?.is_premium ? '' : 'pt-20'} px-4`}>
        {standouts.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Standouts Right Now</h2>
            <p className="text-muted-foreground">Check back later for exceptional profiles!</p>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm mb-4">
              {standouts.length} exceptional profiles picked for you
            </p>
            <div className="grid grid-cols-2 gap-3">
              {standouts.map((profile) => (
                <div
                  key={profile.user_id}
                  className="relative rounded-2xl overflow-hidden bg-card border border-border/50"
                  data-testid={`standout-${profile.user_id}`}
                >
                  {/* Standout badge */}
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-400" fill="#facc15" />
                    <span className="text-xs font-medium text-white">Standout</span>
                  </div>

                  {/* Photo */}
                  <div className="aspect-[3/4] relative">
                    <img
                      src={profile.photos?.[0] || 'https://via.placeholder.com/300x400'}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="font-semibold text-white">{profile.name}, {profile.age}</h3>
                      <p className="text-white/70 text-xs">{profile.location}</p>
                    </div>
                  </div>

                  {/* Send Rose Button */}
                  <div className="p-3">
                    <Button
                      onClick={() => handleSendRose(profile.user_id)}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full text-sm"
                      data-testid={`send-rose-${profile.user_id}`}
                    >
                      <span className="mr-1">🌹</span>
                      Send Rose
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Rose balance */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            You have <span className="text-primary font-bold">{user?.roses || 0}</span> roses
          </p>
          <Button
            variant="link"
            onClick={() => navigate('/premium')}
            className="text-primary"
          >
            Get more roses
          </Button>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
