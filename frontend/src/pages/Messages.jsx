import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Phone, Video, Sparkles, MoreVertical, Check, CheckCheck, Edit2, Trash2, Gamepad2, MapPin, Star, Gift } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import IcebreakerGameModal from '@/components/IcebreakerGameModal';
import DateSuggestionsModal from '@/components/DateSuggestionsModal';
import VirtualGiftsModal from '@/components/VirtualGiftsModal';
import { useAuth, API } from '@/App';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { VideoCall, IncomingCallModal } from '@/components/VideoCall';
import axios from 'axios';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lastMessage, sendTypingIndicator, isConnected } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [match, setMatch] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [starters, setStarters] = useState([]);
  const [showStarters, setShowStarters] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showGameModal, setShowGameModal] = useState(false);
  const [showDateSuggestionsModal, setShowDateSuggestionsModal] = useState(false);
  const [showGiftsModal, setShowGiftsModal] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchData();
    // Only poll if WebSocket is not connected
    let interval;
    if (!isConnected) {
      interval = setInterval(fetchMessages, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, isConnected]);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'new_message' && lastMessage.message?.match_id === matchId) {
      setMessages(prev => [...prev, lastMessage.message]);
      scrollToBottom();
    } else if (lastMessage.type === 'message_read') {
      // Update message read status
      setMessages(prev => prev.map(msg => 
        msg.message_id === lastMessage.message_id 
          ? { ...msg, read: true, read_at: lastMessage.read_at }
          : msg
      ));
    } else if (lastMessage.type === 'message_edited') {
      // Update edited message
      setMessages(prev => prev.map(msg =>
        msg.message_id === lastMessage.message.message_id
          ? lastMessage.message
          : msg
      ));
    } else if (lastMessage.type === 'message_deleted') {
      // Update deleted message
      setMessages(prev => prev.map(msg =>
        msg.message_id === lastMessage.message_id
          ? { ...msg, is_deleted: true, content: 'Message deleted' }
          : msg
      ));
    } else if (lastMessage.type === 'typing' && lastMessage.match_id === matchId) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    } else if (lastMessage.type === 'incoming_call') {
      setIncomingCall(lastMessage);
    } else if (lastMessage.type === 'call_ended' && activeCall?.call_id === lastMessage.call_id) {
      setActiveCall(null);
    }
  }, [lastMessage, matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      const matchesRes = await axios.get(`${API}/matches`, { headers, withCredentials: true });
      const currentMatch = matchesRes.data.find(m => m.match_id === matchId);
      if (!currentMatch) {
        toast.error('Match not found');
        navigate('/matches');
        return;
      }
      setMatch(currentMatch);
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


  const startEditMessage = (message) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const saveEditMessage = async () => {
    if (!editContent.trim() || !editingMessage) return;

    try {
      const response = await axios.put(
        `${API}/messages/${editingMessage.message_id}`,
        { content: editContent.trim() },
        { headers, withCredentials: true }
      );

      // Update message in state
      setMessages(messages.map(m =>
        m.message_id === editingMessage.message_id ? response.data : m
      ));
      
      toast.success('Message edited');
      cancelEdit();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to edit message');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;

    try {
      await axios.delete(`${API}/messages/${messageId}`, {
        headers,
        withCredentials: true
      });

      // Update message in state
      setMessages(messages.map(m =>
        m.message_id === messageId ? { ...m, is_deleted: true, content: 'Message deleted' } : m
      ));
      
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete message');
    }
  };


  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    // Send typing indicator via WebSocket
    if (isConnected) {
      sendTypingIndicator(matchId);
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

  const initiateCall = async (type) => {
    try {
      const response = await axios.post(`${API}/calls/initiate`, {
        match_id: matchId,
        type
      }, { headers, withCredentials: true });

      setActiveCall({
        call_id: response.data.call_id,
        call_type: type,
        is_caller: true,
        other_user: match?.other_user,
        status: 'ringing'
      });
    } catch (error) {
      toast.error('Failed to start call');
    }
  };

  const answerCall = async () => {
    try {
      await axios.post(`${API}/calls/${incomingCall.call_id}/answer`, {}, { headers, withCredentials: true });
      setActiveCall({
        call_id: incomingCall.call_id,
        call_type: incomingCall.call_type,
        is_caller: false,
        other_user: incomingCall.caller,
        status: 'connected'
      });
      setIncomingCall(null);
    } catch (error) {
      toast.error('Failed to answer call');
    }
  };

  const rejectCall = async () => {
    try {
      await axios.post(`${API}/calls/${incomingCall.call_id}/reject`, {}, { headers, withCredentials: true });
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const otherUser = match?.other_user;

  // If in a call, show VideoCall component
  if (activeCall) {
    return (
      <VideoCall
        callData={activeCall}
        onEnd={() => setActiveCall(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="messages-page">
      {/* Incoming call modal */}
      <IncomingCallModal
        callData={incomingCall}
        onAnswer={answerCall}
        onReject={rejectCall}
      />

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
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20">
                  <img
                    src={otherUser?.photos?.[0] || 'https://via.placeholder.com/40'}
                    alt={otherUser?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {isConnected && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div>
                <h1 className="font-semibold">{otherUser?.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {isTyping ? 'Typing...' : isConnected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGiftsModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-purple-500"
              title="Send a virtual gift"
            >
              <Gift className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDateSuggestionsModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-rose-500"
              title="Suggest a date spot"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowGameModal(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-primary"
              title="Play icebreaker game"
            >
              <Gamepad2 className="w-5 h-5" />
            </button>
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
          {messages.map((msg) => {
            const isSent = msg.sender_id === user?.user_id;
            const canEdit = isSent && !msg.is_deleted && !msg.edited;
            const sentTime = new Date(msg.created_at || msg.sent_at);
            const timeDiff = (new Date() - sentTime) / 1000 / 60; // minutes
            const canEditTime = timeDiff < 15;

            return (
              <div
                key={msg.message_id}
                className={`flex ${isSent ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="relative">
                  {/* Edit/Delete buttons for own messages */}
                  {isSent && !msg.is_deleted && (
                    <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {canEdit && canEditTime && (
                        <button
                          onClick={() => startEditMessage(msg)}
                          className="p-1.5 rounded-lg bg-card hover:bg-muted border border-border transition-colors"
                          title="Edit message (within 15 min)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMessage(msg.message_id)}
                        className="p-1.5 rounded-lg bg-card hover:bg-destructive/10 border border-border hover:border-destructive transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  )}

                  <div
                    className={`message-bubble ${isSent ? 'message-sent' : 'message-received'} ${msg.is_deleted ? 'opacity-60 italic' : ''}`}
                    data-testid={`message-${msg.message_id}`}
                  >
                    {msg.type === 'date_suggestion' && msg.date_suggestion ? (
                      <div className="space-y-2">
                        <p className="font-medium">{msg.content}</p>
                        <div className="bg-black/20 rounded-lg p-3 mt-2 space-y-2">
                          <h4 className="font-semibold text-sm">{msg.date_suggestion.name}</h4>
                          {msg.date_suggestion.address && (
                            <p className="text-xs opacity-80">{msg.date_suggestion.address}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            {msg.date_suggestion.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span>{msg.date_suggestion.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {msg.date_suggestion.price_level && msg.date_suggestion.price_level !== 'PRICE_LEVEL_UNSPECIFIED' && (
                              <span className="opacity-80">{msg.date_suggestion.price_level.replace('PRICE_LEVEL_', '')}</span>
                            )}
                          </div>
                          {msg.date_suggestion.maps_url && (
                            <a
                              href={msg.date_suggestion.maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs underline hover:no-underline mt-2"
                            >
                              <MapPin className="w-3 h-3" />
                              View on Maps
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <p className={`text-xs ${isSent ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {formatDistanceToNow(sentTime, { addSuffix: true })}
                        {msg.edited && <span className="ml-1">(edited)</span>}
                      </p>
                      {/* Read receipts for sent messages */}
                      {isSent && !msg.is_deleted && (
                        <span className="ml-1">
                          {msg.read ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Check className="w-3 h-3 text-white/50" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="message-bubble message-received">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

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
                  onClick={() => selectStarter(starter)}
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
        <div className="max-w-lg mx-auto">
          {/* Edit mode indicator */}
          {editingMessage && (
            <div className="mb-2 p-2 bg-primary/10 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Edit2 className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Editing message</span>
              </div>
              <button
                onClick={cancelEdit}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={editingMessage ? (e) => { e.preventDefault(); saveEditMessage(); } : sendMessage} className="flex gap-2">
            {!editingMessage && (
              <button
                type="button"
                onClick={fetchStarters}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors"
                data-testid="starters-btn"
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </button>
            )}
            <Input
              value={editingMessage ? editContent : newMessage}
              onChange={(e) => editingMessage ? setEditContent(e.target.value) : handleTyping(e)}
              placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
              className="flex-1 h-12 bg-muted/50 border-muted focus:border-primary rounded-full px-5"
              data-testid="message-input"
            />
            <Button
              type="submit"
              disabled={editingMessage ? !editContent.trim() : (!newMessage.trim() || sending)}
              className="w-12 h-12 ember-gradient rounded-full p-0"
              data-testid="send-btn"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Icebreaker Game Modal */}
      <IcebreakerGameModal
        open={showGameModal}
        onClose={() => setShowGameModal(false)}
        matchId={matchId}
        otherUserName={otherUser?.name}
        lastMessage={lastMessage}
      />

      {/* Date Suggestions Modal */}
      <DateSuggestionsModal
        open={showDateSuggestionsModal}
        onClose={() => setShowDateSuggestionsModal(false)}
        matchId={matchId}
        onSendSuggestion={(message) => {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }}
      />
    </div>
  );
}
