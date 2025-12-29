import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame, Heart, MessageCircle, Sparkles, Phone } from 'lucide-react';
import { useAuth } from '@/App';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(user.is_profile_complete ? '/discover' : '/setup');
    }
  }, [user, navigate]);

  const features = [
    { icon: Heart, title: 'Meaningful Matches', desc: 'Like specific parts of profiles to spark real conversations' },
    { icon: Sparkles, title: 'AI-Powered', desc: 'Get personalized match suggestions and conversation starters' },
    { icon: MessageCircle, title: 'Rich Profiles', desc: 'Express yourself with photos, videos, and prompts' },
    { icon: Phone, title: 'Video Calls', desc: 'Connect face-to-face with your matches in-app' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-ember-red/20 rounded-full blur-[150px]" />
        
        <div className="container mx-auto px-6 pt-12 pb-20 relative z-10">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-2">
              <Flame className="w-8 h-8 text-primary" />
              <span className="font-heading text-2xl font-bold tracking-wider ember-text-gradient">EMBER</span>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/login')}
                data-testid="nav-login-btn"
              >
                Sign In
              </Button>
              <Button 
                className="ember-gradient rounded-full px-6 ember-glow hover:ember-glow-hover"
                onClick={() => navigate('/register')}
                data-testid="nav-register-btn"
              >
                Get Started
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold tracking-wide mb-6 animate-fade-in">
              <span className="ember-text-gradient">SPARK</span>
              <span className="text-foreground"> SOMETHING</span>
              <br />
              <span className="text-foreground">REAL</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in stagger-2">
              Ember is designed to be deleted. Find meaningful connections through thoughtful interactions, 
              not endless swiping. Because your next great love story starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-3">
              <Button 
                size="lg"
                className="ember-gradient rounded-full px-10 py-6 text-lg font-semibold ember-glow hover:ember-glow-hover animate-pulse-glow"
                onClick={() => navigate('/register')}
                data-testid="hero-get-started-btn"
              >
                Start Your Journey
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="rounded-full px-10 py-6 text-lg border-muted hover:bg-muted"
                onClick={() => navigate('/login')}
                data-testid="hero-login-btn"
              >
                I Have an Account
              </Button>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="relative mt-20 flex justify-center animate-slide-up stagger-4">
            <div className="relative w-72 h-[580px] bg-card rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden">
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-background rounded-b-2xl" />
              
              {/* Mock profile card */}
              <div className="p-4 pt-10">
                <div className="relative rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1759873821395-c29de82a5b99?w=400&h=500&fit=crop" 
                    alt="Profile" 
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                    <h3 className="font-semibold text-xl text-white">Sarah, 24</h3>
                    <p className="text-white/80 text-sm">New York • 2 miles away</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground">A perfect Sunday looks like...</p>
                  <p className="text-foreground mt-1">Brunch, farmers market, and a sunset picnic 🌅</p>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -left-4 top-1/3 p-3 glass rounded-xl animate-fade-in stagger-5">
              <Heart className="w-6 h-6 text-primary" fill="#FF5500" />
            </div>
            <div className="absolute -right-4 top-1/2 p-3 glass rounded-xl animate-fade-in stagger-5">
              <Sparkles className="w-6 h-6 text-ember-gold" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-card/50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-12 tracking-wide">
            WHY <span className="ember-text-gradient">EMBER</span>?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div 
                key={feature.title}
                className={`p-6 bg-card rounded-2xl border border-border/50 hover:border-primary/50 transition-colors duration-300 animate-fade-in stagger-${i + 1}`}
              >
                <div className="w-12 h-12 ember-gradient rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-6 tracking-wide">
            READY TO FIND YOUR <span className="ember-text-gradient">SPARK</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of people who have already found meaningful connections on Ember.
          </p>
          <Button 
            size="lg"
            className="ember-gradient rounded-full px-10 py-6 text-lg font-semibold ember-glow hover:ember-glow-hover"
            onClick={() => navigate('/register')}
            data-testid="cta-get-started-btn"
          >
            Create Your Profile
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <span className="font-heading text-lg font-bold tracking-wider">EMBER</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 Ember. Spark something real.</p>
        </div>
      </footer>
    </div>
  );
}
