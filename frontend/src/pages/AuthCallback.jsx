import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import { Flame } from 'lucide-react';

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use useRef to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      // Extract session_id from URL fragment
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        toast.error('Authentication failed');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/google/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        login(response.data.user, null);
        toast.success('Welcome to Ember!');
        
        // Clear the hash and navigate
        window.history.replaceState(null, '', window.location.pathname);
        navigate(response.data.user.is_profile_complete ? '/discover' : '/setup', { 
          replace: true,
          state: { user: response.data.user }
        });
      } catch (error) {
        console.error('Session error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    processSession();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Flame className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
