import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, Heart, X, MessageCircle, Check, Crown, Lock, Flower2 } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import VerifiedBadge from '@/components/VerifiedBadge';
import AmbassadorBadge from '@/components/AmbassadorBadge';

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
              // Premium Gate - Premium Design
              <div className="max-w-md mx-auto mt-10">
                <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-background via-background to-orange-500/5">
                  {/* Decorative gradients */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full blur-2xl" />
                  
                  <div className="relative p-8">
                    {/* Icon with glow */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl blur-xl opacity-50" />
                      <div className="relative w-full h-full bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30">
                        <Lock className="w-12 h-12 text-white" strokeWidth={2} />
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                      See Who Likes You
                    </h2>
                    <p className="text-center text-muted-foreground mb-6">
                      Unlock Premium to reveal all your admirers
                    </p>
                    
                    {/* Count Display - Premium Style */}
                    <div className="relative mb-6 p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 backdrop-blur-sm">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-red-500/5 rounded-2xl" />
                      <div className="relative text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <Heart className="w-8 h-8 text-orange-500" fill="currentColor" />
                          <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                            {likesData?.count || 0}
                          </div>
                          <Heart className="w-8 h-8 text-red-500" fill="currentColor" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {likesData?.count === 1 ? 'person likes you' : 'people like you'}
                        </p>
                      </div>
                    </div>

                    {/* Features List - Premium Design */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/10">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-foreground">See everyone who liked you</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/10">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-foreground">Match instantly with anyone</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/10">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-foreground">Unlimited daily swipes</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/10">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm font-medium text-foreground">Advanced filters access</span>
                      </div>
                    </div>

                    {/* CTA Button - Premium */}
                    <Button
                      onClick={() => navigate('/premium')}
                      className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white rounded-2xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                    >
                      <Crown className="w-6 h-6 mr-2" />
                      Unlock Premium Now
                    </Button>
                  </div>
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

                {likesData.likes.map((like) => (
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {like.liker?.name}, {like.liker?.age}
                            </h3>
                            {like.liker?.verification_status === 'verified' && (
                              <VerifiedBadge className="w-5 h-5" />
                            )}
                            {like.liker?.is_ambassador && (
                              <AmbassadorBadge size="sm" />
                            )}
                            {like.like_type === 'super_like' && (
                              <div className="bg-blue-500 px-2 py-1 rounded-full text-xs text-white font-medium">
                                ⭐ Super Like
                              </div>
                            )}
                            {like.like_type === 'rose' && (
                              <div className="bg-rose-500 px-2 py-1 rounded-full text-xs text-white font-medium">
                                🌹 Rose
                              </div>
                            )}
                          </div>
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
          </>
        )}

        {/* Roses Tab */}
        {activeTab === 'roses' && (
          <>
            {!user?.is_premium ? (
              <div className="max-w-md mx-auto mt-10">
                <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-2 border-rose-500/20 rounded-2xl p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                    🌹
                  </div>
                  <h2 className="text-2xl font-bold mb-2">See Who Sent Roses</h2>
                  <p className="text-muted-foreground mb-4">
                    {rosesData?.count || 0} {rosesData?.count === 1 ? 'person sent' : 'people sent'} you a rose!
                  </p>
                  
                  <div className="bg-background/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 text-4xl font-bold text-rose-600 mb-2">
                      {rosesData?.count || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rosesData?.count === 1 ? 'rose received' : 'roses received'}
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate('/premium')}
                    className="w-full py-6 text-lg bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Get Premium
                  </Button>
                </div>
              </div>
            ) : rosesData?.roses?.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-20">
                <Flower2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">No roses yet</h2>
                <p className="text-muted-foreground mb-6">Roses are special likes that stand out!</p>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-muted-foreground text-sm">
                  {rosesData?.count || 0} {rosesData?.count === 1 ? 'rose received' : 'roses received'}
                </p>

                {rosesData.roses.map((rose) => (
                  <div
                    key={rose.like_id}
                    className="bg-card rounded-2xl overflow-hidden border-2 border-rose-500/30 animate-fade-in"
                  >
                    <div className="flex">
                      {/* Photo */}
                      <div className="w-32 h-40 flex-shrink-0 relative">
                        <img
                          src={rose.sender?.photos?.[0] || 'https://via.placeholder.com/128x160'}
                          alt={rose.sender?.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 text-3xl">🌹</div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {rose.sender?.name}, {rose.sender?.age}
                            </h3>
                            {rose.sender?.verification_status === 'verified' && (
                              <VerifiedBadge className="w-5 h-5" />
                            )}
                            {rose.sender?.is_ambassador && (
                              <AmbassadorBadge size="sm" />
                            )}
                          </div>
                          <p className="text-sm text-rose-600 mt-1">Sent you a rose</p>
                          {rose.comment && (
                            <p className="text-sm mt-2 bg-rose-500/10 rounded-lg p-2 border border-rose-500/20">
                              "{rose.comment}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-full"
                            onClick={() => handleReject(rose)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Pass
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full"
                            onClick={() => handleLikeBack(rose)}
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
          </>
        )}
      </main>

      <Navigation />
    </div>
  );
}
