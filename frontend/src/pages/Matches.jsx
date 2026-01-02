import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, MessageCircle, Trash2 } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { formatDistanceToNow } from 'date-fns';

export default function Matches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API}/matches`, { headers, withCredentials: true });
      setMatches(response.data);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = async (matchId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to unmatch?')) return;
    
    try {
      await axios.delete(`${API}/matches/${matchId}`, { headers, withCredentials: true });
      setMatches(matches.filter(m => m.match_id !== matchId));
      toast.success('Unmatched');
    } catch (error) {
      toast.error('Failed to unmatch');
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
    <div className="min-h-screen bg-background pb-24" data-testid="matches-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-center relative">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold tracking-wider ember-text-gradient">EMBER</span>
          </div>
          <div className="absolute right-6">
            <h1 className="text-lg font-semibold">Matches</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 px-4">
        {matches.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No matches yet</h2>
            <p className="text-muted-foreground mb-6">Start swiping to find your matches!</p>
            <Button onClick={() => navigate('/discover')} className="ember-gradient rounded-full" data-testid="discover-btn">
              Discover Profiles
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto space-y-3">
            <p className="text-muted-foreground text-sm mb-4">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </p>

            {matches.map((match) => (
              <div
                key={match.match_id}
                onClick={() => navigate(`/messages/${match.match_id}`)}
                className="bg-card rounded-2xl p-4 flex items-center gap-4 border border-border/50 hover:border-primary/50 transition-colors cursor-pointer group animate-fade-in"
                data-testid={`match-card-${match.match_id}`}
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                  <img
                    src={match.other_user?.photos?.[0] || 'https://via.placeholder.com/64'}
                    alt={match.other_user?.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{match.other_user?.name}</h3>
                  {match.last_message ? (
                    <p className="text-sm text-muted-foreground truncate">
                      {match.last_message}
                    </p>
                  ) : (
                    <p className="text-sm text-primary">New match! Say hi 👋</p>
                  )}
                  {match.last_message_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(match.last_message_at), { addSuffix: true })}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleUnmatch(match.match_id, e)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    data-testid={`unmatch-${match.match_id}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 ember-gradient rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Navigation />
    </div>
  );
}
