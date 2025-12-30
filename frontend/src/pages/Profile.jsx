import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Settings, LogOut, Camera, Plus, X, Edit2, MapPin, Crown, Star, BadgeCheck, Upload, Trash2, AlertTriangle, GripVertical } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import LocationPicker from '@/components/LocationPicker';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [hasReorderedPhotos, setHasReorderedPhotos] = useState(false);
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setProfile((prev) => {
        const oldIndex = prev.photos.indexOf(active.id);
        const newIndex = prev.photos.indexOf(over.id);
        const newPhotos = arrayMove(prev.photos, oldIndex, newIndex);
        setHasReorderedPhotos(true);
        return { ...prev, photos: newPhotos };
      });
    }
  };

  const savePhotoOrder = async () => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${API}/profile/photos/reorder`,
        { photos: profile.photos },
        { headers, withCredentials: true }
      );
      setUser(response.data);
      setHasReorderedPhotos(false);
      toast.success('Photo order saved!');
    } catch (error) {
      toast.error('Failed to save photo order');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API}/account`, {
        data: { password: deletePassword },
        headers,
        withCredentials: true
      });
      
      toast.success('Account deleted successfully');
      await logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    } finally {
      setLoading(false);
      setDeletePassword('');
    }
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

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Photo size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setLoading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        // Upload to server (which will use Cloudinary)
        const response = await axios.post(
          `${API}/upload/photo/base64`,
          { data: base64 },
          { headers, withCredentials: true }
        );

        const photoUrl = response.data.url;
        addPhoto(photoUrl);
        toast.success('Photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setLoading(false);
    }
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
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold">{profile.name || user?.name || 'Set your name'}, {profile.age || user?.age}</h1>
              {user?.verification_status === 'verified' && (
                <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500" />
              )}
            </div>
            
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
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-6 border border-border/30 shadow-lg">
                <h3 className="text-lg font-bold mb-6 text-primary">Personal Information</h3>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <Input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="bg-background/50 border-border/50 rounded-xl h-12 text-base"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                      <Input
                        type="number"
                        value={profile.age}
                        onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || '' })}
                        className="bg-background/50 border-border/50 rounded-xl h-12 text-base"
                        data-testid="edit-age-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Height</Label>
                      <Select value={profile.height?.toString() || ''} onValueChange={(v) => setProfile({ ...profile, height: parseInt(v) })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
                          <SelectValue placeholder="Select height" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {Array.from({ length: 37 }, (_, i) => {
                            const totalInches = 48 + i;
                            const feet = Math.floor(totalInches / 12);
                            const inches = totalInches % 12;
                            return (
                              <SelectItem key={totalInches} value={totalInches.toString()}>
                                {feet}'{inches}"
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <Button
                      variant="outline"
                      onClick={() => setShowLocationPicker(true)}
                      className="w-full justify-start text-left font-normal bg-background/50 border-border/50 rounded-xl h-12"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {profile.location || 'Set location'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Dating Preferences Section */}
              <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-6 border border-border/30 shadow-lg">
                <h3 className="text-lg font-bold mb-6 text-primary">Dating Preferences</h3>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                      <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
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
                      <Label className="text-sm font-medium text-muted-foreground">Interested in</Label>
                      <Select value={profile.interested_in} onValueChange={(v) => setProfile({ ...profile, interested_in: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
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

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Looking For</Label>
                    <Select value={profile.dating_purpose} onValueChange={(v) => setProfile({ ...profile, dating_purpose: v })}>
                      <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
                        <SelectValue placeholder="What are you looking for?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Long-term Relationship">Long-term Relationship</SelectItem>
                        <SelectItem value="Short-term Relationship">Short-term Relationship</SelectItem>
                        <SelectItem value="Casual Dating">Casual Dating</SelectItem>
                        <SelectItem value="Friendship">Friendship</SelectItem>
                        <SelectItem value="Not Sure Yet">Not Sure Yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Background & Lifestyle Section */}
              <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl p-6 border border-border/30 shadow-lg">
                <h3 className="text-lg font-bold mb-6 text-primary">Background & Lifestyle</h3>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Education</Label>
                      <Select value={profile.education} onValueChange={(v) => setProfile({ ...profile, education: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
                          <SelectValue placeholder="Select education" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High School">High School</SelectItem>
                          <SelectItem value="Some College">Some College</SelectItem>
                          <SelectItem value="Bachelors">Bachelor's Degree</SelectItem>
                          <SelectItem value="Masters">Master's Degree</SelectItem>
                          <SelectItem value="PhD">PhD</SelectItem>
                          <SelectItem value="Trade School">Trade School</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Religion</Label>
                      <Select value={profile.religion} onValueChange={(v) => setProfile({ ...profile, religion: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
                          <SelectValue placeholder="Select religion" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Christianity">Christianity</SelectItem>
                          <SelectItem value="Islam">Islam</SelectItem>
                          <SelectItem value="Hinduism">Hinduism</SelectItem>
                          <SelectItem value="Buddhism">Buddhism</SelectItem>
                          <SelectItem value="Judaism">Judaism</SelectItem>
                          <SelectItem value="Sikhism">Sikhism</SelectItem>
                          <SelectItem value="Agnostic">Agnostic</SelectItem>
                          <SelectItem value="Atheist">Atheist</SelectItem>
                          <SelectItem value="Spiritual">Spiritual</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Children</Label>
                      <Select value={profile.children} onValueChange={(v) => setProfile({ ...profile, children: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Have children">Have children</SelectItem>
                          <SelectItem value="Don't have children">Don't have children</SelectItem>
                          <SelectItem value="Want children someday">Want children someday</SelectItem>
                          <SelectItem value="Don't want children">Don't want children</SelectItem>
                          <SelectItem value="Open to children">Open to children</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Political View</Label>
                      <Select value={profile.political_view} onValueChange={(v) => setProfile({ ...profile, political_view: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
                          <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Liberal">Liberal</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Conservative">Conservative</SelectItem>
                          <SelectItem value="Apolitical">Apolitical</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Pets</Label>
                      <Select value={profile.has_pets} onValueChange={(v) => setProfile({ ...profile, has_pets: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Have dogs">Have dogs</SelectItem>
                          <SelectItem value="Have cats">Have cats</SelectItem>
                          <SelectItem value="Have other pets">Have other pets</SelectItem>
                          <SelectItem value="Love pets but don't have">Love pets but don't have</SelectItem>
                          <SelectItem value="Not a pet person">Not a pet person</SelectItem>
                          <SelectItem value="Allergic to pets">Allergic to pets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Ethnicity</Label>
                      <Select value={profile.ethnicity} onValueChange={(v) => setProfile({ ...profile, ethnicity: v })}>
                        <SelectTrigger className="bg-background/50 border-border/50 rounded-xl h-12">
                          <SelectValue placeholder="Select ethnicity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asian">Asian</SelectItem>
                          <SelectItem value="Black">Black</SelectItem>
                          <SelectItem value="Hispanic/Latino">Hispanic/Latino</SelectItem>
                          <SelectItem value="White/Caucasian">White/Caucasian</SelectItem>
                          <SelectItem value="Arab/Middle Eastern">Arab/Middle Eastern</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {profile.ethnicity && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Specific Background</Label>
                      <Input
                        type="text"
                        value={profile.sub_ethnicity}
                        onChange={(e) => setProfile({ ...profile, sub_ethnicity: e.target.value })}
                        className="bg-background/50 border-border/50 rounded-xl h-12 text-base"
                        placeholder="E.g., Chinese, Nigerian, Mexican, etc."
                      />
                    </div>
                  )}
                </div>
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
                    <label className="w-full h-full bg-muted rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={loading}
                        data-testid={`add-photo-${i}`}
                      />
                      {loading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </>
                      )}
                    </label>
                  ) : (
                    <div className="w-full h-full bg-muted rounded-xl" />
                  )}
                </div>
              ))}
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground mt-2">
                Click to upload photos from your device (Max 10MB each)
              </p>
            )}
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

            <div className="pt-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setShowSettings(false);
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <AlertTriangle className="w-6 h-6" />
              <DialogTitle className="text-xl">Delete Account</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <p className="text-sm font-medium text-destructive mb-2">What will be deleted:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your profile and photos</li>
                <li>• All matches and conversations</li>
                <li>• Sent and received likes</li>
                <li>• Premium subscription (if active)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-password">Enter your password to confirm</Label>
              <Input
                id="delete-password"
                type="password"
                placeholder="Enter password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-muted/50 border-border"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeletePassword('');
              }}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={loading || !deletePassword}
              className="flex-1"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}
