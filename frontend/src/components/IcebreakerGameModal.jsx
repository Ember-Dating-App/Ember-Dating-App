import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Gamepad2, X, Send, Trophy, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';

export default function IcebreakerGameModal({ open, onClose, matchId, otherUserName, lastMessage }) {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch available games
  useEffect(() => {
    if (open && games.length === 0) {
      fetchGames();
    }
  }, [open]);

  // Listen for WebSocket updates
  useEffect(() => {
    if (!lastMessage || !session) return;

    if (lastMessage.type === 'icebreaker_answer' && lastMessage.session_id === session.session_id) {
      // Refresh session to get updated answers
      fetchSession(session.session_id);
    }
  }, [lastMessage, session]);

  const fetchGames = async () => {
    try {
      const response = await axios.get(`${API}/icebreakers/games`, {
        headers,
        withCredentials: true
      });
      setGames(response.data.games);
    } catch (error) {
      toast.error('Failed to load games');
    }
  };

  const startGame = async (gameType) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/icebreakers/start`,
        { match_id: matchId, game_type: gameType },
        { headers, withCredentials: true }
      );
      setSession(response.data);
      setSelectedGame(gameType);
      toast.success('Game started!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start game');
    } finally {
      setLoading(false);
    }
  };

  const fetchSession = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/icebreakers/${sessionId}`, {
        headers,
        withCredentials: true
      });
      setSession(response.data);
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API}/icebreakers/${session.session_id}/answer`,
        { answer: answer.trim() },
        { headers, withCredentials: true }
      );
      setAnswer('');
      toast.success('Answer submitted!');
      // Refresh session
      fetchSession(session.session_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const closeGame = () => {
    setSelectedGame(null);
    setSession(null);
    setAnswer('');
    onClose();
  };

  const currentQuestion = session?.questions?.[session.current_question];
  const currentAnswers = session?.answers?.[session.current_question] || {};
  const bothAnswered = Object.keys(currentAnswers).length === 2;

  return (
    <Dialog open={open} onOpenChange={closeGame}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-white/10 max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl text-white">Icebreaker Games</DialogTitle>
          </div>
        </DialogHeader>

        {!selectedGame ? (
          // Game selection
          <div className="space-y-3 py-4">
            <p className="text-muted-foreground text-sm mb-4">
              Break the ice with {otherUserName} by playing a fun game!
            </p>
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => startGame(game.id)}
                disabled={loading}
                className="w-full p-4 bg-card hover:bg-card/80 border border-border rounded-xl text-left transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{game.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white group-hover:text-primary transition-colors">
                      {game.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {game.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : session ? (
          // Game in progress
          <div className="space-y-4 py-4">
            {/* Game header */}
            <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">
                  {games.find(g => g.id === selectedGame)?.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  Question {(session.current_question || 0) + 1} / {session.questions?.length || 0}
                </span>
              </div>
              {session.status === 'completed' && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Trophy className="w-4 h-4" />
                  Game Complete!
                </div>
              )}
            </div>

            {/* Current question */}
            {session.status === 'active' && currentQuestion && (
              <div className="bg-card rounded-xl p-4 border border-border">
                {typeof currentQuestion === 'object' ? (
                  // Would You Rather format
                  <div>
                    <p className="text-white font-medium mb-3">{currentQuestion.q}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => { setAnswer(currentQuestion.a); }}
                        variant={answer === currentQuestion.a ? 'default' : 'outline'}
                        className="flex-1"
                        disabled={loading}
                      >
                        {currentQuestion.a}
                      </Button>
                      <Button
                        onClick={() => { setAnswer(currentQuestion.b); }}
                        variant={answer === currentQuestion.b ? 'default' : 'outline'}
                        className="flex-1"
                        disabled={loading}
                      >
                        {currentQuestion.b}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Quick Questions format
                  <div>
                    <p className="text-white font-medium mb-3">{currentQuestion}</p>
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="bg-muted border-border"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Answers display */}
            {bothAnswered && (
              <div className="bg-muted rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Answers:</p>
                {Object.entries(currentAnswers).map(([userId, userAnswer], idx) => (
                  <div key={userId} className="bg-background rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {idx === 0 ? 'You' : otherUserName}
                    </p>
                    <p className="text-white">{userAnswer}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Submit button */}
            {session.status === 'active' && !bothAnswered && (
              <Button
                onClick={submitAnswer}
                disabled={!answer.trim() || loading}
                className="w-full ember-gradient"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Answer'}
              </Button>
            )}

            {/* Waiting for other user */}
            {session.status === 'active' && bothAnswered && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Moving to next question...
                </p>
              </div>
            )}

            {/* Game completed */}
            {session.status === 'completed' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Great job!</h3>
                <p className="text-muted-foreground">
                  You've completed the game together
                </p>
                <Button onClick={closeGame} className="mt-4 ember-gradient">
                  Close
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
