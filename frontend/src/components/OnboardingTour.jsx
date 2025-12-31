import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Ember! 🔥',
    description: 'Let\'s take a quick tour to show you around. You can skip this anytime or revisit it later from Settings.',
    highlight: null,
    position: 'center'
  },
  {
    id: 'discover',
    title: 'Discover Profiles',
    description: 'Swipe right to like someone, left to pass. The heart icon below sends a regular like, the star is a Super Like, and the rose shows you\'re really interested!',
    highlight: 'discover-card',
    position: 'bottom'
  },
  {
    id: 'profile-details',
    title: 'Get to Know Them',
    description: 'Tap on any photo to see more details. You can view their bio, prompts, interests, and what they\'re looking for. The verified badge means they\'ve confirmed their identity.',
    highlight: 'profile-info',
    position: 'top'
  },
  {
    id: 'likes',
    title: 'See Who Likes You',
    description: 'People who like you will appear here. With Premium, you can see everyone who liked you and match instantly. Otherwise, you\'ll discover mutual likes when swiping.',
    highlight: 'nav-likes',
    position: 'top'
  },
  {
    id: 'matches',
    title: 'Your Matches',
    description: 'When someone likes you back, it\'s a match! Send them a message within 12 hours or the match expires. Don\'t worry, we\'ll remind you!',
    highlight: 'nav-matches',
    position: 'top'
  },
  {
    id: 'messages',
    title: 'Start Conversations',
    description: 'Chat with your matches here. You can send messages, virtual gifts 🎁, suggest date ideas 📍, play icebreaker games 🎮, or even start a video call 📞!',
    highlight: 'messages-section',
    position: 'top'
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Make a great first impression! Add photos, write a bio, answer prompts, and select your interests. You can also upload a video to stand out even more.',
    highlight: 'nav-profile',
    position: 'top'
  },
  {
    id: 'premium',
    title: 'Unlock Premium Features',
    description: 'Upgrade to Premium to see who likes you, get unlimited swipes, send more Super Likes and Roses, and access advanced filters to find your perfect match.',
    highlight: 'premium-info',
    position: 'center'
  },
  {
    id: 'tips',
    title: 'Pro Tips',
    description: 'Check out the Tips page for advice on creating the perfect profile, starting great conversations, and staying safe while dating.',
    highlight: 'nav-tips',
    position: 'top'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Start swiping, matching, and chatting! Remember, be yourself, be respectful, and have fun. Good luck finding your perfect match on Ember!',
    highlight: null,
    position: 'center'
  }
];

export default function OnboardingTour({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('ember_tour_completed', 'true');
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('ember_tour_skipped', 'true');
    if (onSkip) onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Tour Card */}
      <div className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-background via-background to-orange-500/5 border border-orange-500/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {tourSteps.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            {step.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Demo Profile Preview (for specific steps) */}
        {step.id === 'discover' && (
          <div className="px-6 pb-4">
            <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-gradient-to-br from-muted/50 to-background">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                alt="Demo Profile"
                className="w-full h-48 object-cover opacity-50"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-semibold">Alex Demo, 28</p>
                <p className="text-white/80 text-sm">Artist & Adventure Seeker</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="p-6 pt-4 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex-1 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentStep === tourSteps.length - 1 ? (
            <Button
              onClick={handleComplete}
              className="flex-1 ember-gradient rounded-full text-white font-semibold"
            >
              Get Started
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 ember-gradient rounded-full text-white font-semibold"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Skip Link */}
        <div className="pb-4 text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}
