import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Phone, Video, Sparkles, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [match, setMatch] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [starters, setStarters] = useState([]);
  const [showStarters, setShowStarters] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      // Get match details
      const matchesRes = await axios.get(`${API}/matches`, { headers, withCredentials: true });
      const currentMatch = matchesRes.data.find(m => m.match_id === matchId);
      if (!currentMatch) {
        toast.error('Match not found');
        navigate('/matches');
        return;
      }
      setMatch(currentMatch);

      // Get messages
      await fetchMessages();
    } catch (error) {
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages/${matchId}`, { headers, withCredentials: true });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await axios.post(`${API}/messages`, {
        match_id: matchId,
        content: newMessage.trim()
      }, { headers, withCredentials: true });

      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const fetchStarters = async () => {
    try {
      const otherUserId = match?.other_user?.user_id;
      const response = await axios.post(
        `${API}/ai/conversation-starters${otherUserId ? `/${otherUserId}` : ''}`,
        {},
        { headers, withCredentials: true }
      );
      setStarters(response.data.starters || []);
      setShowStarters(true);
    } catch (error) {
      toast.error('Failed to get conversation starters');
    }
  };

  const selectStarter = (starter) => {
    setNewMessage(starter);
    setShowStarters(false);
  };

  const initiateCall = (type) => {
    toast.info(`${type === 'video' ? 'Video' : 'Voice'} calling coming soon!`);
    // In production, this would initiate WebRTC call
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const otherUser = match?.other_user;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="messages-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/matches')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20">
                <img
                  src={otherUser?.photos?.[0] || 'https://via.placeholder.com/40'}
                  alt={otherUser?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="font-semibold">{otherUser?.name}</h1>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => initiateCall('voice')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              data-testid="voice-call-btn"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => initiateCall('video')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              data-testid="video-call-btn"
            >
              <Video className="w-5 h-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/profile/${otherUser?.user_id}`)}>
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to unmatch?')) {
                      axios.delete(`${API}/matches/${matchId}`, { headers, withCredentials: true })
                        .then(() => {
                          toast.success('Unmatched');
                          navigate('/matches');
                        });
                    }
                  }}
                >
                  Unmatch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 pt-20 pb-24 px-4 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Match info */}
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 ring-4 ring-primary/20">
              <img
                src={otherUser?.photos?.[0] || 'https://via.placeholder.com/80'}
                alt={otherUser?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="font-semibold text-lg">You matched with {otherUser?.name}</h2>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(match.created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Messages list */}
          {messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`flex ${msg.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`message-bubble ${msg.sender_id === user?.user_id ? 'message-sent' : 'message-received'}`}
                data-testid={`message-${msg.message_id}`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user?.user_id ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Conversation Starters */}
      {showStarters && starters.length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-4 animate-slide-up">
          <div className="max-w-lg mx-auto bg-card rounded-2xl p-4 border border-border/50 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Conversation Starters
              </h4>
              <button
                onClick={() => setShowStarters(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {starters.map((starter, i) => (
                <button
                  key={i}
                  onClick={() => useStarter(starter)}
                  className="w-full text-left p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors text-sm"
                  data-testid={`starter-${i}`}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4">
        <form onSubmit={sendMessage} className="max-w-lg mx-auto flex gap-2">
          <button
            type="button"
            onClick={fetchStarters}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
            data-testid="starters-btn"
          >
            <Sparkles className="w-5 h-5 text-primary" />
          </button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-12 bg-muted/50 border-muted focus:border-primary rounded-full px-5"
            data-testid="message-input"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 ember-gradient rounded-full p-0"
            data-testid="send-btn"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
