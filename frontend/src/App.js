import { useEffect, useState, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProfileSetup from "@/pages/ProfileSetup";
import Discover from "@/pages/Discover";
import Likes from "@/pages/Likes";
import Tips from "@/pages/Tips";
import Matches from "@/pages/Matches";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import AuthCallback from "@/pages/AuthCallback";
import Premium from "@/pages/Premium";
import Standouts from "@/pages/Standouts";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Verification from "@/pages/Verification";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import DailyPicksTab from "@/components/DailyPicksTab";

// Hooks
import useNotifications from "@/hooks/useNotifications";

// Contexts
import { WebSocketProvider } from "@/contexts/WebSocketContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
import { createContext, useContext } from "react";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('ember_token'));

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    if (authToken) {
      localStorage.setItem('ember_token', authToken);
    }
  };

  const logout = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/auth/logout`, {}, { headers });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('ember_token');
  };

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('ember_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${storedToken}` };
      const response = await axios.get(`${API}/auth/me`, { headers });
      setUser(response.data);
      setToken(storedToken);
    } catch (e) {
      console.error('Auth check failed:', e);
      setUser(null);
      setToken(null);
      localStorage.removeItem('ember_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to profile setup if not complete
  if (!user.is_profile_complete && location.pathname !== '/setup' && location.pathname !== '/verification') {
    return <Navigate to="/setup" replace />;
  }

  // Redirect to verification if not verified
  if (user.is_profile_complete && user.verification_status !== 'verified' && location.pathname !== '/verification') {
    return <Navigate to="/verification" replace />;
  }

  return children;
};

// App Router
function AppRouter() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Setup push notifications
  useNotifications(user);
  
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/setup" element={
        <ProtectedRoute>
          <ProfileSetup />
        </ProtectedRoute>
      } />
      <Route path="/verification" element={
        <ProtectedRoute>
          <Verification />
        </ProtectedRoute>
      } />
      <Route path="/discover" element={
        <ProtectedRoute>
          <Discover />
        </ProtectedRoute>
      } />
      <Route path="/likes" element={
        <ProtectedRoute>
          <Likes />
        </ProtectedRoute>
      } />
      <Route path="/tips" element={
        <ProtectedRoute>
          <Tips />
        </ProtectedRoute>
      } />
      <Route path="/matches" element={
        <ProtectedRoute>
          <Matches />
        </ProtectedRoute>
      } />
      <Route path="/messages/:matchId" element={
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/premium" element={
        <ProtectedRoute>
          <Premium />
        </ProtectedRoute>
      } />
      <Route path="/standouts" element={
        <ProtectedRoute>
          <Standouts />
        </ProtectedRoute>
      } />
      <Route path="/daily-picks" element={
        <ProtectedRoute>
          <DailyPicksTab />
        </ProtectedRoute>
      } />
      <Route path="/payment/success" element={
        <ProtectedRoute>
          <PaymentSuccess />
        </ProtectedRoute>
      } />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background">
      <BrowserRouter>
        <AuthProvider>
          <WebSocketProvider>
            <AppRouter />
            <Toaster position="top-center" richColors />
          </WebSocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
