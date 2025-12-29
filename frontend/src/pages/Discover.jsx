import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Flame, Heart, X, MapPin, Sparkles, MessageCircle, ChevronDown } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

export default function Discover() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [likeComment, setLikeComment] = useState('');
  const [showCompatible, setShowCompatible] = useState(false);
  const [sendingLike, setSendingLike] = useState(false);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchProfiles();
  }, [showCompatible]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const endpoint = showCompatible ? '/discover/most-compatible' : '/discover';
      const response = await axios.get(`${API}${endpoint}`, { headers, withCredentials: true });
      setProfiles(response.data);
      setCurrentIndex(0);
    } catch (error) {
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const currentProfile = profiles[currentIndex];

  const handleLike = async () => {
    if (!currentProfile) return;
    setSendingLike(true);
    try {
      const response = await axios.post(`${API}/likes`, {
        liked_user_id: currentProfile.user_id,
        liked_section: selectedSection,
        comment: likeComment
      }, { headers, withCredentials: true });

      if (response.data.match) {
        toast.success(`It's a match with ${currentProfile.name}!`, {
          action: {
            label: 'Message',
            onClick: () => navigate(`/messages/${response.data.match.match_id}`)
          }
        });
      } else {
        toast.success('Like sent!');
      }

      setShowLikeModal(false);
      setLikeComment('');
      setSelectedSection(null);
      nextProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send like');
    } finally {
      setSendingLike(false);
    }
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setProfiles([]);
      toast.info('No more profiles. Check back later!');
    }
  };

  const openLikeModal = (section = null) => {
    setSelectedSection(section);
    setShowLikeModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="discover-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            <span className="font-heading text-xl font-bold tracking-wider ember-text-gradient">EMBER</span>
          </div>
          <Button
            variant={showCompatible ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full gap-2 ${showCompatible ? 'ember-gradient' : ''}`}
            onClick={() => setShowCompatible(!showCompatible)}
            data-testid="compatible-toggle"
          >
            <Sparkles className="w-4 h-4" />
            Most Compatible
          </Button>
        </div>
      </header>

      {/* Profile Card */}
      <main className="pt-20 px-4">
        {!currentProfile ? (
          <div className="max-w-md mx-auto text-center py-20">
            <Flame className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No more profiles</h2>
            <p className="text-muted-foreground mb-6">Check back later for new matches!</p>
            <Button onClick={fetchProfiles} className="ember-gradient rounded-full" data-testid="refresh-btn">
              Refresh
            </Button>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {/* Main Photo */}
            <div className="profile-card mb-4" data-testid="profile-card">
              <div className="profile-card-image">
                <img 
                  src={currentProfile.photos[0] || 'https://via.placeholder.com/400x500'} 
                  alt={currentProfile.name}
                  className="w-full"
                />
                <div className="profile-card-overlay">
                  <h2 className="text-2xl font-bold text-white">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  {currentProfile.location && (
                    <p className="text-white/80 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {currentProfile.location}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openLikeModal('photo')}
                  className="absolute bottom-4 right-4 w-12 h-12 ember-gradient rounded-full flex items-center justify-center shadow-lg ember-glow hover:ember-glow-hover transition-all like-button"
                  data-testid="like-photo-btn"
                >
                  <Heart className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Bio */}
            {currentProfile.bio && (
              <div className="prompt-card mb-4 relative" data-testid="bio-section">
                <p className="text-muted-foreground text-sm mb-1">About me</p>
                <p className="text-foreground">{currentProfile.bio}</p>
                <button
                  onClick={() => openLikeModal('bio')}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-primary/20 hover:bg-primary/30 rounded-full flex items-center justify-center transition-colors"
                  data-testid="like-bio-btn"
                >
                  <Heart className="w-4 h-4 text-primary" />
                </button>
              </div>
            )}

            {/* Additional Photos */}
            {currentProfile.photos.length > 1 && (
              <div className="photo-grid photo-grid-2 mb-4">
                {currentProfile.photos.slice(1, 3).map((photo, i) => (
                  <div key={i} className="photo-item">
                    <img src={photo} alt="" />
                  </div>
                ))}
              </div>
            )}

            {/* Prompts */}
            {currentProfile.prompts?.map((prompt, i) => (
              <div key={i} className="prompt-card mb-4 relative" data-testid={`prompt-${i}`}>
                <p className="text-primary text-sm font-medium mb-2">{prompt.question}</p>
                <p className="text-foreground">{prompt.answer}</p>
                <button
                  onClick={() => openLikeModal(`prompt_${i}`)}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-primary/20 hover:bg-primary/30 rounded-full flex items-center justify-center transition-colors"
                  data-testid={`like-prompt-${i}-btn`}
                >
                  <Heart className="w-4 h-4 text-primary" />
                </button>
              </div>
            ))}

            {/* More Photos */}
            {currentProfile.photos.length > 3 && (
              <div className="photo-grid photo-grid-3 mb-4">
                {currentProfile.photos.slice(3).map((photo, i) => (
                  <div key={i} className="photo-item">
                    <img src={photo} alt="" />
                  </div>
                ))}
              </div>
            )}

            {/* Interests */}
            {currentProfile.interests?.length > 0 && (
              <div className="prompt-card mb-4" data-testid="interests-section">
                <p className="text-muted-foreground text-sm mb-3">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.interests.map((interest, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-sm ${
                        user?.interests?.includes(interest)
                          ? 'ember-gradient text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scroll indicator */}
            <div className="text-center py-4 text-muted-foreground">
              <ChevronDown className="w-6 h-6 mx-auto animate-bounce" />
              <p className="text-sm">Scroll to see more</p>
            </div>

            {/* Action Buttons */}
            <div className="fixed bottom-24 left-0 right-0 flex justify-center gap-6 pb-4">
              <button
                onClick={handlePass}
                className="w-16 h-16 bg-muted rounded-full flex items-center justify-center shadow-lg hover:bg-muted/80 transition-colors like-button"
                data-testid="pass-btn"
              >
                <X className="w-8 h-8 text-muted-foreground" />
              </button>
              <button
                onClick={() => openLikeModal()}
                className="w-16 h-16 ember-gradient rounded-full flex items-center justify-center shadow-lg ember-glow hover:ember-glow-hover transition-all like-button"
                data-testid="like-btn"
              >
                <Heart className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Like Modal */}
      <Dialog open={showLikeModal} onOpenChange={setShowLikeModal}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Send a like to {currentProfile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSection && (
              <p className="text-sm text-muted-foreground">
                You're liking their {selectedSection.replace('_', ' ')}
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add a comment (optional)</label>
              <Textarea
                placeholder="Say something nice..."
                value={likeComment}
                onChange={(e) => setLikeComment(e.target.value)}
                className="bg-muted/50 border-muted focus:border-primary rounded-xl"
                data-testid="like-comment-input"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLikeModal(false)}
                className="flex-1 rounded-full"
                data-testid="cancel-like-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLike}
                disabled={sendingLike}
                className="flex-1 ember-gradient rounded-full ember-glow"
                data-testid="send-like-btn"
              >
                {sendingLike ? 'Sending...' : 'Send Like'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}
