import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Check, X, Loader2, Star } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';

export default function Premium() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/premium/plans`, { headers, withCredentials: true });
      setPlans(response.data.plans);
      setAddons(response.data.addons || []);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedItem) return;
    setPurchasing(true);
    
    try {
      // Get current origin for redirect URLs
      const originUrl = window.location.origin;
      
      const response = await axios.post(`${API}/payments/checkout`, {
        package_id: selectedItem.id,
        origin_url: originUrl
      }, { headers, withCredentials: true });

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start checkout');
      setPurchasing(false);
    }
  };

  const selectItem = (item, type) => {
    setSelectedItem({ ...item, type });
    setShowConfirm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8" data-testid="premium-page">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent" />
        <div className="container mx-auto px-6 pt-12 pb-16 relative">
          <button
            onClick={() => navigate('/likes')}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            data-testid="back-btn"
            aria-label="Go back to Likes"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 ember-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-wide mb-2">
              EMBER <span className="ember-text-gradient">PREMIUM</span>
            </h1>
            <p className="text-muted-foreground">Get more matches with premium features</p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      {user?.is_premium && (
        <div className="container mx-auto px-6 mb-8">
          <div className="bg-gradient-to-r from-primary/20 to-ember-red/20 rounded-2xl p-4 border border-primary/30">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold">You're a Premium member!</p>
                <p className="text-sm text-muted-foreground">
                  Expires: {new Date(user.premium_expires).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="container mx-auto px-6">
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              onClick={() => selectItem(plan, 'premium')}
              className={`relative bg-card rounded-2xl p-5 border cursor-pointer transition-all ${
                index === 1 
                  ? 'border-primary shadow-lg shadow-primary/20' 
                  : 'border-border/50 hover:border-primary/50'
              }`}
              data-testid={`plan-${plan.id}`}
            >
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 ember-gradient rounded-full text-xs font-bold text-white">
                  MOST POPULAR
                </div>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold ember-text-gradient">${plan.price}</p>
                </div>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Addons */}
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Or buy extras</h3>
          <div className="grid grid-cols-2 gap-4">
            {addons.map((addon) => (
              <button
                key={addon.id}
                onClick={() => selectItem(addon, 'addon')}
                className="bg-card rounded-xl p-4 border border-border/50 hover:border-primary/50 transition-colors text-left"
                data-testid={`addon-${addon.id}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {addon.id.includes('roses') ? (
                    <span className="text-2xl">🌹</span>
                  ) : (
                    <Star className="w-6 h-6 text-blue-400" fill="#60a5fa" />
                  )}
                  <span className="font-semibold">{addon.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {addon.id.includes('roses') ? 'Stand out to someone special' : '3x more likely to match'}
                </p>
                <p className="text-primary font-bold mt-2">${addon.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Current balance */}
        <div className="mt-8 bg-muted rounded-xl p-4">
          <h4 className="font-semibold mb-2">Your Balance</h4>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <span className="text-2xl">🌹</span>
              <p className="font-bold">{user?.roses || 0}</p>
              <p className="text-xs text-muted-foreground">Roses</p>
            </div>
            <div className="text-center">
              <Star className="w-6 h-6 text-blue-400 mx-auto" fill="#60a5fa" />
              <p className="font-bold">{user?.super_likes || 0}</p>
              <p className="text-xs text-muted-foreground">Super Likes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center mb-4">
              {selectedItem?.type === 'premium' ? 'Subscribe to ' : 'Purchase '}
              <strong>{selectedItem?.name}</strong> for{' '}
              <strong className="text-primary">${selectedItem?.price}</strong>?
            </p>
            <p className="text-sm text-muted-foreground text-center mb-6">
              You'll be redirected to Stripe for secure payment.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-full"
                disabled={purchasing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 ember-gradient rounded-full"
                data-testid="confirm-purchase-btn"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  'Pay with Stripe'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
