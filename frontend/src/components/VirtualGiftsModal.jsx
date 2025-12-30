import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, Send, Heart } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';

export default function VirtualGiftsModal({ open, onClose, matchId, onSendGift }) {
  const [gifts, setGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (open) {
      fetchGifts();
    }
  }, [open]);

  const fetchGifts = async () => {
    try {
      const response = await axios.get(`${API}/virtual-gifts`, {
        headers,
        withCredentials: true
      });
      setGifts(response.data.gifts);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      toast.error('Failed to load gifts');
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error('Please select a gift');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/virtual-gifts/send`,
        {
          match_id: matchId,
          gift_id: selectedGift.id,
          message: message.trim()
        },
        { headers, withCredentials: true }
      );

      toast.success(`${selectedGift.emoji} Gift sent!`);
      if (onSendGift) {
        onSendGift(response.data.message);
      }
      onClose();
      setSelectedGift(null);
      setMessage('');
    } catch (error) {
      console.error('Error sending gift:', error);
      toast.error('Failed to send gift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Send a Virtual Gift</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Make your match smile with a special gift
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Gift Selection */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Select a gift</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {gifts.map((gift) => (
                <Card
                  key={gift.id}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedGift?.id === gift.id
                      ? 'ring-2 ring-primary bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedGift(gift)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">{gift.emoji}</div>
                    <p className="text-xs font-medium truncate">{gift.name}</p>
                    <p className="text-xs text-muted-foreground">{gift.points}pts</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Gift Preview */}
          {selectedGift && (
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="text-5xl">{selectedGift.emoji}</div>
                <div className="flex-1">
                  <h4 className="font-semibold">{selectedGift.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedGift.description}</p>
                  <p className="text-xs text-primary mt-1">{selectedGift.points} points</p>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Add a message (optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say something sweet..."
              className="bg-muted border-border resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {message.length}/200
            </p>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendGift}
            disabled={!selectedGift || loading}
            className="w-full ember-gradient h-12 text-lg"
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Gift {selectedGift && selectedGift.emoji}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
