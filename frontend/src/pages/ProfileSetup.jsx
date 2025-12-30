import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, Camera, Plus, X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

const STEPS = ['basics', 'photos', 'prompts', 'interests'];

const PROMPTS_LIBRARY = [
  "A perfect Sunday looks like...",
  "I'm looking for someone who...",
  "The way to win me over is...",
  "My most irrational fear is...",
  "I geek out on...",
  "Two truths and a lie...",
  "Unusual skills I have...",
  "My simple pleasures are...",
  "I'll pick the restaurant if you...",
  "Together we could...",
  "Dating me is like...",
  "My love language is...",
];

const INTERESTS = [
  'Travel', 'Music', 'Movies', 'Fitness', 'Cooking', 'Art', 'Photography', 'Reading',
  'Gaming', 'Sports', 'Hiking', 'Yoga', 'Dancing', 'Wine', 'Coffee', 'Dogs', 'Cats',
  'Tech', 'Fashion', 'Food', 'Nature', 'Beach', 'Mountains', 'Concerts', 'Festivals'
];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
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

  const token = localStorage.getItem('ember_token');

  const updateProfile = async (data) => {
    try {
      const response = await axios.put(`${API}/profile`, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      await updateProfile(profile);
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      } else {
        toast.success('Profile complete! Start discovering matches.');
        navigate('/discover');
      }
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const addPhoto = (url) => {
    if (profile.photos.length < 6) {
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
          `${API}/upload/photo`,
          { photo_data: base64 },
          { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true }
        );

        const photoUrl = response.data.url;
        addPhoto(photoUrl);
        toast.success('Photo uploaded successfully!');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
      setLoading(false);
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

  const toggleInterest = (interest) => {
    if (profile.interests.includes(interest)) {
      setProfile({ ...profile, interests: profile.interests.filter(i => i !== interest) });
    } else if (profile.interests.length < 10) {
      setProfile({ ...profile, interests: [...profile.interests, interest] });
    }
  };

  const isStepValid = () => {
    switch (STEPS[step]) {
      case 'basics':
        return profile.age && profile.gender && profile.interested_in;
      case 'photos':
        return profile.photos.length >= 1;
      case 'prompts':
        return profile.prompts.length >= 1 && profile.prompts.every(p => p.answer.trim());
      case 'interests':
        return profile.interests.length >= 3;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (STEPS[step]) {
      case 'basics':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold mb-2">The basics</h2>
              <p className="text-muted-foreground">Let's start with some essential info</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your age</Label>
                <Input
                  type="number"
                  min="18"
                  max="100"
                  placeholder="18"
                  className="h-12 bg-muted/50 border-muted focus:border-primary rounded-xl"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || '' })}
                  data-testid="age-input"
                />
              </div>

              <div className="space-y-2">
                <Label>I am a</Label>
                <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                  <SelectTrigger className="h-12 bg-muted/50 border-muted rounded-xl" data-testid="gender-select">
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
                <Label>I'm interested in</Label>
                <Select value={profile.interested_in} onValueChange={(v) => setProfile({ ...profile, interested_in: v })}>
                  <SelectTrigger className="h-12 bg-muted/50 border-muted rounded-xl" data-testid="interested-select">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                    <SelectItem value="everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="City, Country"
                  className="h-12 bg-muted/50 border-muted focus:border-primary rounded-xl"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  data-testid="location-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Bio (optional)</Label>
                <Textarea
                  placeholder="Tell potential matches a bit about yourself..."
                  className="bg-muted/50 border-muted focus:border-primary rounded-xl min-h-[100px]"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  data-testid="bio-input"
                />
              </div>
            </div>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold mb-2">Add your photos</h2>
              <p className="text-muted-foreground">Upload at least 1 photo (up to 6)</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] relative">
                  {profile.photos[i] ? (
                    <div className="relative w-full h-full rounded-xl overflow-hidden group">
                      <img src={profile.photos[i]} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`remove-photo-${i}`}
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-full bg-muted rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground text-center px-2">Upload photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={loading}
                        data-testid={`photo-input-${i}`}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>

            {loading && (
              <div className="text-center text-muted-foreground">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm">Uploading photo...</p>
              </div>
            )}

            <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Photo Tips</p>
                  <ul className="space-y-1">
                    <li>• Choose clear, well-lit photos</li>
                    <li>• Include a mix of close-up and full-body shots</li>
                    <li>• Show your genuine smile and personality</li>
                    <li>• Maximum file size: 10MB per photo</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'prompts':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold mb-2">Answer prompts</h2>
              <p className="text-muted-foreground">Choose 1-3 prompts to help matches get to know you</p>
            </div>

            {profile.prompts.map((prompt, i) => (
              <div key={i} className="bg-muted rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <p className="text-primary font-medium">{prompt.question}</p>
                  <button onClick={() => removePrompt(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Textarea
                  placeholder="Your answer..."
                  className="bg-background border-none focus:ring-0 min-h-[80px]"
                  value={prompt.answer}
                  onChange={(e) => updatePromptAnswer(i, e.target.value)}
                  data-testid={`prompt-answer-${i}`}
                />
              </div>
            ))}

            {profile.prompts.length < 3 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select a prompt:</p>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {PROMPTS_LIBRARY.filter(p => !profile.prompts.find(pp => pp.question === p)).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => addPrompt(prompt)}
                      className="text-left p-3 bg-card rounded-xl hover:bg-muted transition-colors border border-border/50"
                      data-testid={`prompt-option-${i}`}
                    >
                      <span className="text-primary">+</span> {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'interests':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your interests</h2>
              <p className="text-muted-foreground">Select 3-10 interests to help us find compatible matches</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    profile.interests.includes(interest)
                      ? 'ember-gradient text-white ember-glow'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  data-testid={`interest-${interest.toLowerCase()}`}
                >
                  {profile.interests.includes(interest) && <Check className="w-4 h-4 inline mr-1" />}
                  {interest}
                </button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              {profile.interests.length}/10 selected (min 3)
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold tracking-wider ember-text-gradient">EMBER</span>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-32 px-6">
        <div className="max-w-lg mx-auto">
          {renderStep()}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4">
        <div className="max-w-lg mx-auto flex gap-4">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-12 rounded-full border-muted"
              data-testid="back-btn"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!isStepValid() || loading}
            className="flex-1 h-12 ember-gradient rounded-full font-semibold ember-glow hover:ember-glow-hover disabled:opacity-50"
            data-testid="next-btn"
          >
            {loading ? 'Saving...' : step === STEPS.length - 1 ? 'Complete' : 'Next'}
            {!loading && step < STEPS.length - 1 && <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}
