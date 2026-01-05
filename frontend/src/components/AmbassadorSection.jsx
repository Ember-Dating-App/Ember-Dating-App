import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Award, Users, Star, TrendingUp, Check, Sparkles, Crown, Zap, BadgeCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';

export default function AmbassadorSection({ user }) {
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    loadAmbassadorInfo();
    if (user) {
      loadAmbassadorStatus();
    }
  }, [user]);

  const loadAmbassadorInfo = async () => {
    try {
      const response = await axios.get(`${API}/ambassador/info`);
      setInfo(response.data);
    } catch (error) {
      console.error('Error loading ambassador info:', error);
    }
  };

  const loadAmbassadorStatus = async () => {
    try {
      const token = localStorage.getItem('ember_token');
      const response = await axios.get(`${API}/ambassador/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(response.data);
    } catch (error) {
      console.error('Error loading ambassador status:', error);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/ambassador/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        await loadAmbassadorInfo();
        await loadAmbassadorStatus();
        setShowDialog(false);
        window.location.reload();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to apply');
    } finally {
      setLoading(false);
    }
  };

  if (!info) return null;

  // If user is already an ambassador - Premium Success State
  if (status?.is_ambassador) {
    return (
      <div className="mt-8 relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-amber-600/10">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-orange-500/10 pointer-events-none" />
        
        <div className="relative p-6">
          {/* Header with animated badge */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                  <Award className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Ember Ambassador
                  </h3>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground">Active Member • Elite Status</p>
              </div>
            </div>
          </div>

          {/* Active Benefits Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="group p-4 rounded-xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-yellow-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Premium</p>
              </div>
              <p className="text-sm font-bold text-foreground">2 Months Active</p>
              <div className="flex items-center gap-1 mt-1">
                <Check className="w-3 h-3 text-green-400" />
                <p className="text-xs text-green-400">Unlocked</p>
              </div>
            </div>

            <div className="group p-4 rounded-xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-orange-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Priority</p>
              </div>
              <p className="text-sm font-bold text-foreground">Front of Queue</p>
              <div className="flex items-center gap-1 mt-1">
                <Check className="w-3 h-3 text-green-400" />
                <p className="text-xs text-green-400">Active</p>
              </div>
            </div>

            <div className="group p-4 rounded-xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Badge</p>
              </div>
              <p className="text-sm font-bold text-foreground">Ambassador</p>
              <div className="flex items-center gap-1 mt-1">
                <Check className="w-3 h-3 text-green-400" />
                <p className="text-xs text-green-400">Visible</p>
              </div>
            </div>

            <div className="group p-4 rounded-xl bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm border border-border/50 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">Feature</p>
              </div>
              <p className="text-sm font-bold text-foreground">Social Media</p>
              <div className="flex items-center gap-1 mt-1">
                <Check className="w-3 h-3 text-green-400" />
                <p className="text-xs text-green-400">Eligible</p>
              </div>
            </div>
          </div>

          {/* Thank you message */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <p className="text-sm text-center text-muted-foreground">
              Thank you for representing <span className="font-semibold text-foreground">Ember</span> 🔥
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Application State - Premium Design
  return (
    <>
      <div className="mt-8 relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-background via-background to-yellow-500/5">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full blur-2xl" />
        
        <div className="relative p-6">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-xl shadow-yellow-500/20 group-hover:shadow-yellow-500/40 transition-all">
                  <Award className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-foreground">Ember Ambassador</h3>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground">Join an exclusive community</p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              {info.is_full ? (
                <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                  <p className="text-xs font-semibold text-red-400">Full</p>
                </div>
              ) : (
                <>
                  <div className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <p className="text-xs font-semibold text-green-400">Open</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{info.available_slots}/{info.total_limit} spots</p>
                </>
              )}
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="group p-4 rounded-xl bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/10 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Premium</p>
                  <p className="text-sm font-bold text-foreground">2 Months Free</p>
                </div>
              </div>
            </div>

            <div className="group p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/20 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Visibility</p>
                  <p className="text-sm font-bold text-foreground">Priority Queue</p>
                </div>
              </div>
            </div>

            <div className="group p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BadgeCheck className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Badge</p>
                  <p className="text-sm font-bold text-foreground">Ambassador</p>
                </div>
              </div>
            </div>

            <div className="group p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Feature</p>
                  <p className="text-sm font-bold text-foreground">Social Media</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          {info.is_full ? (
            <Button 
              disabled 
              className="w-full h-12 rounded-xl text-base font-semibold"
              variant="outline"
            >
              Applications Closed
            </Button>
          ) : (
            <Button
              onClick={() => setShowDialog(true)}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-yellow-400 via-orange-500 to-amber-600 hover:from-yellow-500 hover:via-orange-600 hover:to-amber-700 text-white font-semibold text-base shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all"
            >
              <Zap className="w-5 h-5 mr-2" />
              Apply Now - Limited Spots
            </Button>
          )}
        </div>
      </div>

      {/* Application Dialog - Premium Design */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-background border-yellow-500/20 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <Award className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <DialogTitle className="text-xl">Become an Ambassador</DialogTitle>
                <p className="text-sm text-muted-foreground">Elite {info.total_limit} member program</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Benefits List */}
            <div className="space-y-2">
              {info.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/5 to-transparent border border-yellow-500/10 hover:border-yellow-500/20 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <p className="text-sm text-foreground">{benefit}</p>
                </div>
              ))}
            </div>

            {/* Info box */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By applying, you agree to represent Ember authentically and positively in the dating community. 
                Limited to {info.total_limit} ambassadors globally.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
              className="flex-1 h-11 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold shadow-lg shadow-yellow-500/25"
            >
              {loading ? 'Applying...' : 'Confirm Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
