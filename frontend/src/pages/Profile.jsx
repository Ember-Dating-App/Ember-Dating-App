import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, LogOut, Camera, Plus, X, Edit2, MapPin, Crown, Star } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import LocationPicker from '@/components/LocationPicker';

const INTERESTS = [
  'Travel', 'Music', 'Movies', 'Fitness', 'Cooking', 'Art', 'Photography', 'Reading',
  'Gaming', 'Sports', 'Hiking', 'Yoga', 'Dancing', 'Wine', 'Coffee', 'Dogs', 'Cats',
  'Tech', 'Fashion', 'Food', 'Nature', 'Beach', 'Mountains', 'Concerts', 'Festivals'
];

const PROMPTS_LIBRARY = [
  "A perfect Sunday looks like...",
  "I'm looking for someone who...",
  "The way to win me over is...",
  "My most irrational fear is...",
  "I geek out on...",
  "Two truths and a lie...",
  "Unusual skills I have...",
  "My simple pleasures are...",
  "Dating me is like...",
  "My love language is...",
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || '',
    interested_in: user?.interested_in || '',
    location: user?.location || '',
    bio: user?.bio || '',
    photos: user?.photos || [],
    video_url: user?.video_url || '',
    prompts: user?.prompts || [],
    interests: user?.interests || [],
    height: user?.height || null,
    education: user?.education || '',
    dating_purpose: user?.dating_purpose || '',
    religion: user?.religion || '',
    languages: user?.languages || [],
    children: user?.children || '',
    political_view: user?.political_view || '',
    has_pets: user?.has_pets || '',
    ethnicity: user?.ethnicity || '',
    sub_ethnicity: user?.sub_ethnicity || ''
  });

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${API}/profile`, profile, {
        headers,
        withCredentials: true
      });
      setUser(response.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  const addPhoto = (url) => {
    if (profile.photos.length < 6 && url) {
      setProfile({ ...profile, photos: [...profile.photos, url] });
    }
  };

  const removePhoto = (index) => {
    const newPhotos = profile.photos.filter((_, i) => i !== index);
    setProfile({ ...profile, photos: newPhotos });
  };

  const toggleInterest = (interest) => {
    if (profile.interests.includes(interest)) {
      setProfile({ ...profile, interests: profile.interests.filter(i => i !== interest) });
    } else if (profile.interests.length < 10) {
      setProfile({ ...profile, interests: [...profile.interests, interest] });
    }
  };

  const addPrompt = (question) => {
    if (profile.prompts.length < 3 && !profile.prompts.find(p => p.question === question)) {
      setProfile({ ...profile, prompts: [...profile.prompts, { question, answer: '' }] });
    }
  };

  const updatePromptAnswer = (index, answer) => {
    const newPrompts = [...profile.prompts];
    newPrompts[index].answer = answer;
    setProfile({ ...profile, prompts: newPrompts });
  };

  const removePrompt = (index) => {
    const newPrompts = profile.prompts.filter((_, i) => i !== index);
    setProfile({ ...profile, prompts: newPrompts });
  };

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="profile-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold tracking-wider ember-text-gradient">EMBER</span>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setProfile({
                      age: user?.age || '',
                      gender: user?.gender || '',
                      interested_in: user?.interested_in || '',
                      location: user?.location || '',
                      bio: user?.bio || '',
                      photos: user?.photos || [],
                      video_url: user?.video_url || '',
                      prompts: user?.prompts || [],
                      interests: user?.interests || []
                    });
                    setEditing(false);
                  }}
                  data-testid="cancel-edit-btn"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="ember-gradient rounded-full"
                  data-testid="save-btn"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(true)}
                  data-testid="edit-btn"
                >
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(true)}
                  data-testid="settings-btn"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Profile Header */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <img
                src={profile.photos[0] || user?.picture || 'https://via.placeholder.com/128'}
                alt={user?.name}
                className="w-full h-full rounded-full object-cover ring-4 ring-primary/20"
              />
              {user?.is_premium && (
                <div className="absolute -top-1 -right-1 w-8 h-8 ember-gradient rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
              {editing && (
                <button
                  onClick={() => {
                    const url = prompt('Enter image URL:');
                    if (url && profile.photos.length === 0) {
                      addPhoto(url);
                    } else if (url) {
                      const newPhotos = [...profile.photos];
                      newPhotos[0] = url;
                      setProfile({ ...profile, photos: newPhotos });
                    }
                  }}
                  className="absolute bottom-0 right-0 w-10 h-10 ember-gradient rounded-full flex items-center justify-center shadow-lg"
                  data-testid="change-avatar-btn"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
            <h1 className="text-2xl font-bold">{user?.name}, {profile.age || user?.age}</h1>
            
            {/* Location with edit button */}
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1 mx-auto mt-1 text-muted-foreground hover:text-primary transition-colors"
              data-testid="edit-location-btn"
            >
              <MapPin className="w-4 h-4" />
              <span>{user?.location || 'Set your location'}</span>
              <Edit2 className="w-3 h-3 ml-1" />
            </button>

            {/* Premium status / Upgrade button */}
            {!user?.is_premium ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/premium')}
                className="mt-3 rounded-full border-primary/50 text-primary hover:bg-primary/10"
                data-testid="upgrade-btn"
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade to Premium
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm">
                  <span>🌹</span>
                  <span className="font-semibold">{user.roses || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-blue-400" fill="#60a5fa" />
                  <span className="font-semibold">{user.super_likes || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Basic Info */}
          {editing && (
            <div className="bg-card rounded-2xl p-4 space-y-4 border border-border/50">
              <h3 className="font-semibold">Basic Info</h3>
              
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="bg-muted/50 border-muted rounded-xl"
                  placeholder="Your name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || '' })}
                    className="bg-muted/50 border-muted rounded-xl"
                    data-testid="edit-age-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Button
                    variant="outline"
                    onClick={() => setShowLocationPicker(true)}
                    className="w-full justify-start text-left font-normal bg-muted/50 border-muted rounded-xl"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {profile.location || 'Set location'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                  <SelectTrigger className="bg-muted/50 border-muted rounded-xl">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="man">Man</SelectItem>
                    <SelectItem value="woman">Woman</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Interested in</Label>
                <Select value={profile.interested_in} onValueChange={(v) => setProfile({ ...profile, interested_in: v })}>
                  <SelectTrigger className="bg-muted/50 border-muted rounded-xl">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Bio */}
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <h3 className="font-semibold mb-3">About</h3>
            {editing ? (
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell potential matches about yourself..."
                className="bg-muted/50 border-muted rounded-xl min-h-[100px]"
                data-testid="edit-bio-input"
              />
            ) : (
              <p className="text-muted-foreground">
                {user?.bio || 'No bio yet. Edit your profile to add one!'}
              </p>
            )}
          </div>

          {/* Photos */}
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <h3 className="font-semibold mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square relative">
                  {profile.photos[i] ? (
                    <div className="relative w-full h-full rounded-xl overflow-hidden group">
                      <img src={profile.photos[i]} alt="" className="w-full h-full object-cover" />
                      {editing && (
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-photo-${i}`}
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  ) : editing ? (
                    <button
                      onClick={() => {
                        const url = prompt('Enter image URL:');
                        if (url) addPhoto(url);
                      }}
                      className="w-full h-full bg-muted rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
                      data-testid={`add-photo-${i}`}
                    >
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </button>
                  ) : (
                    <div className="w-full h-full bg-muted rounded-xl" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Prompts */}
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <h3 className="font-semibold mb-3">Prompts</h3>
            <div className="space-y-3">
              {profile.prompts.map((prompt, i) => (
                <div key={i} className="bg-muted rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <p className="text-primary text-sm font-medium">{prompt.question}</p>
                    {editing && (
                      <button onClick={() => removePrompt(i)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {editing ? (
                    <Textarea
                      value={prompt.answer}
                      onChange={(e) => updatePromptAnswer(i, e.target.value)}
                      className="bg-background border-none mt-2 min-h-[60px]"
                      data-testid={`edit-prompt-${i}`}
                    />
                  ) : (
                    <p className="mt-1">{prompt.answer}</p>
                  )}
                </div>
              ))}
              
              {editing && profile.prompts.length < 3 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full rounded-xl border-dashed" data-testid="add-prompt-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Prompt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Choose a prompt</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {PROMPTS_LIBRARY.filter(p => !profile.prompts.find(pp => pp.question === p)).map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            addPrompt(prompt);
                          }}
                          className="text-left p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <h3 className="font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {(editing ? INTERESTS : profile.interests).map((interest) => (
                <button
                  key={interest}
                  onClick={() => editing && toggleInterest(interest)}
                  disabled={!editing}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    profile.interests.includes(interest)
                      ? 'ember-gradient text-white'
                      : editing
                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                        : 'bg-muted text-muted-foreground opacity-50'
                  }`}
                  data-testid={`interest-${interest.toLowerCase()}`}
                >
                  {interest}
                </button>
              ))}
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground mt-2">
                {profile.interests.length}/10 selected
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Location Picker */}
      <LocationPicker
        open={showLocationPicker}
        onOpenChange={setShowLocationPicker}
        onLocationUpdate={(updatedUser) => {
          setProfile({ ...profile, location: updatedUser.location });
        }}
      />

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                setShowSettings(false);
                navigate('/premium');
              }}
            >
              <Crown className="w-4 h-4 mr-2" />
              {user?.is_premium ? 'Manage Premium' : 'Get Premium'}
            </Button>

            <Button
              variant="destructive"
              className="w-full rounded-xl"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}
