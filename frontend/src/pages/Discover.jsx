import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, X, MapPin, Sparkles, ChevronDown, Star, Crown, Flower2, RotateCcw, Sliders, BadgeCheck, Volume2, VolumeX, Video } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import OutOfSwipesModal from '@/components/OutOfSwipesModal';
import AdvancedFiltersModal from '@/components/AdvancedFiltersModal';

export default function Discover() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [likeComment, setLikeComment] = useState('');
  const [likeType, setLikeType] = useState('regular');
  const [showCompatible, setShowCompatible] = useState(false);
  const [sendingLike, setSendingLike] = useState(false);
  const [showOutOfSwipesModal, setShowOutOfSwipesModal] = useState(false);
  const [limits, setLimits] = useState(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchProfiles();
    fetchLimits();
  }, [showCompatible]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const endpoint = showCompatible ? '/discover/most-compatible' : '/discover';
      const response = await axios.get(`${API}${endpoint}`, { headers, withCredentials: true });
      setProfiles(response.data);
      setCurrentIndex(0);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Profile verification required');
        navigate('/verification');
      } else {
        toast.error('Failed to load profiles');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLimits = async () => {
    try {
      const response = await axios.get(`${API}/limits/swipes`, { headers, withCredentials: true });
      setLimits(response.data);
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { headers, withCredentials: true });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const currentProfile = profiles[currentIndex];

  const handleLike = async () => {
    if (!currentProfile) return;

    // Check limits for special likes
    if (likeType === 'super_like') {
      if (limits && limits.super_likes.remaining <= 0) {
        toast.error('No Super Likes available', {
          action: {
            label: 'Get More',
            onClick: () => navigate('/premium')
          }
        });
        return;
      }
    }
    
    if (likeType === 'rose') {
      if (limits && limits.roses.remaining <= 0) {
        toast.error('No Roses available', {
          action: {
            label: 'Get More',
            onClick: () => navigate('/premium')
          }
        });
        return;
      }
    }

    // Check regular swipe limit
    if (likeType === 'regular') {
      if (limits && !limits.swipes.unlimited && limits.swipes.remaining <= 0) {
        setShowOutOfSwipesModal(true);
        return;
      }
    }

    setSendingLike(true);
    try {
      const response = await axios.post(`${API}/likes`, {
        liked_user_id: currentProfile.user_id,
        liked_section: selectedSection,
        comment: likeComment,
        like_type: likeType
      }, { headers, withCredentials: true });

      if (response.data.match) {
        toast.success(`It's a match with ${currentProfile.name}!`, {
          action: {
            label: 'Message',
            onClick: () => navigate(`/messages/${response.data.match.match_id}`)
          }
        });
      } else {
        const typeText = likeType === 'super_like' ? 'Super Like' : likeType === 'rose' ? 'Rose' : 'Like';
        toast.success(`${typeText} sent!`);
      }

      // Refresh limits and user data
      await fetchLimits();
      await refreshUser();

      // Show remaining swipes notification for regular likes
      if (likeType === 'regular' && !user?.is_premium) {
        const newLimits = await axios.get(`${API}/limits/swipes`, { headers, withCredentials: true });
        const remaining = newLimits.data.swipes.remaining;
        
        if (remaining === 3) {
          toast.warning('3 swipes remaining today');
        } else if (remaining === 1) {
          toast.warning('Only 1 swipe remaining today!');
        } else if (remaining === 0) {
          toast.error('Out of swipes! Upgrade for unlimited swipes.');
        }
      }

      setShowLikeModal(false);
      setLikeComment('');
      setSelectedSection(null);
      setLikeType('regular');
      nextProfile();
    } catch (error) {
      if (error.response?.status === 429) {
        setShowOutOfSwipesModal(true);
      } else {
        toast.error(error.response?.data?.detail || 'Failed to send like');
      }
    } finally {
      setSendingLike(false);
    }
  };

  const handlePass = async () => {
    if (!currentProfile) return;

    // Check if user has swipes remaining
    if (limits && !limits.swipes.unlimited && limits.swipes.remaining <= 0) {
      setShowOutOfSwipesModal(true);
      return;
    }

    try {
      await axios.post(`${API}/discover/pass?liked_user_id=${currentProfile.user_id}`, {}, { 
        headers, 
        withCredentials: true 
      });
      
      // Refresh limits
      await fetchLimits();
      
      // Enable undo button
      setCanUndo(true);
      
      // Show remaining swipes notification
      if (!user?.is_premium) {
        const newLimits = await axios.get(`${API}/limits/swipes`, { headers, withCredentials: true });
        const remaining = newLimits.data.swipes.remaining;
        
        if (remaining === 3) {
          toast.warning('3 swipes remaining today');
        } else if (remaining === 1) {
          toast.warning('Only 1 swipe remaining today!');
        } else if (remaining === 0) {
          toast.error('Out of swipes! Upgrade for unlimited swipes.');
        }
      }
      
      nextProfile();
    } catch (error) {
      if (error.response?.status === 429) {
        setShowOutOfSwipesModal(true);
      } else {
        console.error('Pass error:', error);
        nextProfile(); // Still move to next profile
      }
    }
  };

  const handleUndo = async () => {
    try {
      const response = await axios.post(`${API}/discover/undo`, {}, { headers, withCredentials: true });
      
      // Add the undone profile back to the front of the list
      const undoneProfile = response.data.profile;
      setProfiles([undoneProfile, ...profiles.slice(currentIndex)]);
      setCurrentIndex(0);
      setCanUndo(false);
      
      toast.success('Last pass undone!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Cannot undo');
      setCanUndo(false);
    }
  };

  const handleFiltersApplied = async () => {
    toast.success('Filters applied! Refreshing profiles...');
    await fetchProfiles();
  };

  const nextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setProfiles([]);
      toast.info('No more profiles. Check back later!');
    }
  };

  const openLikeModal = (section = null, type = 'regular') => {
    setSelectedSection(section);
    setLikeType(type);
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
            <span className="font-heading text-xl font-bold tracking-wider ember-text-gradient">EMBER</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2"
              onClick={() => setShowFiltersModal(true)}
            >
              <Sliders className="w-4 h-4" />
              Filters
            </Button>
            {canUndo && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                onClick={handleUndo}
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2"
              onClick={() => navigate('/standouts')}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Standouts
            </Button>
            <Button
              variant={showCompatible ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full gap-2 ${showCompatible ? 'ember-gradient' : ''}`}
              onClick={() => setShowCompatible(!showCompatible)}
              data-testid="compatible-toggle"
            >
              <Sparkles className="w-4 h-4" />
              Compatible
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2"
              onClick={() => navigate('/daily-picks')}
            >
              <Crown className="w-4 h-4 text-orange-500" />
              Daily Picks
            </Button>
          </div>
        </div>
      </header>

      {/* Premium banner if not premium */}
      {!user?.is_premium && (
        <div 
          onClick={() => navigate('/premium')}
          className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-primary/90 to-ember-red/90 py-2 px-4 cursor-pointer"
        >
          <div className="container mx-auto flex items-center justify-center gap-2 text-white text-sm">
            <Crown className="w-4 h-4" />
            <span>Get Premium for unlimited likes and more</span>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <main className={`${!user?.is_premium ? 'pt-28' : 'pt-20'} px-4`}>
        {!currentProfile ? (
          <div className="max-w-md mx-auto text-center py-20">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
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
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">
                      {currentProfile.name}, {currentProfile.age}
                    </h2>
                    {currentProfile.verification_status === 'verified' && (
                      <BadgeCheck className="w-6 h-6 text-blue-400 fill-blue-400" />
                    )}
                  </div>
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
            <div className="fixed bottom-24 left-0 right-0 flex justify-center gap-4 pb-4">
              <button
                onClick={handlePass}
                className="w-14 h-14 bg-muted rounded-full flex items-center justify-center shadow-lg hover:bg-muted/80 transition-colors like-button"
                data-testid="pass-btn"
              >
                <X className="w-7 h-7 text-muted-foreground" />
              </button>
              
              {/* Super Like Button */}
              <button
                onClick={() => openLikeModal(null, 'super_like')}
                className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors like-button"
                data-testid="super-like-btn"
              >
                <Star className="w-7 h-7 text-white" fill="white" />
              </button>
              
              {/* Regular Like Button */}
              <button
                onClick={() => openLikeModal()}
                className="w-14 h-14 ember-gradient rounded-full flex items-center justify-center shadow-lg ember-glow hover:ember-glow-hover transition-all like-button"
                data-testid="like-btn"
              >
                <Heart className="w-7 h-7 text-white" />
              </button>
              
              {/* Rose Button */}
              <button
                onClick={() => openLikeModal(null, 'rose')}
                className="w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:from-rose-600 hover:to-pink-600 transition-colors like-button"
                data-testid="rose-btn"
              >
                <span className="text-2xl">🌹</span>
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
              {likeType === 'super_like' && <Star className="w-5 h-5 text-blue-400" fill="#60a5fa" />}
              {likeType === 'rose' && <span>🌹</span>}
              {likeType === 'regular' && <Heart className="w-5 h-5 text-primary" />}
              Send {likeType === 'super_like' ? 'a Super Like' : likeType === 'rose' ? 'a Rose' : 'a Like'} to {currentProfile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSection && (
              <p className="text-sm text-muted-foreground">
                You're liking their {selectedSection.replace('_', ' ')}
              </p>
            )}

            {likeType === 'super_like' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <p className="text-sm text-blue-400">
                  Super Likes are 3x more likely to get a match!
                  {!user?.is_premium && (
                    <span className="block mt-1 text-muted-foreground">
                      You have {user?.super_likes || 0} Super Likes remaining
                    </span>
                  )}
                </p>
              </div>
            )}

            {likeType === 'rose' && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
                <p className="text-sm text-rose-400">
                  Roses go to the top of someone's Likes and stand out!
                  <span className="block mt-1 text-muted-foreground">
                    You have {user?.roses || 0} Roses remaining
                  </span>
                </p>
              </div>
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
                className={`flex-1 rounded-full ${
                  likeType === 'super_like' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : likeType === 'rose'
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                      : 'ember-gradient ember-glow'
                }`}
                data-testid="send-like-btn"
              >
                {sendingLike ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Out of Swipes Modal */}
      <OutOfSwipesModal 
        isOpen={showOutOfSwipesModal} 
        onClose={() => setShowOutOfSwipesModal(false)} 
      />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal 
        isOpen={showFiltersModal} 
        onClose={() => setShowFiltersModal(false)}
        onFiltersApplied={handleFiltersApplied}
      />

      <Navigation />
    </div>
  );
}
