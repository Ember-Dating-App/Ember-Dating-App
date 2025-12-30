import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, Heart, X, MessageCircle, Check, Crown, Lock, Flower2 } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';

export default function Likes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [likesData, setLikesData] = useState(null);
  const [rosesData, setRosesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('likes');

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchLikes();
    fetchRoses();
  }, []);

  const fetchLikes = async () => {
    try {
      const response = await axios.get(`${API}/likes/received`, { headers, withCredentials: true });
      setLikesData(response.data);
    } catch (error) {
      toast.error('Failed to load likes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoses = async () => {
    try {
      const response = await axios.get(`${API}/likes/roses-received`, { headers, withCredentials: true });
      setRosesData(response.data);
    } catch (error) {
      console.error('Failed to load roses:', error);
    }
  };

  const handleLikeBack = async (like) => {
    try {
      const response = await axios.post(`${API}/likes`, {
        liked_user_id: like.liker?.user_id || like.sender?.user_id
      }, { headers, withCredentials: true });

      if (response.data.match) {
        toast.success(`It's a match with ${like.liker?.name || like.sender?.name}!`, {
          action: {
            label: 'Message',
            onClick: () => navigate(`/messages/${response.data.match.match_id}`)
          }
        });
        if (likesData?.likes) {
          setLikesData({ ...likesData, likes: likesData.likes.filter(l => l.like_id !== like.like_id) });
        }
      }
    } catch (error) {
      toast.error('Failed to like back');
    }
  };

  const handleReject = async (like) => {
    try {
      await axios.delete(`${API}/likes/${like.like_id}`, { headers, withCredentials: true });
      if (likesData?.likes) {
        setLikesData({ ...likesData, likes: likesData.likes.filter(l => l.like_id !== like.like_id) });
      }
      toast.success('Like removed');
    } catch (error) {
      toast.error('Failed to remove like');
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
    <div className="min-h-screen bg-background pb-24" data-testid="likes-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold tracking-wider ember-text-gradient">EMBER</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === 'likes' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span className="font-medium">Likes</span>
            </button>
            <button
              onClick={() => setActiveTab('roses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === 'roses' ? 'bg-rose-500 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Flower2 className="w-4 h-4" />
              <span className="font-medium">Roses</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 px-4">
        {activeTab === 'likes' && (
          <>
            {!user?.is_premium ? (
              // Premium Gate
              <div className="max-w-md mx-auto mt-10">
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/20 rounded-2xl p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">See Who Likes You</h2>
                  <p className="text-muted-foreground mb-4">
                    Upgrade to Premium to see all {likesData?.count || 0} people who liked you!
                  </p>
                  
                  <div className="bg-background/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 text-4xl font-bold text-orange-600 mb-2">
                      {likesData?.count || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {likesData?.count === 1 ? 'person likes you' : 'people like you'}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6 text-left">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">See everyone who liked you</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Match instantly</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Unlimited swipes</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate('/premium')}
                    className="w-full py-6 text-lg ember-gradient rounded-full"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Get Premium
                  </Button>
                </div>
              </div>
            ) : likesData?.likes?.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-20">
                <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">No likes yet</h2>
                <p className="text-muted-foreground mb-6">Keep swiping to get more likes!</p>
                <Button onClick={() => navigate('/discover')} className="ember-gradient rounded-full" data-testid="discover-btn">
                  Discover Profiles
                </Button>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-muted-foreground text-sm">
                  {likesData?.count || 0} {likesData?.count === 1 ? 'person likes' : 'people like'} you
                </p>

            {likes.map((like) => (
              <div
                key={like.like_id}
                className="bg-card rounded-2xl overflow-hidden border border-border/50 animate-fade-in"
                data-testid={`like-card-${like.like_id}`}
              >
                <div className="flex">
                  {/* Photo */}
                  <div className="w-32 h-40 flex-shrink-0">
                    <img
                      src={like.liker?.photos?.[0] || 'https://via.placeholder.com/128x160'}
                      alt={like.liker?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {like.liker?.name}, {like.liker?.age}
                      </h3>
                      {like.liked_section && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Liked your {like.liked_section.replace('_', ' ')}
                        </p>
                      )}
                      {like.comment && (
                        <p className="text-sm mt-2 bg-muted rounded-lg p-2">
                          "{like.comment}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-full"
                        onClick={() => handleReject(like)}
                        data-testid={`reject-${like.like_id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 ember-gradient rounded-full"
                        onClick={() => handleLikeBack(like)}
                        data-testid={`like-back-${like.like_id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Like Back
                      </Button>
                    </div>
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
