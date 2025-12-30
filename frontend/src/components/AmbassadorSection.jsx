import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Award, Users, Star, TrendingUp, Check, Sparkles, Crown, Zap } from 'lucide-react';
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
      const token = localStorage.getItem('token');
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
        // Reload user to update ambassador badge
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

  // If user is already an ambassador
  if (status?.is_ambassador) {
    return (
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Ember Ambassador</h3>
            <p className="text-sm text-muted-foreground">You are representing Ember!</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="w-4 h-4" />
            <span>2 months Premium active</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="w-4 h-4" />
            <span>Ambassador badge on profile</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="w-4 h-4" />
            <span>Highlighted in Discover</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-red-500/5 border border-yellow-500/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Become an Ember Ambassador</h3>
              <p className="text-sm text-muted-foreground">
                {info.available_slots} of {info.total_limit} spots remaining
              </p>
            </div>
          </div>
          
          {info.is_full ? (
            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs font-medium text-red-400">Program Full</p>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs font-medium text-green-400">Now Open</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <p className="text-xs font-medium text-muted-foreground">Premium</p>
            </div>
            <p className="text-sm font-bold text-foreground">2 Months Free</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-medium text-muted-foreground">Visibility</p>
            </div>
            <p className="text-sm font-bold text-foreground">Priority Queue</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-red-500" />
              <p className="text-xs font-medium text-muted-foreground">Badge</p>
            </div>
            <p className="text-sm font-bold text-foreground">Ambassador</p>
          </div>
          
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-medium text-muted-foreground">Features</p>
            </div>
            <p className="text-sm font-bold text-foreground">Social Media</p>
          </div>
        </div>

        {info.is_full ? (
          <Button disabled className="w-full" variant="outline">
            Applications Closed
          </Button>
        ) : (
          <Button
            onClick={() => setShowDialog(true)}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
          >
            Apply Now
          </Button>
        )}
      </div>

      {/* Application Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-xl">Become an Ambassador</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground">
              Join an exclusive group of {info.total_limit} Ember ambassadors
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <p className="text-sm font-semibold text-foreground mb-3">Your Benefits:</p>
              {info.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2 mb-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                By applying, you agree to represent Ember authentically and positively in the dating community. 
                Spots are limited to {info.total_limit} ambassadors.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              {loading ? 'Applying...' : 'Confirm Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
